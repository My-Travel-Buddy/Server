const express = require("express")
const router = express.Router()
const Checklist = require("../models/Checklist")
const {requireAuth} = require("../middleware/auth")



router.get("/:TripId/checklist",  async(req,res, next) =>{

    try {
    const checklist = await Checklist.findAll({
      where: {
        UserId: "3bb7929c-d0d6-431d-9726-cde82fbf502e", ///change later
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

router.get("/:tripId/checklist/:id",  async (req, res, next) =>{
   try {
    const checklist = await Checklist.findByPk({
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

router.post("/:tripId/checklist",  async (req, res) =>{
try {

    const { gameReviewId } = req.body;
    const checklist = await WishList.create({
      userId: req.user.id,
      gameReviewId
    });
    res.status(201).json(wishlist);


  } catch (err) {

    next(err);

  }
} ) 


router.patch("/:tripId/checklist/:id",  async (req, res) =>{

} ) 


router.delete(":tripId/checklist/id",  async (req, res) =>{

} ) 

module.exports = router