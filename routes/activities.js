/*This route receives the trip details from React, 
checks that the required values are present, 
builds a prompt for Gemini, tells Gemini what fields the frontend needs,
 asks for JSON, converts the JSON response into a JavaScript object, 
 and sends the completed itinerary back to React. */

const router = require("express").Router();
const { GoogleGenAI } = require("@google/genai");

// Create the Gemini client using the API key from .env.
const ai = new GoogleGenAI({
  apiKey: process.env.MY_TRAVEL_BUDDY,
});

// This route receives trip details from React
// and asks Gemini to generate an itinerary.
router.post("/itinerary", async (req, res) => {
  const { destination, startDate, endDate, budget, interests } = req.body;

  // Make sure the required trip information was provided.
  if (!destination || !startDate || !endDate) {
    return res.status(400).json({
      error: "Destination and dates are required",
    });
  }

  try {
    // Build the instructions that will be sent to Gemini.
    // We tell Gemini which fields the frontend expects.
    const prompt = `
Create a travel itinerary for ${destination}.

Start date: ${startDate}
End date: ${endDate}
Budget: ${budget}
Interests: ${interests?.join(", ")}

Return JSON with:

- title
- summary
- activities
- checklist

Each activity must have:

- day
- time
- title
- category
- estimatedCost
- notes

Example activity:
{
  "day": 1,
  "time": "09:00",
  "title": "Visit the Colosseum",
  "category": "Sightseeing",
  "estimatedCost": 25,
  "notes": "Book tickets in advance."
}
`;

    // Send the prompt to Gemini and request JSON.
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,

      config: {
        responseMimeType: "application/json",
      },
    });

    // Stop if Gemini returned no content.
    if (!response.text) {
      throw new Error("Gemini returned an empty response");
    }

    // Convert Gemini's JSON text into a JavaScript object.
    const itinerary = JSON.parse(response.text);

    // Send the generated itinerary back to React,
    // together with the original trip information.
    res.json({
      ...itinerary,
      destination,
      startDate,
      endDate,
      budget,
      interests,
    });
  } catch (error) {
    // Handle Gemini or JSON errors.
    console.error(error.message);

    res.status(500).json({
      error: "Could not generate itinerary",
    });
  }
});

module.exports = router;
