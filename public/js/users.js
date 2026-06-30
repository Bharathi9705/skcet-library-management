/* users.js */
const Users = (() => {
  let _page=1,_r='',_q='',_timer;

  const render = async (page=1)=>{
    _page=page;
    const pc=document.getElementById('page-content');
    pc.innerHTML=`
      <div class="ph">
        <div><h2>👥 User Management</h2><p>Manage students, librarians and admins</p></div>
        <button class="btn btn-primary btn-sm" onclick="Users.showAdd()">＋ Add User</button>
      </div>
      <div class="fbar">
        <input type="text" class="fsrch" placeholder="🔍 Search name / email / roll…" oninput="Users._search(this.value)"/>
        <select class="fsel" onchange="Users._role(this.value)">
          <option value="">All Roles</option>
          <option value="admin">👑 Admin</option>
          <option value="librarian">📋 Librarian</option>
          <option value="student">🎓 Student</option>
        </select>
        <span class="fcount" id="u-count"></span>
      </div>
      <div class="card"><div class="tbl-wrap" id="u-tbl"><div class="loader"><div class="spin"></div></div></div></div>`;
    await _load();
  };

  const _load = async ()=>{
    const tbl=document.getElementById('u-tbl'); if(!tbl) return;
    tbl.innerHTML='<div class="loader"><div class="spin"></div></div>';
    try {
      const qs=`?page=${_page}&limit=15&role=${_r}&search=${encodeURIComponent(_q)}`;
      const {users,total,limit}=await API.get('/users'+qs);
      const cnt=document.getElementById('u-count');
      if(cnt) cnt.textContent=`${total} user${total!==1?'s':''}`;
      if(!users.length){tbl.innerHTML='<div class="empty"><span class="empty-icon">👤</span><h3>No users found</h3></div>';return;}
      tbl.innerHTML=`
        <table>
          <thead><tr><th>#</th><th>Name</th><th>Roll / Dept</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${users.map((u,i)=>`
            <tr>
              <td style="color:var(--text3);font-size:.75rem">${(_page-1)*15+i+1}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="av" style="width:30px;height:30px;font-size:.72rem">${u.name[0].toUpperCase()}</div>
                  <div>
                    <div style="font-weight:600;font-size:.835rem">${esc(u.name)}</div>
                    <div style="font-size:.7rem;color:var(--text3)">#${u.id}</div>
                  </div>
                </div>
              </td>
              <td><div style="font-size:.8rem">${esc(u.roll_number||'—')}</div>
                  <div style="font-size:.72rem;color:var(--text2)">${esc(u.department||'—')}</div></td>
              <td style="font-size:.8rem;color:var(--text2)">${esc(u.email)}</td>
              <td>${roleBadge(u.role)}</td>
              <td><span class="badge ${u.is_active?'b-success':'b-muted'}">${u.is_active?'Active':'Inactive'}</span></td>
              <td>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-ghost btn-icon btn-sm" onclick="Users.showHistory(${u.id})" title="View History">📋</button>
                  <button class="btn btn-outline btn-sm" onclick="Users.showEdit(${u.id})">✏️</button>
                  ${u.is_active
                    ? `<button class="btn btn-danger btn-icon btn-sm" onclick="Users.confirmDeact(${u.id})" title="Deactivate">🗑</button>`
                    : `<button class="btn btn-success btn-icon btn-sm" onclick="Users.reactivate(${u.id})" title="Reactivate">♻️</button>`}
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
        ${pager(total,_page,limit,'Users.render')}`;
    } catch(e){tbl.innerHTML=`<div class="empty"><span class="empty-icon">❌</span><h3>${e.message}</h3></div>`;}
  };

  const _search = val=>{ clearTimeout(_timer);_timer=setTimeout(()=>{_q=val;_page=1;_load();},350); };
  const _role   = val=>{ _r=val;_page=1;_load(); };

  const _form = (u={})=>`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Full Name *</label>
        <input type="text" id="uf-name" class="form-control" value="${esc(u.name||'')}"/></div>
      <div class="form-group"><label class="form-label">Email *</label>
        <input type="email" id="uf-email" class="form-control" value="${esc(u.email||'')}"/></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Roll Number</label>
        <input type="text" id="uf-roll" class="form-control" value="${esc(u.roll_number||'')}"/></div>
      <div class="form-group"><label class="form-label">Phone</label>
        <input type="tel" id="uf-phone" class="form-control" value="${esc(u.phone||'')}"/></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Department</label>
        <select id="uf-dept" class="form-control">
          <option value="">Select</option>
          ${Object.keys(DEPT_CFG).map(d=>`<option value="${esc(d)}" ${u.department===d?'selected':''}>${esc(d)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Role</label>
        <select id="uf-role" class="form-control">
          ${['student','librarian','admin'].map(r=>`<option value="${r}" ${(u.role||'student')===r?'selected':''}>${r}</option>`).join('')}
        </select>
      </div>
    </div>
    ${!u.id?`<div class="form-group"><label class="form-label">Password *</label>
      <div class="pw-wrap"><input type="password" id="uf-pass" class="form-control" placeholder="Min. 6 characters"/>
      <button class="pw-eye" onclick="togglePw('uf-pass',this)">👁</button></div></div>`:''}`;

  const showAdd = ()=>{
    Modal.show('➕ Add User',_form(),
      `<button class="btn btn-outline" onclick="Modal.closeAll()">Cancel</button>
       <button class="btn btn-primary" onclick="Users._create()">Create User</button>`);
  };

  const _create = async ()=>{
    const body={
      name:document.getElementById('uf-name').value.trim(),
      email:document.getElementById('uf-email').value.trim(),
      password:document.getElementById('uf-pass').value,
      roll_number:document.getElementById('uf-roll').value.trim(),
      phone:document.getElementById('uf-phone').value.trim(),
      department:document.getElementById('uf-dept').value,
      role:document.getElementById('uf-role').value,
    };
    if(!body.name||!body.email||!body.password) return Toast.error('Name, email and password required.');
    try {
      await API.post('/auth/register',body);
      Modal.closeAll();Toast.success('User created!');_load();
    } catch(e){Toast.error(e.message);}
  };

  const showEdit = async id=>{
    try {
      const {user:u}=await API.get(`/users/${id}`);
      Modal.show('✏️ Edit User',_form(u),
        `<button class="btn btn-outline" onclick="Modal.closeAll()">Cancel</button>
         <button class="btn btn-primary" onclick="Users._update(${id})">Save</button>`);
    } catch(e){Toast.error(e.message);}
  };

  const _update = async (id)=>{
    const body={
      name:document.getElementById('uf-name').value.trim(),
      email:document.getElementById('uf-email').value.trim(),
      roll_number:document.getElementById('uf-roll').value.trim(),
      phone:document.getElementById('uf-phone').value.trim(),
      department:document.getElementById('uf-dept').value,
      role:document.getElementById('uf-role').value,
    };
    try {
      await API.put(`/users/${id}`,body);
      Modal.closeAll();Toast.success('User updated!');_load();
    } catch(e){Toast.error(e.message);}
  };

  const confirmDeact = id=>{
    Modal.show('Deactivate User','<p>Deactivate this account? The user cannot login until reactivated.</p>',
      `<button class="btn btn-outline" onclick="Modal.closeAll()">Cancel</button>
       <button class="btn btn-danger" onclick="Users._deact(${id})">Deactivate</button>`);
  };

  const _deact = async (id)=>{
    try {
      await API.delete(`/users/${id}`);
      Modal.closeAll();Toast.success('User deactivated.');_load();
    } catch(e){Toast.error(e.message);}
  };

  const reactivate = async id=>{
    try {
      await API.put(`/users/${id}`,{is_active:true});
      Toast.success('✅ User reactivated! They can now log in again.');
      _load();
    } catch(e){Toast.error(e.message);}
  };

  const showHistory = async id=>{
    try {
      const {user}=await API.get(`/users/${id}`);
      const {issues}=await API.get(`/users/${id}/issues`);
      Modal.show(`📋 ${esc(user.name)} — Issue History`,
        issues.length?`<div class="tbl-wrap"><table>
          <thead><tr><th>Book</th><th>Issued</th><th>Due</th><th>Returned</th><th>Fine</th><th>Status</th></tr></thead>
          <tbody>${issues.map(i=>`<tr>
            <td class="td-book"><div class="t">${esc(i.book_title)}</div><div class="s">${esc(i.isbn)}</div></td>
            <td style="font-size:.78rem">${fmtDate(i.issue_date)}</td>
            <td style="font-size:.78rem">${fmtDate(i.due_date)}</td>
            <td style="font-size:.78rem">${fmtDate(i.return_date)}</td>
            <td>${i.fine_amount>0?`<span style="color:${i.fine_paid?'var(--success)':'var(--danger)'};font-weight:700">₹${parseFloat(i.fine_amount).toFixed(2)}</span>`:'—'}</td>
            <td>${statusBadge(i.status)}</td>
          </tr>`).join('')}</tbody>
        </table></div>`:
        '<div class="empty"><span class="empty-icon">📭</span><h3>No issue history</h3></div>',
        `<button class="btn btn-primary" onclick="Modal.closeAll()">Close</button>`);
    } catch(e){Toast.error(e.message);}
  };

  return { render, _search, _role, showAdd, _create, showEdit, _update, confirmDeact, _deact, reactivate, showHistory };
})();