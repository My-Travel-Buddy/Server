const express = require("express");
const { Activity, Trip, User_Trip } = require("../models");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.get("/:tripId/activities", requireAuth, async (req, res) => {
  try {
    const tripId = Number(req.params.tripId);

    const userTrip = await User_Trip.findOne({
      where: {
        UserId: req.user.id,
        TripId: tripId,
      },
    });

    if (!userTrip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const activities = await Activity.findAll({
      where: {
        TripId: tripId,
      },
    });

    res.json(activities);
  } catch (err) {
    console.error("ACTIVITIES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:tripId/activities/:activityId", requireAuth, async (req, res) => {
  const activity = await Activity.findOne({
    where: {
      id: req.params.activityId,
      UserId: req.user.id,
    },
  });
  if (!activity) return res.status(404).json({ error: "No activity!" });
  res.json(activity);
});
router.post("/:tripId/activities", requireAuth, async (req, res) => {
  const { title, category, dateTime, estimatedCost, notes } = req.body;
  const tripId = Number(req.params.tripId);
  // console.log(tripId, typeof Number(tripId))

  const trip = await Trip.findByPk(tripId)
  // console.log(trip)
 if (!trip) {
  return res.status(404).json({ error: "Trip doesn't exist" });
}

const userTrip = await User_Trip.findOne({
  where: {
    UserId: req.user.id,
    TripId: tripId,
  },
});

if (!userTrip) {
  return res.status(403).json({ error: "You don't have access to this trip" });
}
  const newActivity = await Activity.create({
    title,
    category,
    dateTime,
    estimatedCost,
    notes,
    TripId: trip.id,
    UserId: req.user.id,
  });

  res.status(201).json(newActivity);
});

router.patch(
  "/:tripId/activities/:activityId",
  requireAuth,
  async (req, res) => {
    const activity = await Activity.findOne( {
      where: {
        id: req.params.activityId,
        UserId: req.user.id,
      },
    });
    if (!activity) return res.status(404).json({ error: "No activity" });
    await activity.update(req.body);
    res.json(activity);
  },
);
router.delete(
  "/:tripId/activities/:activityId",
  requireAuth,
  async (req, res) => {
    const activity = await Activity.findOne({
  where: {
    id: req.params.activityId,
    UserId: req.user.id,
  },
})
    if (!activity) return res.status(404).json({ error: "No activity" });
    await activity.destroy(req.body);
    res.sendStatus(204);
  },
);

module.exports = router;
