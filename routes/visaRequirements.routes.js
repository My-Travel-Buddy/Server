/*
This route receives the traveler’s passport code and destination code from React,
gets the Visa API key from the environment, sends those codes to the external Visa API,
converts the response to JSON, and returns the visa information to the frontend.
If the API key is missing or the external request fails, it returns an error.
*/

const router = require("express").Router();

// This route receives the passport country code
// and destination country code from the frontend.
router.post("/", async (req, res) => {
  const { passportCode, destinationCode } = req.body;

  // Read the Visa API key from .env.
  const apiKey = process.env.VISA_API;

  // Stop here if the API key is missing.
  if (!apiKey) {
    return res.status(503).json({
      error: "Visa API is not configured",
    });
  }

  try {
    // Send the passport and destination codes
    // to the external Visa API.
    const response = await fetch(
      "https://visa-requirement.p.rapidapi.com/v2/visa/check",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "visa-requirement.p.rapidapi.com",
        },

        body: JSON.stringify({
          passport: passportCode,
          destination: destinationCode,
        }),
      },
    );

    // Convert the API response into JavaScript data.
    const data = await response.json();

    // Send the visa information back to React.
    res.json(data);
  } catch (error) {
    // If the external Visa API fails,
    // return a server error to the frontend.
    console.error(error.message);

    res.status(500).json({
      error: "Could not load visa information",
    });
  }
});

module.exports = router;
