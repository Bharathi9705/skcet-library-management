const db = require('../config/db');
class Reservation {
  static async create({user_id,book_id}) {
    const expires = new Date(); expires.setDate(expires.getDate()+3);
    const [r] = await db.query(
      `INSERT INTO reservations (user_id,book_id,expires_at,status) VALUES (?,?,?,'pending')`,
      [user_id,book_id,expires.toISOString().split('T')[0]]
    );
    return r.insertId;
  }
  static async getByUser(user_id) {
    const [rows] = await db.query(`
      SELECT r.*,b.title AS book_title,b.author,b.isbn,b.available_copies
      FROM reservations r JOIN books b ON r.book_id=b.id
      WHERE r.user_id=? AND r.status='pending' ORDER BY r.reserved_at DESC`,[user_id]);
    return rows;
  }
  static async cancel(id,user_id) {
    const [r] = await db.query(
      `UPDATE reservations SET status='cancelled' WHERE id=? AND user_id=?`,[id,user_id]
    );
    return r.affectedRows>0;
  }
  static async findActive(user_id,book_id) {
    const [rows] = await db.query(
      `SELECT * FROM reservations WHERE user_id=? AND book_id=? AND status='pending'`,[user_id,book_id]
    );
    return rows[0]||null;
  }
}
module.exports = Reservation;