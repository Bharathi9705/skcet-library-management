const db = require('../config/db');

class BookRequest {
  // ── Create request ─────────────────────────────────────────────
  static async create({ user_id, book_id, message }) {
    const [r] = await db.query(
      `INSERT INTO book_requests (user_id, book_id, message) VALUES (?, ?, ?)`,
      [user_id, book_id, message || null]
    );
    return r.insertId;
  }

  // ── Get all requests (for librarian/admin) ─────────────────────
  static async getAll({ status = '', page = 1, limit = 15 } = {}) {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = [];
    if (status) { where += ' AND br.status = ?'; params.push(status); }

    const [rows] = await db.query(`
      SELECT br.*,
        u.name AS student_name, u.roll_number, u.email AS student_email, u.department,
        b.title AS book_title, b.author, b.isbn, b.available_copies, b.department AS book_dept
      FROM book_requests br
      JOIN users u ON br.user_id = u.id
      JOIN books b ON br.book_id = b.id
      ${where} ORDER BY br.requested_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM book_requests br ${where}`, params
    );
    return { requests: rows, total, page: parseInt(page), limit: parseInt(limit) };
  }

  // ── Get by user (for student) ──────────────────────────────────
  static async getByUser(user_id) {
    const [rows] = await db.query(`
      SELECT br.*, b.title AS book_title, b.author, b.isbn, b.available_copies
      FROM book_requests br
      JOIN books b ON br.book_id = b.id
      WHERE br.user_id = ?
      ORDER BY br.requested_at DESC`, [user_id]);
    return rows;
  }

  // ── Find existing pending request ──────────────────────────────
  static async findPending(user_id, book_id) {
    const [rows] = await db.query(
      `SELECT * FROM book_requests WHERE user_id = ? AND book_id = ? AND status = 'pending'`,
      [user_id, book_id]
    );
    return rows[0] || null;
  }

  // ── Approve request ────────────────────────────────────────────
  static async approve(id) {
    const [r] = await db.query(
      `UPDATE book_requests SET status = 'approved' WHERE id = ?`, [id]
    );
    return r.affectedRows > 0;
  }

  // ── Reject request ─────────────────────────────────────────────
  static async reject(id, reason) {
    const [r] = await db.query(
      `UPDATE book_requests SET status = 'rejected', rejection_reason = ? WHERE id = ?`,
      [reason || null, id]
    );
    return r.affectedRows > 0;
  }

  // ── Cancel request (by student) ────────────────────────────────
  static async cancel(id, user_id) {
    const [r] = await db.query(
      `UPDATE book_requests SET status = 'cancelled' WHERE id = ? AND user_id = ?`,
      [id, user_id]
    );
    return r.affectedRows > 0;
  }

  // ── Get by id ──────────────────────────────────────────────────
  static async findById(id) {
    const [rows] = await db.query(`
      SELECT br.*,
        u.name AS student_name, u.roll_number, u.email AS student_email,
        b.title AS book_title, b.author, b.isbn, b.available_copies
      FROM book_requests br
      JOIN users u ON br.user_id = u.id
      JOIN books b ON br.book_id = b.id
      WHERE br.id = ?`, [id]);
    return rows[0] || null;
  }

  // ── Pending count ──────────────────────────────────────────────
  static async getPendingCount() {
    const [[{ cnt }]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM book_requests WHERE status = 'pending'`
    );
    return cnt;
  }
}

module.exports = BookRequest;