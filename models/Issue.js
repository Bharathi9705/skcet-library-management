const db = require('../config/db');
const FINE = parseFloat(process.env.FINE_PER_DAY||2);
const DAYS = parseInt(process.env.DEFAULT_LOAN_DAYS||14);

class Issue {
  static async create({user_id,book_id,issued_by,loan_days=DAYS}) {
    const issue_date = new Date().toISOString().split('T')[0];
    const due = new Date(); due.setDate(due.getDate()+loan_days);
    const due_date = due.toISOString().split('T')[0];
    const [r] = await db.query(
      `INSERT INTO issues (user_id,book_id,issued_by,issue_date,due_date,fine_per_day,status) VALUES (?,?,?,?,?,?,'issued')`,
      [user_id,book_id,issued_by||null,issue_date,due_date,FINE]
    );
    return r.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT i.*,
        u.name AS student_name,u.email AS student_email,u.roll_number,u.department AS student_dept,
        b.title AS book_title,b.author,b.isbn,b.department AS book_dept,b.shelf_location,
        lib.name AS issued_by_name, ret.name AS returned_to_name
      FROM issues i
      JOIN users u ON i.user_id=u.id
      JOIN books b ON i.book_id=b.id
      LEFT JOIN users lib ON i.issued_by=lib.id
      LEFT JOIN users ret ON i.returned_to=ret.id
      WHERE i.id=?`,[id]);
    return rows[0]||null;
  }

  static async getAll({page=1,limit=15,status='',user_id='',search=''}={}) {
    const offset=(parseInt(page)-1)*parseInt(limit);
    let where='WHERE 1=1'; const params=[];
    if(status)  { where+=' AND i.status=?'; params.push(status); }
    if(user_id) { where+=' AND i.user_id=?'; params.push(user_id); }
    if(search)  {
      where+=' AND (u.name LIKE ? OR u.roll_number LIKE ? OR b.title LIKE ? OR b.isbn LIKE ?)';
      const s=`%${search}%`; params.push(s,s,s,s);
    }
    const lim = parseInt(limit) || 15;
    const [rows] = await db.query(
      `SELECT i.*,u.name AS student_name,u.roll_number,u.email AS student_email,
              b.title AS book_title,b.isbn,b.author,b.department AS book_dept
       FROM issues i JOIN users u ON i.user_id=u.id JOIN books b ON i.book_id=b.id
       ${where} ORDER BY i.created_at DESC LIMIT ${lim} OFFSET ${offset}`,
      params
    );
    const [[{total}]] = await db.query(
      `SELECT COUNT(*) AS total FROM issues i JOIN users u ON i.user_id=u.id JOIN books b ON i.book_id=b.id ${where}`,params
    );
    return {issues:rows,total,page:parseInt(page),limit:parseInt(limit)};
  }

  static async returnBook(id,returned_to) {
    const issue = await Issue.findById(id);
    if(!issue||issue.status==='returned') return null;
    const return_date = new Date().toISOString().split('T')[0];
    const due = new Date(issue.due_date);
    const now = new Date();
    const diff = Math.max(0,Math.floor((now-due)/(1000*60*60*24)));
    const fine_amount = diff * issue.fine_per_day;
    await db.query(
      `UPDATE issues SET return_date=?,returned_to=?,fine_amount=?,status='returned' WHERE id=?`,
      [return_date,returned_to||null,fine_amount,id]
    );
    return {...issue,return_date,fine_amount,days_late:diff};
  }

  static async payFine(id) {
    const [r] = await db.query('UPDATE issues SET fine_paid=1 WHERE id=?',[id]);
    return r.affectedRows>0;
  }

  static async syncOverdue() {
    const [r] = await db.query(`UPDATE issues SET status='overdue' WHERE status='issued' AND due_date<CURDATE()`);
    return r.affectedRows;
  }

  static async findActive(user_id,book_id) {
    const [rows] = await db.query(
      `SELECT * FROM issues WHERE user_id=? AND book_id=? AND status IN ('issued','overdue')`,[user_id,book_id]
    );
    return rows[0]||null;
  }

  static async getByUser(user_id) {
    const [rows] = await db.query(`
      SELECT i.*,b.title AS book_title,b.author,b.isbn,b.department AS book_dept
      FROM issues i JOIN books b ON i.book_id=b.id
      WHERE i.user_id=? ORDER BY i.created_at DESC`,[user_id]);
    return rows;
  }

  static async getStats() {
    const [[s]] = await db.query(`
      SELECT COUNT(*) AS total_issues,
             SUM(status='issued') AS active,
             SUM(status='returned') AS returned,
             SUM(status='overdue') AS overdue,
             SUM(fine_amount) AS total_fines,
             SUM(CASE WHEN fine_paid=1 THEN fine_amount ELSE 0 END) AS collected_fines,
             SUM(CASE WHEN fine_paid=0 AND fine_amount>0 THEN fine_amount ELSE 0 END) AS pending_fines
      FROM issues`);
    return s;
  }

  static async getRecent(limit=8) {
    const [rows] = await db.query(`
      SELECT i.id,i.status,i.issue_date,i.due_date,i.return_date,i.fine_amount,
             u.name AS student_name,u.roll_number,b.title AS book_title
      FROM issues i JOIN users u ON i.user_id=u.id JOIN books b ON i.book_id=b.id
      ORDER BY i.created_at DESC LIMIT ${parseInt(limit)||8}`);
    return rows;
  }

  static async getMonthlyStats() {
    const [rows] = await db.query(`
      SELECT DATE_FORMAT(issue_date,'%b %Y') AS month,
             DATE_FORMAT(issue_date,'%Y-%m') AS month_key,
             COUNT(*) AS issues, SUM(status='returned') AS returns
      FROM issues WHERE issue_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(issue_date,'%Y-%m'), DATE_FORMAT(issue_date,'%b %Y')
      ORDER BY month_key ASC`);
    return rows;
  }
}
module.exports = Issue;