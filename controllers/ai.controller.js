/*
This controller handles the AI request and response.

It gets the trip information from req.body,
sends it to the AI service, and returns the itinerary.

If something goes wrong, it returns an error response.
*/

// req.body, call service, and send response
const { generateItinerary } = require("../services/ai.service");

async function createItinerary(req, res) {
  try {
    // We send the trip data to the AI service.
    const itinerary = await generateItinerary(req.body);

    // We send the generated itinerary back as JSON.
    return res.json(itinerary);
  } catch (error) {
    console.error("AI ERROR:", error);

    // We return an error if the AI request fails.
    return res.status(500).json({
      error: error.message,
    });
  }
}

module.exports = {
  createItinerary,
};