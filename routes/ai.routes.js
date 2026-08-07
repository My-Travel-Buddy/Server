/*
This route handles the AI itinerary endpoint.

When a POST request is sent to /itinerary,
it sends the request to createItinerary in the controller.
*/

const express = require("express");
const {
  createItinerary,
} = require("../controllers/ai.controller");

const router = express.Router();

// POST /api/ai/itinerary
router.post("/itinerary", createItinerary);

module.exports = router;