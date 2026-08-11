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

// expected output from Gemini
const itinerarySchema = {
  type: Type.OBJECT,

  properties: {
    summary: {
      type: Type.STRING,
    },

    activities: {
      type: Type.ARRAY,

      items: {
        type: Type.OBJECT,

        properties: {
          title: {
            type: Type.STRING,
          },
          day:{
            type:Type.STRING,
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

        // Every activity needs these fields.
        required: ["title", "category", "estimatedCost", "notes"],
      },
    },
  },

  // Gemini needs to return both parts of the itinerary.
  required: ["summary", "activities"],
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
    } else {
      return res.json(JSON.parse(response.text));
    }

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
