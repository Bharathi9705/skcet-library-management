const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const {protect}   = require('../middleware/authMiddleware');
const {authorize} = require('../middleware/roleMiddleware');

router.get('/stats',      protect, authorize('admin','librarian'), ctrl.getStats);
router.get('/',           protect, authorize('admin','librarian'), ctrl.getUsers);
router.get('/:id',        protect, ctrl.getUser);
router.get('/:id/issues', protect, ctrl.getUserIssues);
router.put('/:id',        protect, ctrl.updateUser);
router.delete('/:id',     protect, authorize('admin'), ctrl.deleteUser);
module.exports = router;
