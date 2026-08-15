/*
This route handles the AI itinerary endpoint.

When a POST request is sent to /itinerary,
it sends the request to createItinerary in the controller.
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
    const prompt = `
        Create an itinerary for ${trip.destination}.
        Start date: ${trip.startDate}
        End date: ${trip.endDate}
        Budget: ${trip.budget}
        Interests: ${(trip.interests || []).join(", ")}
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

    return res.json(itinerary);


    // We send the generated itinerary back as JSON.
  } catch (error) {
    console.error("AI ERROR:", error);

    // We return an error if the AI request fails.
    return res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;
