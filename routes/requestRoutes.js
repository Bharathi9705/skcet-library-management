const express = require('express');
const router  = express.Router();
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const BookRequest   = require('../models/BookRequest');
const Issue         = require('../models/Issue');
const Book          = require('../models/Book');
const Notification  = require('../models/Notification');

// ── GET /api/requests — get all (librarian) or own (student) ───
router.get('/', protect, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      const requests = await BookRequest.getByUser(req.user.id);
      return res.json({ success: true, requests });
    }
    const { status = '', page = 1, limit = 15 } = req.query;
    const data = await BookRequest.getAll({ status, page: +page, limit: +limit });
    res.json({ success: true, ...data });
  } catch (e) { next(e); }
});

// ── GET /api/requests/count — pending count for badge ──────────
router.get('/count', protect, authorize('admin', 'librarian'), async (req, res, next) => {
  try {
    const count = await BookRequest.getPendingCount();
    res.json({ success: true, count });
  } catch (e) { next(e); }
});

// ── POST /api/requests — student creates a request ─────────────
router.post('/', protect, async (req, res, next) => {
  try {
    const { book_id, message } = req.body;
    if (!book_id) return res.status(400).json({ success: false, message: 'book_id required.' });

    // Check book exists
    const book = await Book.findById(book_id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found.' });

    // Check already pending
    const existing = await BookRequest.findPending(req.user.id, book_id);
    if (existing) return res.status(409).json({ success: false, message: 'You already have a pending request for this book.' });

    const id = await BookRequest.create({ user_id: req.user.id, book_id, message });

    // Notify librarians (notify user id 2 = librarian by default)
    await Notification.create({
      user_id: 2,
      title: 'New Book Request',
      message: `${req.user.name} requested "${book.title}"`,
      type: 'info'
    });

    res.status(201).json({ success: true, message: '📌 Book requested! Librarian will process it soon.', id });
  } catch (e) { next(e); }
});

// ── PUT /api/requests/:id/approve — librarian approves ─────────
router.put('/:id/approve', protect, authorize('admin', 'librarian'), async (req, res, next) => {
  try {
    const request = await BookRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (request.status !== 'pending') return res.status(409).json({ success: false, message: 'Request is no longer pending.' });

    // Check availability
    const book = await Book.findById(request.book_id);
    if (!book || book.available_copies < 1) {
      return res.status(409).json({ success: false, message: 'No copies available to issue.' });
    }

    // Issue the book automatically
    const [issueId] = await Promise.all([
      Issue.create({ user_id: request.user_id, book_id: request.book_id, issued_by: req.user.id }),
      Book.adjustAvailable(request.book_id, -1),
      BookRequest.approve(req.params.id)
    ]);

    const issue = await Issue.findById(issueId);

    // Notify student
    await Notification.create({
      user_id: request.user_id,
      title: '✅ Book Request Approved!',
      message: `Your request for "${request.book_title}" has been approved. Due date: ${issue.due_date}`,
      type: 'success'
    });

    res.json({ success: true, message: `✅ Request approved! Book issued to ${request.student_name}. Due: ${issue.due_date}`, issue });
  } catch (e) { next(e); }
});

// ── PUT /api/requests/:id/reject — librarian rejects ───────────
router.put('/:id/reject', protect, authorize('admin', 'librarian'), async (req, res, next) => {
  try {
    const request = await BookRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    const { reason } = req.body;
    await BookRequest.reject(req.params.id, reason);

    // Notify student
    await Notification.create({
      user_id: request.user_id,
      title: '❌ Book Request Rejected',
      message: `Your request for "${request.book_title}" was rejected. ${reason ? 'Reason: ' + reason : ''}`,
      type: 'danger'
    });

    res.json({ success: true, message: 'Request rejected.' });
  } catch (e) { next(e); }
});

// ── PUT /api/requests/:id/cancel — student cancels ─────────────
router.put('/:id/cancel', protect, async (req, res, next) => {
  try {
    await BookRequest.cancel(req.params.id, req.user.id);
    res.json({ success: true, message: 'Request cancelled.' });
  } catch (e) { next(e); }
});

module.exports = router;