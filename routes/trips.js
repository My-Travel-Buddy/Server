const { Trip, Checklist, Activity, User_Trip } = require("../models");
const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { Sequelize } = require("sequelize");
const sequelize = require("../db");

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const userTrips = await User_Trip.findAll({
      where: {
        UserId: req.user.id,
      },
    });

    const tripIds = userTrips.map((userTrip) => userTrip.TripId);

    const trips = await Trip.findAll({
      where: {
        id: tripIds,
      },
    });

    res.status(200).json(trips);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const userTrip = await User_Trip.findOne({
      where: {
        UserId: req.user.id,
        TripId: id,
      },
    });

    if (!userTrip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const trip = await Trip.findByPk(id, {
      include: [
        { model: Checklist },
        { model: Activity },
      ],
    });

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.status(200).json(trip);
  } catch (err) {
    next(err);
  }
});

router.post("/post", requireAuth, async (req, res, next) => {
  try {
    const { destination, date_Range, budget } = req.body;
    const trip = await Trip.create({
      destination,
      date_Range,
      budget,
    });
    await User_Trip.create({
      UserId: req.user.id,
      TripId: trip.id,
    });
    res.status(201).json(trip);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/edit", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const userTrip = await User_Trip.findOne({
      where: {
        UserId: req.user.id,
        TripId: id,
      },
      include: [Trip],
    });

    if (!userTrip || !userTrip.Trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    await userTrip.Trip.update(req.body);

    res.status(200).json(userTrip.Trip);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id/delete", requireAuth, async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const id = Number(req.params.id);
    console.log("Deleting trip:", id);

    await Activity.destroy({
      where: { UserId: req.user.id, TripId: id },
      transaction,
    });

    await Checklist.destroy({
      where: { UserId: req.user.id, TripId: id },
      transaction,
    });

    await User_Trip.destroy({
      where: { UserId: req.user.id, TripId: id },
      transaction,
    });

    await Trip.destroy({
      where: { id },
      transaction,
    });

    await transaction.commit();

    res.json({
      message: "Trip deleted!",
    });
  } catch (err) {
    await transaction.rollback();
    next(err); ///make it delete the associated data as well
  }
});

module.exports = router;
