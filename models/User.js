const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async create({ name, email, password, role='student', roll_number, department, phone }) {
    const hashed = await bcrypt.hash(password, 10);
    const [r] = await db.query(
      `INSERT INTO users (name,email,password,role,roll_number,department,phone) VALUES (?,?,?,?,?,?,?)`,
      [name, email, hashed, role, roll_number||null, department||null, phone||null]
    );
    return r.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      'SELECT id,name,email,role,roll_number,department,phone,profile_pic,is_active,created_at FROM users WHERE id=?', [id]
    );
    return rows[0]||null;
  }

  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
    return rows[0]||null;
  }

  static async getAll({ page=1, limit=15, role='', search='' }={}) {
    const offset = (parseInt(page)-1)*parseInt(limit);
    let where = 'WHERE 1=1'; const params = [];
    if (role)   { where+=' AND role=?'; params.push(role); }
    if (search) {
      where+=' AND (name LIKE ? OR email LIKE ? OR roll_number LIKE ?)';
      const s=`%${search}%`; params.push(s,s,s);
    }
    const lim = parseInt(limit) || 15;
    const [rows] = await db.query(
      `SELECT id,name,email,role,roll_number,department,phone,is_active,created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT ${lim} OFFSET ${offset}`,
      params
    );
    const [[{total}]] = await db.query(`SELECT COUNT(*) AS total FROM users ${where}`, params);
    return { users:rows, total, page:parseInt(page), limit:parseInt(limit) };
  }

  static async update(id, fields) {
    const allowed = ['name','email','role','roll_number','department','phone','is_active','profile_pic'];
    const sets=[]; const vals=[];
    for(const k of allowed){ if(fields[k]!==undefined){ sets.push(`${k}=?`); vals.push(fields[k]); } }
    if(!sets.length) return false;
    vals.push(id);
    const [r] = await db.query(`UPDATE users SET ${sets.join(',')} WHERE id=?`, vals);
    return r.affectedRows>0;
  }

  static async changePassword(id, newPassword) {
    const hashed = await bcrypt.hash(newPassword, 10);
    const [r] = await db.query('UPDATE users SET password=? WHERE id=?', [hashed, id]);
    return r.affectedRows>0;
  }

  static async delete(id) {
    const [r] = await db.query('UPDATE users SET is_active=0 WHERE id=?', [id]);
    return r.affectedRows>0;
  }

  static async comparePassword(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  }

  static async getStats() {
    const [[s]] = await db.query(`
      SELECT COUNT(*) AS total,
             SUM(role='student') AS students,
             SUM(role='librarian') AS librarians,
             SUM(role='admin') AS admins,
             SUM(is_active=1) AS active
      FROM users`);
    return s;
  }

  static async getIssues(user_id) {
    const [rows] = await db.query(`
      SELECT i.*,b.title AS book_title,b.author,b.isbn,b.department AS book_dept
      FROM issues i JOIN books b ON i.book_id=b.id
      WHERE i.user_id=? ORDER BY i.created_at DESC`, [user_id]);
    return rows;
  }
}
module.exports = User;