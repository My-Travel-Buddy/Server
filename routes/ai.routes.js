/*
ai.routes.js

This router handles the AI features for My Travel Buddy.

POST /api/ai/itinerary
→ Gemini creates a day-by-day itinerary.

GET /api/ai/travel-requirements
→ Gemini provides electrical and packing information.
→ The Visa API provides visa/entry information.

Nothing is saved to the database in these routes.
*/

const router = require("express").Router();

const { rateLimit } = require("express-rate-limit");
const { GoogleGenAI, Type } = require("@google/genai");

// -----------------------------------------------------------------------------
// Rate limit
// -----------------------------------------------------------------------------

// These routes call external APIs, so we limit how often
// one user can call them.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: process.env.NODE_ENV === "production" ? 15 : 100,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    error: "Too many requests. Please wait a few minutes and try again.",
  },
});

// -----------------------------------------------------------------------------
// Gemini client
// -----------------------------------------------------------------------------

// Get the Gemini API key from .env.
//
// We create the client only when a route needs it.
// If the key is missing, the rest of the Express server can still run.
function getGeminiClient() {
  const apiKey = process.env.MY_TRAVEL_BUDDY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({
    apiKey,
  });
}

// =============================================================================
// ITINERARY
// =============================================================================

// -----------------------------------------------------------------------------
// Gemini itinerary response structure
// -----------------------------------------------------------------------------

// This tells Gemini exactly what JSON structure we expect back.
const itinerarySchema = {
  type: Type.OBJECT,

  properties: {
    title: {
      type: Type.STRING,
    },

    summary: {
      type: Type.STRING,
    },

    activities: {
      type: Type.ARRAY,

      items: {
        type: Type.OBJECT,

        properties: {
          day: {
            type: Type.INTEGER,
          },

          time: {
            type: Type.STRING,
          },

          title: {
            type: Type.STRING,
          },

          category: {
            type: Type.STRING,
          },

          estimatedCost: {
            type: Type.NUMBER,
          },

          notes: {
            type: Type.STRING,
          },
        },

        required: [
          "day",
          "time",
          "title",
          "category",
          "estimatedCost",
          "notes",
        ],
      },
    },

    checklist: {
      type: Type.ARRAY,

      items: {
        type: Type.STRING,
      },
    },
  },

  required: ["title", "summary", "activities", "checklist"],
};

// -----------------------------------------------------------------------------
// Count the real trip days
// -----------------------------------------------------------------------------

// Example:
// Aug 10 to Aug 12 = 3 days.
//
// This returns the REAL trip length.
// We do not cap the result here.
function countTripDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00Z`);

  const end = new Date(`${endDate}T00:00:00Z`);

  const days = Math.round((end - start) / 86400000) + 1;

  if (!Number.isFinite(days) || days < 1) {
    return 1;
  }

  return days;
}

// -----------------------------------------------------------------------------
// Create activity date/time
// -----------------------------------------------------------------------------

// Gemini gives us:
//
// day: 2
// time: "09:30"
//
// Our Activity model and calendar need one real dateTime,
// so we combine the trip start date, day, and time here.
function makeDateTime(startDate, day, time) {
  // Clean the time and separate:
  // hour = timeMatch[1]
  // minute = timeMatch[2]
  const timeMatch = /^(\d{1,2}):(\d{2})/.exec(String(time || "").trim());

  if (!timeMatch) {
    return null;
  }

  const date = new Date(`${startDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const dayNumber = Number(day) > 0 ? Number(day) : 1;

  // Move forward to the correct trip day.
  date.setDate(date.getDate() + dayNumber - 1);

  // Set the activity hour and minute.
  date.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);

  return date.toISOString();
}

// -----------------------------------------------------------------------------
// POST /api/ai/itinerary
// -----------------------------------------------------------------------------

router.post("/itinerary", aiLimiter, async (req, res) => {
  const { destination, startDate, endDate, budget, interests } = req.body;

  // Destination and dates are required.
  if (!destination || !startDate || !endDate) {
    return res.status(400).json({
      error: "Destination, start date, and end date are required",
    });
  }

  const ai = getGeminiClient();

  if (!ai) {
    return res.status(503).json({
      error: "AI itinerary generation is not configured on this server.",
    });
  }

  // Make sure interests is always an array.
  const chosenInterests = Array.isArray(interests) ? interests : [];

  // The real number of days in the trip.
  const tripDays = countTripDays(startDate, endDate);

  // We only ask Gemini to generate up to 14 days at once.
  //
  // Example:
  // tripDays = 30
  // generatedDays = 14
  const generatedDays = Math.min(tripDays, 14);

  // -------------------------------------------------------------------------
  // Gemini prompt
  // -------------------------------------------------------------------------

  const prompt = `
Create a detailed ${generatedDays}-day itinerary for ${destination}.

The complete trip is ${tripDays} days long.
Generate the first ${generatedDays} days.

Start date: ${startDate}
End date: ${endDate}
Budget: ${budget || "Moderate"}

Interests: ${
    chosenInterests.length ? chosenInterests.join(", ") : "general sightseeing"
  }

Rules:

- Give 3 activities per day, so ${generatedDays * 3} activities in total.
- "day" starts at 1.
- "time" must use 24-hour format like "09:30".
- "estimatedCost" is per person in US dollars.
- Use 0 if an activity is free.
- Order activities by day and time.
- Do not create activities past day ${generatedDays}.

- "category" must be one of:
  Food,
  Culinary,
  Sightseeing,
  Culture,
  Historic Site,
  Nature,
  Adventure,
  Shopping,
  Transportation,
  Entertainment,
  Other.

- The top-level "title" names the whole trip.
- Each activity "title" names only that activity.
- "notes" should contain one useful sentence.
- "checklist" should contain 6 to 8 preparation items.
`;

  try {
    // Ask Gemini to create the itinerary.
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",

      contents: prompt,

      config: {
        responseMimeType: "application/json",

        responseSchema: itinerarySchema,
      },
    });

    if (!response.text) {
      throw new Error("Gemini returned an empty response.");
    }

    // Convert Gemini JSON text into JavaScript.
    const generated = JSON.parse(response.text);

    // Clean every activity and add a real dateTime.
    //
    // That dateTime is what the React calendar can use.
    const activities = (generated.activities || [])
      .map((activity) => ({
        title: activity.title,

        category: activity.category,

        notes: activity.notes,

        estimatedCost: Number(activity.estimatedCost) || 0,

        day: Number(activity.day) || 1,

        time: activity.time,

        dateTime: makeDateTime(startDate, activity.day, activity.time),
      }))

      // Sort by day first, then time.
      .sort(
        (a, b) => a.day - b.day || String(a.time).localeCompare(String(b.time)),
      );

    // Send the completed itinerary to React.
    return res.json({
      title: generated.title || `${destination} Trip`,

      summary: generated.summary || "",

      destination,

      startDate,

      endDate,

      budget: budget || "Moderate",

      interests: chosenInterests,

      // Real length of the trip.
      tripDays,

      // Number of days Gemini generated.
      generatedDays,

      // React can use this to tell the user
      // that more days still exist.
      hasMoreDays: tripDays > generatedDays,

      activities,

      checklist: generated.checklist || [],
    });
  } catch (error) {
    console.error("AI ITINERARY ERROR:", error.message);

    return res.status(502).json({
      error: "Could not generate an itinerary right now. Please try again.",
    });
  }
});

// =============================================================================
// TRAVEL REQUIREMENTS
// =============================================================================

// -----------------------------------------------------------------------------
// Gemini travel information structure
// -----------------------------------------------------------------------------

// Gemini handles:
//
// - country codes
// - electrical information
// - packing suggestions
//
// The Visa API handles visa information.
const travelSchema = {
  type: Type.OBJECT,

  properties: {
    destinationCountry: {
      type: Type.STRING,
    },

    destinationCode: {
      type: Type.STRING,
    },

    passportCode: {
      type: Type.STRING,
    },

    electrical: {
      type: Type.OBJECT,

      properties: {
        plugTypes: {
          type: Type.ARRAY,

          items: {
            type: Type.STRING,
          },
        },

        voltage: {
          type: Type.STRING,
        },

        adapterNeeded: {
          type: Type.BOOLEAN,
        },
      },

      required: ["plugTypes", "voltage", "adapterNeeded"],
    },

    gear: {
      type: Type.ARRAY,

      items: {
        type: Type.STRING,
      },
    },
  },

  required: [
    "destinationCountry",
    "destinationCode",
    "passportCode",
    "electrical",
    "gear",
  ],
};

// -----------------------------------------------------------------------------
// Validate 2-letter country codes
// -----------------------------------------------------------------------------

// Visa API expects codes like:
//
// US
// JP
// FR
//
// not full country names.
function isCountryCode(code) {
  return /^[A-Z]{2}$/.test(String(code || ""));
}

// -----------------------------------------------------------------------------
// GET /api/ai/travel-requirements
// -----------------------------------------------------------------------------

router.get("/travel-requirements", aiLimiter, async (req, res) => {
  const { destination, passportCountry, startDate } = req.query;

  // Destination is required.
  if (!destination) {
    return res.status(400).json({
      error: "Destination is required",
    });
  }

  const ai = getGeminiClient();

  if (!ai) {
    return res.status(503).json({
      error: "AI travel information is not configured on this server.",
    });
  }

  // These are shown to the user so they can
  // verify official travel requirements.
  const sources = [
    {
      name: "IATA Travel Centre",

      url: "https://www.iata.org/en/services/compliance/timatic/travel-documentation/",
    },

    {
      name: "U.S. Department of State",

      url: "https://travel.state.gov/",
    },
  ];

  const disclaimer =
    "Travel requirements can change. Verify visa, passport, and entry requirements with official government or airline sources before traveling.";

  try {
    // -----------------------------------------------------------------------
    // Ask Gemini for country/electrical/packing information.
    // -----------------------------------------------------------------------

    const prompt = `
A traveler is going to ${destination}.

Their passport country is ${passportCountry || "United States"}.

Travel date: ${startDate || "not provided"}.

Return:

- destination country
- 2-letter destination country code
- 2-letter passport country code
- plug types
- voltage
- whether a US traveler needs an adapter
- 5 useful packing items for this destination
`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",

      contents: prompt,

      config: {
        responseMimeType: "application/json",

        responseSchema: travelSchema,
      },
    });

    if (!response.text) {
      throw new Error("Gemini returned an empty response.");
    }

    const travelInfo = JSON.parse(response.text);

    // Make sure Gemini returned valid 2-letter country codes.
    if (
      !isCountryCode(travelInfo.passportCode) ||
      !isCountryCode(travelInfo.destinationCode)
    ) {
      return res.status(400).json({
        error: "Could not determine valid country codes.",
        sources,
        disclaimer,
      });
    }

    // -----------------------------------------------------------------------
    // Call Visa API
    // -----------------------------------------------------------------------

    const visaApiKey = process.env.VISA_API;

    if (!visaApiKey) {
      return res.status(503).json({
        error: "Visa information is not configured on this server.",
        sources,
        disclaimer,
      });
    }

    const visaResponse = await fetch(
      "https://visa-requirement.p.rapidapi.com/v2/visa/check",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "X-RapidAPI-Key": visaApiKey,

          "X-RapidAPI-Host": "visa-requirement.p.rapidapi.com",
        },

        body: JSON.stringify({
          passport: travelInfo.passportCode,

          destination: travelInfo.destinationCode,
        }),

        // Stop waiting if the external provider
        // takes longer than 8 seconds.
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!visaResponse.ok) {
      throw new Error(`Visa API returned ${visaResponse.status}`);
    }

    const visaData = await visaResponse.json();

    // -----------------------------------------------------------------------
    // Send everything to React
    // -----------------------------------------------------------------------

    return res.json({
      destination,

      destinationCountry: travelInfo.destinationCountry,

      passportCountry: passportCountry || "United States",

      visa: visaData.data || visaData,

      electrical: travelInfo.electrical,

      gear: travelInfo.gear || [],

      sources,

      disclaimer,
    });
  } catch (error) {
    console.error("TRAVEL REQUIREMENTS ERROR:", error.message);

    // Even if the external service fails,
    // return the official sources and warning.
    return res.status(502).json({
      error: "Could not load travel requirements right now.",

      sources,

      disclaimer,
    });
  }
});

module.exports = router;
