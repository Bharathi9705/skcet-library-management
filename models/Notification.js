const db = require('../config/db');
class Notification {
  static async create({user_id,title,message,type='info'}) {
    const [r] = await db.query(
      'INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,?)',
      [user_id,title,message,type]
    );
    return r.insertId;
  }
  static async getByUser(user_id,limit=20) {
    const [rows] = await db.query(
      `SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT ${parseInt(limit)||20}`,
      [user_id]
    );
    return rows;
  }
  static async markRead(id,user_id) {
    await db.query('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?',[id,user_id]);
  }
  static async markAllRead(user_id) {
    await db.query('UPDATE notifications SET is_read=1 WHERE user_id=?',[user_id]);
  }
  static async getUnreadCount(user_id) {
    const [[{cnt}]] = await db.query(
      'SELECT COUNT(*) AS cnt FROM notifications WHERE user_id=? AND is_read=0',[user_id]
    );
    return cnt;
  }
}
module.exports = Notification;