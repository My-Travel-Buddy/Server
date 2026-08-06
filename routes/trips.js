const { Trip, Checklist, Activity } = require('../models')
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth')

router.get('/', requireAuth, async (req, res, next) => {
    try{
        const trips = await Trip.findAll()
        res.status(200).json(trips)
    }catch(err){
        next(err)
    }
})

router.get('/:id', requireAuth,  async (req, res, next) => {
    try{
        const id = Number(req.params.id)
        const trip = await Trip.findOne(id, {
            include: Checklist,
            include: Activity,
        })
        res.status(200).json(trip)
    }catch(err){
        next(err)
    }
})

router.post('/', requireAuth, async (req, res, next) => {
    try{
        const {destination, date_Range, budget} = req.body
        const trip = await Trip.create({
            destination,
            date_Range,
            budget,
        })
        res.status(201).json(trip)
    }catch(err){
        next(err)
    }
})

router.patch('/:id', requireAuth, async (req, res, next) => {
    try{
        const id = Number(req.params.id);
        const trip = await Trip.findByPk(id)
        
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        await trip.update(req.body)
        res.status(200).json(trip)
    }catch(err){
        next(err)
    }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
    try{
        const id = Number(req.params.id);
        const trip = await Trip.findByPk(id);

        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }
        await trip.destroy()
        res.sendStatus(410)   
    }catch(err){
        next(err)
    }
})

module.exports = router;