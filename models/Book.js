const db = require('../config/db');

class Book {
  static async create(data) {
    const { title,author,isbn,category,department,publisher,edition,year_published,total_copies=1,shelf_location,description,tags } = data;
    const [r] = await db.query(
      `INSERT INTO books (title,author,isbn,category,department,publisher,edition,year_published,total_copies,available_copies,shelf_location,description,tags)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [title,author,isbn,category,department,publisher||null,edition||null,year_published||null,total_copies,total_copies,shelf_location||null,description||null,tags||null]
    );
    return r.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM books WHERE id=? AND is_active=1',[id]);
    return rows[0]||null;
  }

  static async findByISBN(isbn) {
    const [rows] = await db.query('SELECT * FROM books WHERE isbn=?',[isbn]);
    return rows[0]||null;
  }

  static async getAll({ page=1, limit=12, search='', department='', category='', available='' }={}) {
    const offset = (parseInt(page)-1)*parseInt(limit);
    let where = 'WHERE b.is_active=1';
    const params = [];
    if (search) {
      where += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? OR b.tags LIKE ?)';
      const s=`%${search}%`; params.push(s,s,s,s);
    }
    if (department) { where+=' AND b.department=?'; params.push(department); }
    if (category)   { where+=' AND b.category=?';   params.push(category); }
    if (available==='true') { where+=' AND b.available_copies>0'; }

    const lim = parseInt(limit) || 12;
    const off = offset;
    const [rows] = await db.query(
      `SELECT b.* FROM books b ${where} ORDER BY b.title ASC LIMIT ${lim} OFFSET ${off}`,
      params
    );
    const [[{total}]] = await db.query(`SELECT COUNT(*) AS total FROM books b ${where}`, params);
    return { books:rows, total, page:parseInt(page), limit:parseInt(limit) };
  }

  static async getDepartments() {
    const [rows] = await db.query(
      'SELECT department, COUNT(*) as total, SUM(available_copies) as available FROM books WHERE is_active=1 GROUP BY department ORDER BY department'
    );
    return rows;
  }

  static async getCategories(department='') {
    let sql = 'SELECT DISTINCT category FROM books WHERE is_active=1';
    const p = [];
    if (department) { sql+=' AND department=?'; p.push(department); }
    sql+=' ORDER BY category';
    const [rows] = await db.query(sql,p);
    return rows.map(r=>r.category);
  }

  static async update(id, data) {
    const allowed=['title','author','isbn','category','department','publisher','edition','year_published','total_copies','shelf_location','description','tags'];
    const sets=[]; const vals=[];
    for(const k of allowed){ if(data[k]!==undefined){sets.push(`${k}=?`);vals.push(data[k]);} }
    if(!sets.length) return false;
    vals.push(id);
    const [r] = await db.query(`UPDATE books SET ${sets.join(',')} WHERE id=?`,vals);
    return r.affectedRows>0;
  }

  static async adjustAvailable(id, delta) {
    const [r] = await db.query(
      'UPDATE books SET available_copies=available_copies+? WHERE id=? AND available_copies+?>=0',
      [delta,id,delta]
    );
    return r.affectedRows>0;
  }

  static async delete(id) {
    const [r] = await db.query('UPDATE books SET is_active=0 WHERE id=?',[id]);
    return r.affectedRows>0;
  }

  static async getStats() {
    const [[s]] = await db.query(`
      SELECT COUNT(*) AS total_titles,
             SUM(total_copies) AS total_copies,
             SUM(available_copies) AS available_copies,
             SUM(total_copies-available_copies) AS issued_copies,
             COUNT(DISTINCT department) AS departments,
             COUNT(DISTINCT category) AS categories
      FROM books WHERE is_active=1
    `);
    return s;
  }

  static async getPopular(limit=5) {
    const [rows] = await db.query(`
      SELECT b.id,b.title,b.author,b.department,COUNT(i.id) AS issue_count
      FROM books b LEFT JOIN issues i ON b.id=i.book_id
      WHERE b.is_active=1
      GROUP BY b.id,b.title,b.author,b.department
      ORDER BY issue_count DESC LIMIT ${parseInt(limit)||5}
    `);
    return rows;
  }
}
module.exports = Book;