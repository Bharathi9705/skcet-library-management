/* books.js */
const Books = (() => {
  let _page=1, _search='', _dept='', _cat='', _avail='', _timer;

  /* ── Department Home ─────────────────────────────── */
  const renderHome = async () => {
    _dept=''; _search=''; _page=1;
    document.getElementById('g-search').style.display='flex';
    document.getElementById('g-input').value='';
    const pc=document.getElementById('page-content');
    pc.innerHTML='<div class="loader"><div class="spin"></div></div>';
    try {
      const {departments} = await API.get('/books/departments');
      const role=Auth.getUser().role;
      pc.innerHTML=`
        <div class="ph">
          <div><h2>📚 Library Catalog</h2><p>${departments.reduce((s,d)=>s+(d.total||0),0)} books across ${departments.length} departments</p></div>
          ${role!=='student'?`<button class="btn btn-primary" onclick="Books.showAddModal()">＋ Add Book</button>`:''}
        </div>
        <div class="dept-grid" id="dept-grid">
          ${departments.map(d=>{
            const cfg=DEPT_CFG[d.department]||{icon:'📚',color:'#6b7280',short:'?'};
            return`<div class="dept-card" onclick="Books.renderList(1,'${esc(d.department)}')">
              <span class="di">${cfg.icon}</span>
              <div class="dn">${esc(d.department)}</div>
              <div class="dc">${d.total} books · ${d.available} available</div>
              <div style="margin-top:10px">
                <div style="height:4px;background:var(--border);border-radius:99px;overflow:hidden">
                  <div style="height:100%;width:${Math.round((d.available/Math.max(d.total,1))*100)}%;background:${cfg.color};border-radius:99px"></div>
                </div>
              </div>
            </div>`;
          }).join('')}
          <div class="dept-card" onclick="Books.renderList(1,'')">
            <span class="di">🔍</span>
            <div class="dn">All Books</div>
            <div class="dc">Search entire catalog</div>
          </div>
        </div>`;
    } catch(e){
      pc.innerHTML=`<div class="empty"><span class="empty-icon">❌</span><h3>${e.message}</h3></div>`;
    }
  };

  /* ── Book List ────────────────────────────────────── */
  const renderList = async (page=1, dept) => {
    if(dept!==undefined) _dept=dept;
    _page=page;
    document.getElementById('g-search').style.display='flex';
    const pc=document.getElementById('page-content');
    const role=Auth.getUser().role;
    const cfg = _dept?(DEPT_CFG[_dept]||{icon:'📚',color:'#6b7280'}):{icon:'🔍',color:'#6b7280'};

    pc.innerHTML=`
      <div class="ph">
        <div style="display:flex;align-items:center;gap:11px">
          <button class="btn btn-ghost btn-sm" onclick="Books.renderHome()">← Departments</button>
          <div>
            <h2>${cfg.icon} ${_dept||'All Books'}</h2>
            <p>${_dept?`${_dept} collection`:'Complete library catalog'}</p>
          </div>
        </div>
        ${role!=='student'?`<button class="btn btn-primary btn-sm" onclick="Books.showAddModal()">＋ Add Book</button>`:''}
      </div>
      <div class="fbar">
        <select class="fsel" id="dept-sel" onchange="Books._applyDept(this.value)" style="min-width:180px">
          <option value="">All Departments</option>
          ${Object.keys(DEPT_CFG).map(d=>`<option value="${esc(d)}" ${_dept===d?'selected':''}>${DEPT_CFG[d].icon} ${esc(d)}</option>`).join('')}
        </select>
        <select class="fsel" id="cat-sel" onchange="Books._applyFilter()">
          <option value="">All Categories</option>
        </select>
        <select class="fsel" id="avail-sel" onchange="Books._applyFilter()">
          <option value="">All Books</option>
          <option value="true" ${_avail==='true'?'selected':''}>✅ Available Only</option>
        </select>
        <span class="fcount" id="bk-count"></span>
      </div>
      <div id="bk-container"><div class="loader"><div class="spin"></div></div></div>`;

    // Load categories for selected dept
    _loadCategories();
    await _loadBooks();
  };

  const _loadCategories = async () => {
    try {
      const {categories} = await API.get(`/books/categories?department=${encodeURIComponent(_dept)}`);
      const sel=document.getElementById('cat-sel');
      if(!sel) return;
      sel.innerHTML=`<option value="">All Categories</option>
        ${categories.map(c=>`<option value="${esc(c)}" ${_cat===c?'selected':''}>${esc(c)}</option>`).join('')}`;
    } catch{}
  };

  const _loadBooks = async () => {
    const con=document.getElementById('bk-container');
    if(!con) return;
    con.innerHTML='<div class="loader"><div class="spin"></div></div>';
    try {
      const qs=`?page=${_page}&limit=16&search=${encodeURIComponent(_search)}&department=${encodeURIComponent(_dept)}&category=${encodeURIComponent(_cat)}&available=${_avail}`;
      const {books,total,limit}=await API.get('/books'+qs);
      const role=Auth.getUser().role;
      const cnt=document.getElementById('bk-count');
      if(cnt) cnt.textContent=`${total} book${total!==1?'s':''} found`;

      if(!books.length){
        con.innerHTML=`<div class="empty">
          <span class="empty-icon">📭</span>
          <h3>${_search?`No results for "${_search}"`:'No books found'}</h3>
          <p>${_search?'Try different keywords.':'No books in this category yet.'}</p>
          ${role!=='student'?`<button class="btn btn-primary btn-sm" style="margin-top:14px" onclick="Books.showAddModal()">＋ Add First Book</button>`:''}
        </div>`;
        return;
      }

      con.innerHTML=`
        <div class="books-grid">
          ${books.map(b=>{
            const avail=b.available_copies>0;
            const col=deptColor(b.department);
            return`<div class="book-card">
              <div class="bk-thumb" style="background:linear-gradient(145deg,${col}22,${col}44)">
                <span style="font-size:38px">${deptIcon(b.department)}</span>
                <span style="font-size:.62rem;color:${col};font-weight:700;background:${col}22;padding:2px 8px;border-radius:99px">${esc(deptShort(b.department))}</span>
                <span class="bk-avail ${avail?'b-success':'b-danger'}">${avail?`✅ ${b.available_copies}`:'❌ 0'}</span>
              </div>
              <div class="bk-info">
                <div class="bk-title">${esc(b.title)}</div>
                <div class="bk-author">by ${esc(b.author)}</div>
                <div class="bk-meta">
                  <span class="badge b-purple" style="font-size:.62rem">${esc(b.category)}</span>
                  <span style="font-size:.68rem;color:var(--text3)">${esc(b.shelf_location||'')}</span>
                </div>
              </div>
              <div class="bk-actions">
                <button class="btn btn-outline btn-sm" style="flex:1" onclick="Books.showDetail(${b.id})">Details</button>
                ${role!=='student'?`
                  <button class="btn btn-primary btn-icon btn-sm" onclick="Books.showEdit(${b.id})" title="Edit">✏️</button>
                  <button class="btn btn-danger btn-icon btn-sm" onclick="Books.confirmDelete(${b.id})" title="Delete">🗑</button>`
                :`${avail
                  ?`<button class="btn btn-success btn-sm" onclick="Books.requestBook(${b.id})">📋 Request</button>`
                  :`<button class="btn btn-warning btn-sm" onclick="Books.requestBook(${b.id})">📋 Request</button>`}`}
              </div>
            </div>`;
          }).join('')}
        </div>
        ${pager(total,_page,limit,'Books.renderList')}`;
    } catch(e){
      con.innerHTML=`<div class="empty"><span class="empty-icon">❌</span><h3>${e.message}</h3></div>`;
    }
  };

  const onSearch = val => {
    clearTimeout(_timer);
    _timer=setTimeout(()=>{_search=val;_page=1;_loadBooks();},350);
  };

  const _applyDept = val => { _dept=val; _cat=''; _page=1; _loadCategories(); _loadBooks(); };
  const _applyFilter = () => {
    _cat=document.getElementById('cat-sel')?.value||'';
    _avail=document.getElementById('avail-sel')?.value||'';
    _page=1; _loadBooks();
  };

  /* ── Book Detail ──────────────────────────────────── */
  const showDetail = async id => {
    try {
      const {book:b}=await API.get(`/books/${id}`);
      const role=Auth.getUser().role;
      const avail=b.available_copies>0;
      const col=deptColor(b.department);
      const mid=Modal.show(`📖 Book Details`,`
        <div style="display:flex;gap:14px;margin-bottom:18px">
          <div style="width:78px;height:100px;border-radius:10px;background:linear-gradient(145deg,${col}33,${col}55);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;flex-shrink:0">
            <span style="font-size:34px">${deptIcon(b.department)}</span>
          </div>
          <div style="flex:1">
            <h3 style="font-size:1rem;font-weight:700;line-height:1.3">${esc(b.title)}</h3>
            <p style="color:var(--text2);font-size:.82rem;margin-top:4px">by ${esc(b.author)}</p>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
              <span class="badge b-purple">${esc(b.category)}</span>
              <span class="badge ${avail?'b-success':'b-danger'}">${avail?`✅ ${b.available_copies}/${b.total_copies} available`:'❌ Not Available'}</span>
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:.825rem;background:var(--bg);padding:13px;border-radius:10px;margin-bottom:12px">
          ${[['Department',b.department],['ISBN',b.isbn],['Publisher',b.publisher||'—'],
             ['Edition',b.edition||'—'],['Year',b.year_published||'—'],['Shelf',b.shelf_location||'—']
            ].map(([l,v])=>`<div><span style="color:var(--text2)">${l}</span><br/><strong>${esc(String(v))}</strong></div>`).join('')}
        </div>
        ${b.description?`<p style="font-size:.82rem;color:var(--text2);line-height:1.6">${esc(b.description)}</p>`:''}
        ${!avail?`<div style="background:#fee2e2;border-radius:9px;padding:12px 14px;font-size:.82rem;color:#991b1b;margin-top:12px">
          ⚠️ All ${b.total_copies} copies are currently issued. You can reserve this book and get notified when available.
        </div>`:''}`,
        role!=='student'?
          `<button class="btn btn-outline" onclick="Modal.closeAll()">Close</button>
           <button class="btn btn-warning" onclick="Modal.closeAll();Books.showEdit(${id})">✏️ Edit</button>
           ${avail?`<button class="btn btn-primary" onclick="Modal.closeAll();Issues.showIssueModal(${id})">📤 Issue Book</button>`:''}`:
          avail?
          `<button class="btn btn-outline" onclick="Modal.closeAll()">Close</button>
           <button class="btn btn-success" onclick="Modal.closeAll();Books.requestBook(${id})">📋 Request Book</button>`:
          `<button class="btn btn-outline" onclick="Modal.closeAll()">Close</button>
           <button class="btn btn-warning" onclick="Modal.closeAll();Books.requestBook(${id})">📋 Request Book</button>`
      );
    } catch(e){Toast.error(e.message);}
  };

  /* ── Request Book ─────────────────────────────────── */
  const requestBook = async id => {
    try {
      const { book: b } = await API.get(`/books/${id}`);
      const avail = b.available_copies > 0;
      const mid = 'req-modal-' + Date.now();
      document.getElementById('modals').insertAdjacentHTML('beforeend', `
        <div class="modal-bg" id="${mid}" onclick="if(event.target.id==='${mid}')Modal.close('${mid}')">
          <div class="modal">
            <div class="modal-hd">
              <span class="modal-title">📋 Request Book</span>
              <button class="modal-x" onclick="Modal.close('${mid}')">✕</button>
            </div>
            <div class="modal-body">
              <div style="background:var(--bg);border-radius:10px;padding:14px;margin-bottom:16px">
                <div style="font-weight:700;font-size:.95rem">${esc(b.title)}</div>
                <div style="font-size:.8rem;color:var(--text2)">by ${esc(b.author)}</div>
                <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
                  <span class="badge ${avail ? 'b-success' : 'b-danger'}">
                    ${avail ? `✅ ${b.available_copies}/${b.total_copies} copies available` : '❌ Not Available'}
                  </span>
                  <span class="badge b-purple">${esc(b.department)}</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Message to Librarian (optional)</label>
                <textarea id="req-msg" class="form-control" rows="3"
                  placeholder="e.g. I need this book for my project submission..."></textarea>
              </div>
              <div style="background:${avail ? '#dcfce7' : '#dbeafe'};border-radius:8px;padding:10px 14px;font-size:.8rem;color:${avail ? '#166534' : '#1e40af'}">
                ${avail
                  ? '💡 This book is available! Librarian will issue it to you after approving your request.'
                  : '💡 All copies are issued. Librarian will process your request when a copy is returned.'}
              </div>
            </div>
            <div class="modal-ft">
              <button class="btn btn-outline" onclick="Modal.close('${mid}')">Cancel</button>
              <button class="btn btn-primary" onclick="Books._submitRequest(${id},'${mid}')">📋 Submit Request</button>
            </div>
          </div>
        </div>`);
      requestAnimationFrame(() => document.getElementById(mid).classList.add('show'));
    } catch (e) { Toast.error(e.message); }
  };

  const _submitRequest = async (book_id, mid) => {
    const message = document.getElementById('req-msg').value.trim();
    try {
      const { message: msg } = await API.post('/requests', { book_id, message });
      Modal.close(mid);
      Toast.success(msg);
    } catch (e) { Toast.error(e.message); }
  };

  /* ── Add / Edit Form ──────────────────────────────── */
  const _bookForm = (b={}) => `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Title *</label>
        <input type="text" id="bf-title" class="form-control" value="${esc(b.title||'')}"/></div>
      <div class="form-group"><label class="form-label">Author *</label>
        <input type="text" id="bf-author" class="form-control" value="${esc(b.author||'')}"/></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">ISBN *</label>
        <input type="text" id="bf-isbn" class="form-control" value="${esc(b.isbn||'')}"/></div>
      <div class="form-group"><label class="form-label">Department *</label>
        <select id="bf-dept" class="form-control">
          <option value="">Select department</option>
          ${Object.keys(DEPT_CFG).map(d=>`<option value="${esc(d)}" ${b.department===d?'selected':''}>${DEPT_CFG[d].icon} ${esc(d)}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Category *</label>
        <input type="text" id="bf-cat" class="form-control" value="${esc(b.category||'')}" placeholder="e.g. Core, Programming"/></div>
      <div class="form-group"><label class="form-label">Publisher</label>
        <input type="text" id="bf-pub" class="form-control" value="${esc(b.publisher||'')}"/></div>
    </div>
    <div class="form-row-3">
      <div class="form-group"><label class="form-label">Edition</label>
        <input type="text" id="bf-ed" class="form-control" value="${esc(b.edition||'')}"/></div>
      <div class="form-group"><label class="form-label">Year</label>
        <input type="number" id="bf-yr" class="form-control" value="${b.year_published||''}" min="1900" max="2099"/></div>
      <div class="form-group"><label class="form-label">Total Copies</label>
        <input type="number" id="bf-cp" class="form-control" value="${b.total_copies||1}" min="1"/></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Shelf Location</label>
        <input type="text" id="bf-shelf" class="form-control" value="${esc(b.shelf_location||'')}" placeholder="e.g. CS-B01"/></div>
      <div class="form-group"><label class="form-label">Tags (comma-sep)</label>
        <input type="text" id="bf-tags" class="form-control" value="${esc(b.tags||'')}" placeholder="algorithms,data structures"/></div>
    </div>
    <div class="form-group"><label class="form-label">Description</label>
      <textarea id="bf-desc" class="form-control">${esc(b.description||'')}</textarea></div>`;

  const _getForm = () => ({
    title:        document.getElementById('bf-title').value.trim(),
    author:       document.getElementById('bf-author').value.trim(),
    isbn:         document.getElementById('bf-isbn').value.trim(),
    department:   document.getElementById('bf-dept').value,
    category:     document.getElementById('bf-cat').value.trim(),
    publisher:    document.getElementById('bf-pub').value.trim(),
    edition:      document.getElementById('bf-ed').value.trim(),
    year_published: document.getElementById('bf-yr').value||null,
    total_copies: parseInt(document.getElementById('bf-cp').value)||1,
    shelf_location: document.getElementById('bf-shelf').value.trim(),
    tags:         document.getElementById('bf-tags').value.trim(),
    description:  document.getElementById('bf-desc').value.trim(),
  });

  const showAddModal = () => {
    Modal.show('➕ Add New Book', _bookForm(),
      `<button class="btn btn-outline" onclick="Modal.closeAll()">Cancel</button>
       <button class="btn btn-primary" onclick="Books._create()">Add Book</button>`);
  };

  const _create = async () => {
    const d=_getForm();
    if(!d.title||!d.author||!d.isbn||!d.department||!d.category)
      return Toast.error('Title, Author, ISBN, Department and Category are required.');
    try {
      const {book}=await API.post('/books',d);
      Modal.closeAll();
      Toast.success(`✅ "${book.title}" added successfully!`);
      _loadBooks();
    } catch(e){Toast.error(e.message);}
  };

  const showEdit = async id => {
    try {
      const {book:b}=await API.get(`/books/${id}`);
      Modal.show('✏️ Edit Book', _bookForm(b),
        `<button class="btn btn-outline" onclick="Modal.closeAll()">Cancel</button>
         <button class="btn btn-primary" onclick="Books._update(${id})">Save Changes</button>`);
    } catch(e){Toast.error(e.message);}
  };

  const _update = async (id) => {
    try {
      await API.put(`/books/${id}`,_getForm());
      Modal.closeAll();
      Toast.success('Book updated!');
      _loadBooks();
    } catch(e){Toast.error(e.message);}
  };

  const confirmDelete = id => {
    Modal.show('🗑 Delete Book',
      '<p>Delete this book? This cannot be undone. Books with active issues cannot be deleted.</p>',
      `<button class="btn btn-outline" onclick="Modal.closeAll()">Cancel</button>
       <button class="btn btn-danger" onclick="Books._delete(${id})">Delete</button>`);
  };

  const _delete = async (id) => {
    try {
      await API.delete(`/books/${id}`);
      Modal.closeAll();
      Toast.success('Book deleted.');
      _loadBooks();
    } catch(e){Toast.error(e.message);}
  };

  return { renderHome, renderList, onSearch, _applyDept, _applyFilter,
           showDetail, requestBook, _submitRequest, showAddModal, _create, showEdit, _update, confirmDelete, _delete };
})();