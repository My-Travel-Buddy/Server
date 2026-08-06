const express = require("express")
const router = express.Router()
const Checklist = require("../models/Checklist")
const {requireAuth} = require("../middleware/auth")



router.get("/:tripId/checklist", requireAuth, async(req,res, next) =>{

    try {
    const checklist = await Checklist.findAll({
      where: {
        userId: req.user.id
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

router.get("/:tripId/checklist/:id", requireAuth, async (req, res) =>{

} )

router.post("/:tripId/checklist", requireAuth, async (req, res) =>{
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


router.patch("/:tripId/checklist/:id", requireAuth, async (req, res) =>{

} ) 


router.delete(":tripId/checklist/id", requireAuth, async (req, res) =>{

} ) 

module.exports = router