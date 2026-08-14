const express = require("express");
const router = express.Router();
const Checklist = require("../models/Checklist");
const { requireAuth } = require("../middleware/auth");
const { Trip } = require("../models");

router.get("/:TripId/checklist", async (req, res, next) => {
  try {
    const checklist = await Checklist.findAll({
      where: {
        UserId: "2b9aca3b-ef2e-4696-9497-c8904557643b", ///change later
        TripId: req.params.TripId,
      },
    });

    if (!checklist) {
      return res.sendStatus(404);
    }

    res.json(checklist);
  } catch (err) {
    next(err);
  }
});

router.get("/:tripId/checklist/:id",  async (req, res, next) =>{
   try {
    const checklist = await Checklist.findOne({
      where: {
        // UserId: "3bb7929c-d0d6-431d-9726-cde82fbf502e",
         TripId: req.params.TripId,
      }
      });

    if (!checklist) {
      return res.sendStatus(404);
    }

    res.json(checklist);
  } catch (err) {
    next(err);
  }
} )

router.post("/:tripId/checklist/post", async (req, res, next) => {
  try {
    const { text, completed } = req.body;
    const checklist = await Checklist.create({
      text,
      completed,
      TripId: req.params.tripId, // fix is giving back null
      UserId: "2b9aca3b-ef2e-4696-9497-c8904557643b",
    });
    res.status(201).json(checklist);
  } catch (err) {
    next(err);
  }
});

router.patch("/:tripId/:id/checklist/edit", async (req, res, next) => {

  try {
    const fixChecklist = await Checklist.findByPk(req.params.id);

    if (!fixChecklist) {
      return res.sendStatus(404);
    }

    // if (fixChecklist.TripId !== req.params.tripId) {
    //   return res.sendStatus(403);
    // }

    await fixChecklist.update(req.body);
    res.status(200).json(fixChecklist);

  } catch (err) {
    next(err);
  }

});

router.delete("/:id/checklist/delete", async (req, res, next) => {
   try {
    const checklist = await Checklist.findByPk(req.params.id);

    if (!checklist) {
      return res.sendStatus(404);
    }

    await checklist.destroy();

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
