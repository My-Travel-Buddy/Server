const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/auth");
const { Checklist } = require("../models");

// GET all checklist items for a trip
router.get("/:TripId/checklist", requireAuth, async (req, res, next) => {
  try {
    const checklist = await Checklist.findAll({
      where: {
        UserId: req.user.id,
        TripId: req.params.TripId,
      },
    });

    res.status(200).json(checklist);
  } catch (err) {
    next(err);
  }
});

// GET one checklist item
router.get("/:TripId/checklist/:id", requireAuth, async (req, res, next) => {
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

    res.status(200).json(checklist);
  } catch (err) {
    next(err);
  }
});

// POST a new checklist item
router.post("/:TripId/checklist/post", requireAuth, async (req, res, next) => {
  try {
    console.log("CHECKLIST POST");
    console.log("PARAMS:", req.params);
    console.log("USER:", req.user);
    console.log("BODY:", req.body);

    const { text, completed } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Checklist text is required",
      });
    }

    const checklist = await Checklist.create({
      text,
      completed: completed ?? false,
      TripId: Number(req.params.TripId),
      UserId: req.user.id,
    });

    console.log("CREATED CHECKLIST:", checklist.toJSON());

    res.status(201).json(checklist);
  } catch (err) {
    console.error("CHECKLIST POST ERROR:", err);
    next(err);
  }
});

// PATCH a checklist item
router.patch(
  "/:TripId/:id/checklist/edit",
  requireAuth,
  async (req, res, next) => {
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

      await checklist.update({
        ...req.body,
      });

      res.status(200).json(checklist);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE a checklist item
router.delete(
  "/:TripId/:id/checklist/delete",
  requireAuth,
  async (req, res, next) => {
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

      await checklist.destroy();

      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;