/*
This service is responsible for communicating with Gemini.

It takes the trip information from the controller,
builds the prompt, sends it to Gemini, and returns
the generated itinerary as a JavaScript object.

The itinerary structure is kept in itinerarySchema.js
so this file can focus only on the Gemini request.
*/

// The service talks to Gemini.

// We import Gemini tools.
const { GoogleGenAI } = require("@google/genai");

// We import the JSON structure Gemini needs to follow.
const itinerarySchema = require("./itinerarySchema");

// we got the Gemini API key from the server.
const apiKey = process.env.MY_TRAVEL_BUDDY;

// then Stop the server if the key is missing.
if (!apiKey) {
  throw new Error("Missing MY_TRAVEL_BUDDY in the server .env file.");
}

// we Create the Gemini client using our API key.
const ai = new GoogleGenAI({ apiKey });

// Generates an itinerary using the trip information from the frontend.
async function generateItinerary(trip) {

  // Then we build the prompt using the user's trip details.
  const prompt = `
Create an itinerary for ${trip.destination}.
Start date: ${trip.startDate}
End date: ${trip.endDate}
Budget: ${trip.budget}
Interests: ${(trip.interests || []).join(", ")}
`;

  // We send the prompt to Gemini.
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

    // we check that Gemini returned something.
  if (!response.text) {
    throw new Error("Gemini returned an empty response.");
  }
// We turn the response into a JavaScript object using JSON.parse().
  return JSON.parse(response.text);
}

// Finally, we make generateItinerary available to the controller.
module.exports = { generateItinerary };
