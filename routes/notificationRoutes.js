const express = require('express');
const router = express.Router();
const {protect} = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const Reservation  = require('../models/Reservation');

router.get('/', protect, async (req,res,next) => {
  try {
    const notifs = await Notification.getByUser(req.user.id);
    const unread = await Notification.getUnreadCount(req.user.id);
    res.json({success:true,notifications:notifs,unread});
  } catch(e){next(e);}
});

router.put('/read-all', protect, async (req,res,next) => {
  try {
    await Notification.markAllRead(req.user.id);
    res.json({success:true});
  } catch(e){next(e);}
});

router.put('/:id/read', protect, async (req,res,next) => {
  try {
    await Notification.markRead(req.params.id, req.user.id);
    res.json({success:true});
  } catch(e){next(e);}
});

// Reservations
router.get('/reservations', protect, async (req,res,next) => {
  try {
    const reservations = await Reservation.getByUser(req.user.id);
    res.json({success:true,reservations});
  } catch(e){next(e);}
});

router.post('/reservations', protect, async (req,res,next) => {
  try {
    const {book_id} = req.body;
    const exists = await Reservation.findActive(req.user.id, book_id);
    if(exists) return res.status(409).json({success:false,message:'Already reserved.'});
    const id = await Reservation.create({user_id:req.user.id, book_id});
    res.json({success:true,message:'Book reserved! You will be notified when available.',id});
  } catch(e){next(e);}
});

router.put('/reservations/:id/cancel', protect, async (req,res,next) => {
  try {
    await Reservation.cancel(req.params.id, req.user.id);
    res.json({success:true,message:'Reservation cancelled.'});
  } catch(e){next(e);}
});

module.exports = router;
