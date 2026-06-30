const express = require('express');
const {body} = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/bookController');
const {protect} = require('../middleware/authMiddleware');
const {authorize} = require('../middleware/roleMiddleware');

router.get('/stats',       protect, ctrl.getStats);
router.get('/departments', protect, ctrl.getDepartments);
router.get('/categories',  protect, ctrl.getCategories);
router.get('/',            protect, ctrl.getBooks);
router.get('/:id',         protect, ctrl.getBook);
router.post('/',           protect, authorize('admin','librarian'), [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('author').trim().notEmpty().withMessage('Author required'),
  body('isbn').trim().notEmpty().withMessage('ISBN required'),
  body('category').trim().notEmpty().withMessage('Category required'),
  body('department').trim().notEmpty().withMessage('Department required'),
], ctrl.createBook);
router.put('/:id',    protect, authorize('admin','librarian'), ctrl.updateBook);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteBook);
module.exports = router;
