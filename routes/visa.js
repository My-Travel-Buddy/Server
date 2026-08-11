const express = require("express");
const router = express.Router();

// This route receives the passport country code
// and destination country code from the frontend.
router.post("/visa", async (req, res) => {
  const { passportCode, destinationCode } = req.body;

  // Read the Visa API key from .env.
  const apiKey = process.env.VISA_API;

  if (!apiKey) {
    return res.status(503).json({
      error: "Visa API is not configured",
    });
  }

  try {
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
      }
    );

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      error: "Could not load visa information",
    });
  }
});

module.exports = router;