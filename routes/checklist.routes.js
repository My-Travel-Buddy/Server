const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { Trip, User, Checklist } = require("../models");

router.get("/:TripId/checklist", requireAuth, async (req, res, next) => {
  try {
    const checklist = await Checklist.findAll({
      where: {
        UserId: req.user.id, ///change later
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

router.get("/:TripId/checklist/:id", requireAuth, async (req, res, next) => {
  try {
    const checklist = await Checklist.findOne({
      where: {
        UserId: req.user.id,
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

router.post("/:TripId/checklist/post", requireAuth, async (req, res, next) => {
  try {
    const { text, completed } = req.body;
    const checklist = await Checklist.create({
      text,
      completed,
      TripId: req.params.TripId, // fix is giving back null
      UserId: req.user.id,
    });
    res.status(201).json(checklist);
  } catch (err) {
    next(err);
  }
});

router.patch("/:TripId/:id/checklist/edit",  requireAuth, async (req, res, next) => {
    try {
      const checklist = await Checklist.findOne({
        where: {
          id: req.params.id,
          UserId: req.user.id,
          TripId: req.params.TripId,
        },
      });

      if (!checklist) {
        return res.status(404).json({
          error: "Checklist item not found",
        });
      }

      await checklist.update(req.body);

      res.status(200).json(checklist);
    } catch (err) {
      next(err);
    }
  },
);

router.delete("/:id/checklist/delete", requireAuth, async (req, res, next) => {
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
