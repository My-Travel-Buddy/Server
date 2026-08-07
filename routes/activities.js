const express = require ('express');
const { Activity, Trip }  = require ('../models');
const router = express.Router();

router.get("/:tripId/activities",async(req, res) =>{
    const tripId = req.params.tripId;
    const activities = await Activity.findAll({
        where: {
            TripId: tripId
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
 router.post("/:tripId/activities", async (req, res) =>{
    const {title, category, dateTime, estimatedCost, notes} = req.body
    const tripId = Number(req.params.tripId);
    // console.log(tripId, typeof Number(tripId))

    const trip = await Trip.findByPk(tripId);
    // console.log(trip)
    if(!trip){
        throw new Error("Trip doesn't exist")
     } 

     const newActivity = await Activity.create({
        title,
        category,
        dateTime,
        estimatedCost,
        notes,
        TripId: trip.id
     })
        
    res.status(201).json(newActivity)
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