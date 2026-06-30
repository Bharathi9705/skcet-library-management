const express = require('express');
const {body} = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/issueController');
const {protect} = require('../middleware/authMiddleware');
const {authorize} = require('../middleware/roleMiddleware');

router.get('/stats',          protect, authorize('admin','librarian'), ctrl.getDashboardStats);
router.post('/sync-overdue',  protect, authorize('admin','librarian'), ctrl.syncOverdue);
router.get('/',               protect, ctrl.getIssues);
router.get('/:id',            protect, ctrl.getIssue);
router.post('/',              protect, authorize('admin','librarian'), [
  body('user_id').isInt().withMessage('user_id required'),
  body('book_id').isInt().withMessage('book_id required'),
], ctrl.issueBook);
router.put('/:id/return',    protect, authorize('admin','librarian'), ctrl.returnBook);
router.put('/:id/pay-fine',  protect, authorize('admin','librarian'), ctrl.payFine);
module.exports = router;
