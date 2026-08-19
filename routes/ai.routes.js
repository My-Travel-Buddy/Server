/*
This route handles the AI itinerary endpoint.

When a POST request is sent to `/itinerary`,
it generates a trip itinerary using Gemini.
*/

const router = require("express").Router();
// We import Gemini tools.
const { GoogleGenAI } = require("@google/genai");
// We import the JSON structure Gemini needs to follow.
const { Type } = require("@google/genai");

// Allowed activity categories.
const CATEGORY_VALUES = [
  "Food",
  "Sightseeing",
  "Culture",
  "Adventure",
  "Shopping",
  "Transportation",
  "Entertainment",
  "Other",
];

// expected output from Gemini
const itinerarySchema = {
  type: Type.OBJECT,

  properties: {
    title: {
      type: Type.STRING,
    },

    destination: {
      type: Type.STRING,
    },

    summary: {
      type: Type.STRING,
      description:
        "A short overview of the trip, including the number of days, activities, and estimated cost.",
    },

    activities: {
      type: Type.ARRAY,
      description:
        "Create exactly 3 activities for each day, excluding the final travel day.",

      items: {
        type: Type.OBJECT,

        properties: {
          day: {
            type: Type.INTEGER,
            description: "The trip day number, starting with 1.",
          },

          title: {
            type: Type.STRING,
          },

          dateTime: {
            type: Type.STRING,
            description: "The activity date and time in ISO 8601 format.",
          },

          category: {
            type: Type.STRING,
            enum: CATEGORY_VALUES,
          },

          estimatedCost: {
            type: Type.NUMBER,
            description:
              "Cost per person in US DOLLARS. Convert from the local " +
              "currency — without this the model answers in the " +
              "destination's own currency (a 500 yen temple entry came " +
              "back as 500, which the UI then printed as $500).",
          },

          notes: {
            type: Type.STRING,
          },
        },

        required: [
          "day",
          "title",
          "dateTime",
          "category",
          "estimatedCost",
          "notes",
        ],
      },
    },

    checklist: {
      type: Type.ARRAY,
      description: "A practical checklist for the trip.",

      items: {
        type: Type.OBJECT,

        properties: {
          text: {
            type: Type.STRING,
          },

          completed: {
            type: Type.BOOLEAN,
          },
        },

        required: ["text", "completed"],
      },
    },
  },
  // Gemini needs to return both parts of the itinerary.
  required: ["title", "destination", "summary", "activities", "checklist"],
};

// we got the Gemini API key from the server.
const apiKey = process.env.MY_TRAVEL_BUDDY;

// then Stop the server if the key is missing.
if (!apiKey) {
  throw new Error("Missing MY_TRAVEL_BUDDY in the server .env file.");
}

// we Create the Gemini client using our API key.
const ai = new GoogleGenAI({ apiKey });

// POST /api/ai/itinerary
router.post("/itinerary", async (req, res) => {
  try {
    // We send the trip data to the AI service.
    const trip = req.body;
    // How many days is the trip? The last day is the journey home, so it
    // gets no activities.
    const start = new Date(`${trip.startDate}T00:00:00`);
    const end = new Date(`${trip.endDate}T00:00:00`);

    const msPerDay = 24 * 60 * 60 * 1000;
    const startTime = start.getTime();
    const endTime = end.getTime();

    if (
      Number.isNaN(startTime) ||
      Number.isNaN(endTime) ||
      endTime <= startTime
    ) {
      return res.status(400).json({
        error: "Please provide a valid start date and an end date after it.",
      });
    }

    const tripDays = Math.round((endTime - startTime) / msPerDay) + 1;

    // A long trip would need hundreds of activities, which one response cannot
    // hold — the model quietly gives up and returns two days. So we plan the
    // first stretch and tell the user how much was covered.
    //
    // Measured on
    // gemini-3.1-flash-lite: ~2s of overhead plus ~0.35s per day.
    //   7 days  -> 5.7s     14 days -> 7.6s
    //   20 days -> 9.6s     30 days -> 15.0s
    // 14 covers most real trips while staying under 8 seconds. Longer trips
    // still work — they just get the first 14 days, and the confirmation page
    // says so. Override with MAX_ITINERARY_DAYS in .env.
    const MAX_DAYS_PER_REQUEST = Number(process.env.MAX_ITINERARY_DAYS) || 14;

    const daysToPlan = Math.max(
      1,
      Math.min(tripDays - 1, MAX_DAYS_PER_REQUEST),
    );

    // Say the day count out loud, and give the exact date of day 1, so the
    // model does not have to work it out from the range.
    const prompt = `
        Create an itinerary for ${trip.destination}.
        Start date: ${trip.startDate}
        End date: ${trip.endDate}
        Budget: ${trip.budget} USD

        All costs must be in US DOLLARS, converted from the local currency.
        The activity costs should plausibly add up to within the budget.
        Interests: ${(trip.interests || []).join(", ")}

        Plan EXACTLY ${daysToPlan} days, starting on ${trip.startDate}.
        Day 1 is ${trip.startDate}, day 2 is the next calendar day, and so on.
        Give exactly 3 activities for every one of those ${daysToPlan} days,
        so return ${daysToPlan * 3} activities in total.
        Every dateTime must fall on that day's own calendar date.
        `;

    const response = await ai.models.generateContent({
      // then use the model from .env,
      // or we use the default model if one is not provided.
      model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",

      // We then send our travel prompt to Gemini.
      contents: prompt,

      config: {
        // This tells Gemini to return JSON.
        responseMimeType: "application/json",

        // This tells Gemini what JSON structure to follow.
        responseSchema: itinerarySchema,
      },
    });

    if (!response.text) {
      throw new Error("Gemini returned an empty response.");
    }

    const itinerary = JSON.parse(response.text);

    // Gemini can hand back either plain strings or objects, so we normalize
    // every item to { text, completed } and drop anything without real text.
    itinerary.checklist = (itinerary.checklist || [])
      .map((item) => {
        const text = typeof item === "string" ? item : item?.text;

        return {
          text: typeof text === "string" ? text.trim() : "",
          completed: false,
        };
      })
      .filter((item) => item.text.length > 0);

    // Confirmation.jsx already shows a note when only part of the trip was
    // planned — these are the fields it looks for.
    itinerary.tripDays = tripDays;
    itinerary.generatedDays = daysToPlan;
    itinerary.hasMoreDays = tripDays - 1 > daysToPlan;

    return res.json(itinerary);
  } catch (error) {
    console.error("AI ERROR:", error);

    // We return an error if the AI request fails.
    return res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;
