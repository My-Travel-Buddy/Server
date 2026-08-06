const express = require ('express');
const { Activity }  = require ('../models');
const router = express.Router();

router.get("/:tripId/activities",async(req, res) =>{
    const tripId = req.params.tripId;
    const activities = await Activity.findAll({
        where: {
            tripId: tripId
            }
        }
    );
    res.json(activities)


})

router.get("/:tripId/activities/:activityId",async(req, res) =>{
    const activity = await Activity.findByPk(req.params.activityId)
    if(!activity) return res.status(404).json({error:"No activity!"});
    res.json(activity)
})
 router.post("/tripId/activities", async (req, res) =>{
    const activity = await Activity.create(req.body)
    res.status(201).json(activity)
 })

 router.patch("/:tripId/activities/:activityId", async(req, res) =>{
    const activity = await Activity.findByPk(req.params.activityId);
    if(!activity) return res.status(404).json({error:"No activity"});
        await activity.update(req.body);
    res.json(activity);

 })
  router.delete('/:tripId/activities/:activityId', async(req, res) =>{
    const activity = await Activity.findByPk(req.params.activityId)
    if(!activity) return res.status(404).json({error:"No activity"});
    await activity.destroy(req.body)
    res.sendStatus(204)
  })

  module.exports = router