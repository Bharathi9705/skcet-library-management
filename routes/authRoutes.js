const express = require('express');
const { body }  = require('express-validator');
const router    = express.Router();
const ctrl      = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
], ctrl.register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], ctrl.login);

router.get('/me',               protect, ctrl.getMe);
router.put('/change-password',  protect, ctrl.changePassword);

module.exports = router;
