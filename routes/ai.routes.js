/*This route receives the trip details from React,
 checks that the required values exist, builds a prompt for Gemini,
  asks Gemini to return JSON in the structure the frontend expects, 
  parses that JSON into JavaScript, and sends the itinerary back to React.
   If something fails, it returns an error response. */

const router = require("express").Router();
const { GoogleGenAI } = require("@google/genai");

// Create the Gemini client using the API key from .env.
const ai = new GoogleGenAI({
  apiKey: process.env.MY_TRAVEL_BUDDY,
});

// This route receives trip information from the frontend
// and asks Gemini to generate an itinerary.
router.post("/itinerary", async (req, res) => {
  const { destination, startDate, endDate, budget, interests } = req.body;

  // Make sure the required trip information was sent.
  if (!destination || !startDate || !endDate) {
    return res.status(400).json({
      error: "Destination and dates are required",
    });
  }

  try {
    // Build the instructions we send to Gemini.
    // We also tell Gemini the exact fields we want
    // inside every activity so React can display them.
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

Each activity must have exactly these fields:

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

    // Send the prompt to Gemini and ask for JSON instead of normal text.
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    // Gemini gives us JSON as text, so turn it into
    // a JavaScript object before sending it to React.
    const itinerary = JSON.parse(response.text);

    // Send the generated itinerary back to the frontend.
    // We also include the original trip information.
    res.json({
      ...itinerary,
      destination,
      startDate,
      endDate,
      budget,
      interests,
    });
  } catch (error) {
    // If Gemini or JSON parsing fails, return a server error.
    console.error(error.message);

    res.status(500).json({
      error: "Could not generate itinerary",
    });
  }
});

module.exports = router;
