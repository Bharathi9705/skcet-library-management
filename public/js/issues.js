/* issues.js */
const Issues = (() => {
  let _page=1,_status='',_q='',_timer;

  /* ── Issue Records ────────────────────────────────── */
  const render = async (page=1) => {
    _page=page;
    const pc=document.getElementById('page-content');
    const role=Auth.getUser().role;
    pc.innerHTML=`
      <div class="ph">
        <div><h2>📋 Issue Records</h2><p>Track all book issues, returns and fines</p></div>
        <div style="display:flex;gap:8px">
          ${role!=='student'?`
            <button class="btn btn-outline btn-sm" onclick="Issues.syncOverdue()">🔄 Sync Overdue</button>
            <button class="btn btn-primary btn-sm" onclick="Issues.showIssueModal()">📤 Issue Book</button>`:
          ''}
        </div>
      </div>
      <div class="fbar">
        <input type="text" class="fsrch" placeholder="🔍 Search student / book / roll no…" oninput="Issues._search(this.value)"/>
        <select class="fsel" onchange="Issues._filterStatus(this.value)">
          <option value="">All Status</option>
          <option value="issued">📤 Issued</option>
          <option value="returned">✅ Returned</option>
          <option value="overdue">⏰ Overdue</option>
        </select>
        <span class="fcount" id="iss-count"></span>
      </div>
      <div class="card"><div class="tbl-wrap" id="iss-tbl"><div class="loader"><div class="spin"></div></div></div></div>`;
    await _load();
  };

  const _load = async () => {
    const tbl=document.getElementById('iss-tbl');
    const role=Auth.getUser().role;
    if(!tbl) return;
    tbl.innerHTML='<div class="loader"><div class="spin"></div></div>';
    try {
      const qs=`?page=${_page}&limit=15&status=${_status}&search=${encodeURIComponent(_q)}`;
      const {issues,total,limit}=await API.get('/issues'+qs);
      const cnt=document.getElementById('iss-count');
      if(cnt) cnt.textContent=`${total} record${total!==1?'s':''}`;
      if(!issues.length){
        tbl.innerHTML='<div class="empty"><span class="empty-icon">📭</span><h3>No records found</h3></div>';
        return;
      }
      tbl.innerHTML=`
        <table>
          <thead><tr><th>#</th><th>Student</th><th>Book</th><th>Issue Date</th><th>Due Date</th><th>Fine</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${issues.map(i=>{
            const dueDays=i.status!=='returned'?Math.ceil((new Date(i.due_date)-new Date())/(1000*60*60*24)):null;
            const late=dueDays!==null&&dueDays<0;
            return`<tr>
              <td style="color:var(--text3);font-size:.75rem">#${i.id}</td>
              <td>
                <div style="font-weight:600;font-size:.835rem">${esc(i.student_name)}</div>
                <div style="font-size:.72rem;color:var(--text2)">${esc(i.roll_number||i.student_email||'')}</div>
              </td>
              <td class="td-book">
                <div class="t">${esc(i.book_title)}</div>
                <div class="s">${esc(i.isbn)} · ${esc(i.book_dept||'')}</div>
              </td>
              <td style="font-size:.8rem;white-space:nowrap">${fmtDate(i.issue_date)}</td>
              <td style="white-space:nowrap">
                <div style="font-size:.8rem;color:${late?'var(--danger)':dueDays!==null&&dueDays<=3?'var(--warning)':'var(--text)'};font-weight:${late?'700':'400'}">
                  ${fmtDate(i.due_date)}
                </div>
                ${dueDays!==null?`<div style="font-size:.68rem;color:${late?'var(--danger)':dueDays<=3?'var(--warning)':'var(--text2)'}">
                  ${late?`${Math.abs(dueDays)}d overdue`:dueDays===0?'Due today':dueDays<=3?`${dueDays}d left`:''}
                </div>`:''}
              </td>
              <td>
                ${i.fine_amount>0?`
                  <div style="font-weight:700;font-size:.835rem;color:${i.fine_paid?'var(--success)':'var(--danger)'}">
                    ₹${parseFloat(i.fine_amount).toFixed(2)}
                  </div>
                  <div style="font-size:.68rem;color:${i.fine_paid?'var(--success)':'var(--danger)'}">
                    ${i.fine_paid?'✅ Paid':'⏳ Pending'}</div>`:
                  '<span style="color:var(--text3)">—</span>'}
              </td>
              <td>${statusBadge(i.status)}</td>
              <td>
                <div style="display:flex;gap:4px;flex-wrap:wrap">
                  <button class="btn btn-ghost btn-icon btn-sm" onclick="Issues.showDetail(${i.id})" title="View">👁</button>
                  ${role!=='student'&&i.status!=='returned'?
                    `<button class="btn btn-success btn-sm" onclick="Issues.returnBook(${i.id})">📥</button>`:''}
                  ${role!=='student'&&i.fine_amount>0&&!i.fine_paid&&i.status==='returned'?
                    `<button class="btn btn-warning btn-sm" onclick="Issues.payFine(${i.id})">💰</button>`:''}
                </div>
              </td>
            </tr>`;}).join('')}
          </tbody>
        </table>
        ${pager(total,_page,limit,'Issues.render')}`;
    } catch(e){
      tbl.innerHTML=`<div class="empty"><span class="empty-icon">❌</span><h3>${e.message}</h3></div>`;
    }
  };

  const _search = val=>{ clearTimeout(_timer);_timer=setTimeout(()=>{_q=val;_page=1;_load();},350); };
  const _filterStatus = val=>{ _status=val;_page=1;_load(); };

  /* ── Issue Book Modal ─────────────────────────────── */
  const showIssueModal = async (preBookId=null) => {
    let students=[], books=[];
    try {
      const [ud,bd]=await Promise.all([
        API.get('/users?role=student&limit=500'),
        API.get('/books?limit=500')
      ]);
      students=ud.users; books=bd.books;
    } catch{}

    const issModalId = 'issue-modal-' + Date.now();
    document.getElementById('modals').insertAdjacentHTML('beforeend', `
      <div class="modal-bg" id="${issModalId}" onclick="if(event.target.id==='${issModalId}')Modal.close('${issModalId}')">
        <div class="modal">
          <div class="modal-hd">
            <span class="modal-title">📤 Issue a Book</span>
            <button class="modal-x" onclick="Modal.close('${issModalId}')">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Search Student</label>
              <input type="text" class="form-control" placeholder="Type name or roll number…"
                     oninput="Issues._filterStu(this.value)"/>
              <select id="iss-user" class="form-control" style="margin-top:6px" size="4">
                ${students.map(u=>`<option value="${u.id}">${esc(u.name)} — ${esc(u.roll_number||'')} (${esc(u.department||'')})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Search Book</label>
              <input type="text" class="form-control" placeholder="Type title, author or ISBN…"
                     oninput="Issues._filterBk(this.value)"/>
              <select id="iss-book" class="form-control" style="margin-top:6px" size="4">
                ${books.map(b=>`<option value="${b.id}" ${b.id==preBookId?'selected':''} ${b.available_copies<1?'disabled':''}>
                  ${b.available_copies<1?'❌':'✅'} ${esc(b.title)} — ${esc(b.author)} (${b.available_copies}/${b.total_copies} avail.)
                </option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Loan Period (days)</label>
                <input type="number" id="iss-days" class="form-control" value="14" min="1" max="60"/></div>
              <div class="form-group"><label class="form-label">Fine/day (₹)</label>
                <input type="number" id="iss-fine" class="form-control" value="2" min="0" step="0.5"/></div>
            </div>
            <div style="background:var(--bg);border-radius:8px;padding:10px 13px;font-size:.78rem;color:var(--text2)">
              💡 Due date = today + loan period. Fine accrues automatically after due date.
            </div>
          </div>
          <div class="modal-ft">
            <button class="btn btn-outline" onclick="Modal.close('${issModalId}')">Cancel</button>
            <button class="btn btn-primary" onclick="Issues._issue('${issModalId}')">📤 Issue Book</button>
          </div>
        </div>
      </div>`);
    requestAnimationFrame(()=>document.getElementById(issModalId).classList.add('show'));

    window._istu=students; window._ibk=books;
  };

  const _filterStu = val=>{
    const sel=document.getElementById('iss-user'); if(!sel||!window._istu) return;
    const v=val.toLowerCase();
    sel.innerHTML=window._istu.filter(u=>u.name.toLowerCase().includes(v)||(u.roll_number||'').toLowerCase().includes(v))
      .map(u=>`<option value="${u.id}">${esc(u.name)} — ${esc(u.roll_number||'')} (${esc(u.department||'')})</option>`).join('');
  };

  const _filterBk = val=>{
    const sel=document.getElementById('iss-book'); if(!sel||!window._ibk) return;
    const v=val.toLowerCase();
    sel.innerHTML=window._ibk.filter(b=>b.title.toLowerCase().includes(v)||b.isbn.toLowerCase().includes(v)||b.author.toLowerCase().includes(v))
      .map(b=>`<option value="${b.id}" ${b.available_copies<1?'disabled':''}>
        ${b.available_copies<1?'❌':'✅'} ${esc(b.title)} — ${esc(b.author)} (${b.available_copies}/${b.total_copies} avail.)
      </option>`).join('');
  };

  const _issue = async mid=>{
    const user_id=document.getElementById('iss-user').value;
    const book_id=document.getElementById('iss-book').value;
    const loan_days=parseInt(document.getElementById('iss-days').value)||14;
    if(!user_id||!book_id) return Toast.error('Select both student and book.');
    try {
      const {issue,message}=await API.post('/issues',{user_id:+user_id,book_id:+book_id,loan_days});
      Modal.close(mid);
      Toast.success(`✅ Issued! Due: ${fmtDate(issue.due_date)}`);
      _load();
    } catch(e){Toast.error(e.message);}
  };

  /* ── Return Book ──────────────────────────────────── */
  const returnBook = id=>{
    Modal.show('📥 Return Book',`
      <div style="text-align:center;padding:10px 0">
        <div style="font-size:52px;margin-bottom:10px">📚</div>
        <p style="font-size:.95rem;font-weight:600">Confirm book return?</p>
        <p style="font-size:.82rem;color:var(--text2);margin-top:6px">Fine will be calculated automatically if overdue (₹2/day).</p>
      </div>`,
      `<button class="btn btn-outline" onclick="Modal.closeAll()">Cancel</button>
       <button class="btn btn-success" onclick="Issues._return(${id})">✅ Confirm Return</button>`);
  };

  const _return = async (id)=>{
    try {
      const {message,issue}=await API.put(`/issues/${id}/return`,{});
      Modal.closeAll();
      if(issue&&issue.fine_amount>0){
        Modal.show('💰 Fine Charged',`
          <div style="text-align:center">
            <div style="font-size:48px;margin-bottom:12px">⚠️</div>
            <h3 style="color:var(--danger);margin-bottom:8px">Late Return Fine</h3>
            <div style="font-size:2.2rem;font-weight:800;color:var(--danger);margin:12px 0">₹${parseFloat(issue.fine_amount).toFixed(2)}</div>
            <p style="color:var(--text2);font-size:.85rem">${issue.days_late} day(s) late × ₹2.00/day</p>
            <div style="background:var(--bg);border-radius:10px;padding:13px;margin-top:16px;font-size:.82rem;text-align:left">
              <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Days Overdue</span><strong style="color:var(--danger)">${issue.days_late} days</strong></div>
              <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Rate</span><strong>₹2.00 / day</strong></div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid var(--border);margin-top:4px">
                <span style="font-weight:700">Total Fine</span><strong style="color:var(--danger);font-size:1rem">₹${parseFloat(issue.fine_amount).toFixed(2)}</strong>
              </div>
            </div>
          </div>`,
          `<button class="btn btn-outline" onclick="Modal.closeAll()">Close</button>
           <button class="btn btn-warning" onclick="Issues.payFine(${id});Modal.closeAll()">💰 Collect Fine Now</button>`);
      } else {
        Toast.success('✅ '+message);
      }
      _load();
      // Refresh recent returns list if visible on Return page
      if(document.getElementById('ret-recent')) _loadRecentReturns();
      if(document.getElementById('ov-list')){
        try {
          const {issues}=await API.get('/issues?status=overdue&limit=20');
          const ol=document.getElementById('ov-list');
          if(ol){
            if(!issues.length){
              ol.innerHTML='<div class="empty" style="padding:24px"><span class="empty-icon">✅</span><h3>No overdue books!</h3></div>';
            }
          }
        } catch{}
      }
    } catch(e){Toast.error(e.message);}
  };

  const payFine = async id=>{
    try {
      await API.put(`/issues/${id}/pay-fine`,{});
      Toast.success('💰 Fine collected!');
      _load();
    } catch(e){Toast.error(e.message);}
  };

  /* ── Detail ───────────────────────────────────────── */
  const showDetail = async id=>{
    try {
      const {issue:i}=await API.get(`/issues/${id}`);
      Modal.show(`📋 Issue #${i.id}`,`
        <div style="background:var(--bg);border-radius:10px;padding:13px;margin-bottom:14px">
          <div style="font-weight:700;font-size:.95rem">${esc(i.book_title)}</div>
          <div style="font-size:.78rem;color:var(--text2)">by ${esc(i.author)} · ${esc(i.isbn)}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:.825rem">
          ${[['Student',i.student_name],['Roll No.',i.roll_number||'—'],
             ['Department',i.student_dept||'—'],['Status',`${statusBadge(i.status)}`],
             ['Issue Date',fmtDate(i.issue_date)],['Due Date',fmtDate(i.due_date)],
             ['Return Date',fmtDate(i.return_date)],['Issued By',i.issued_by_name||'—'],
            ].map(([l,v])=>`<div><span style="color:var(--text2)">${l}</span><br/><strong>${v}</strong></div>`).join('')}
          <div style="grid-column:1/-1;border-top:1px solid var(--border);padding-top:10px;margin-top:4px">
            <span style="color:var(--text2)">Fine</span><br/>
            <strong style="font-size:1.05rem;color:${i.fine_amount>0?'var(--danger)':'var(--success)'}">
              ${i.fine_amount>0?`₹${parseFloat(i.fine_amount).toFixed(2)} ${i.fine_paid?'(✅ Paid)':'(⏳ Pending)'}`: 'No Fine — Returned on time'}
            </strong>
          </div>
        </div>`,
        `<button class="btn btn-primary" onclick="Modal.closeAll()">Close</button>`);
    } catch(e){Toast.error(e.message);}
  };

  /* ── Return Book Page ─────────────────────────────── */
  const renderReturn = async ()=>{
    const pc=document.getElementById('page-content');
    pc.innerHTML=`
      <div class="ph"><div><h2>📥 Return a Book</h2><p>Process book returns quickly</p></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;margin-bottom:16px">
        <div class="card">
          <div class="card-hd"><span class="card-title">🔍 Search Active Issues</span></div>
          <div class="card-body">
            <input type="text" class="form-control" id="ret-inp" placeholder="Type student name, roll no or book title…"
                   oninput="Issues._searchRet(this.value)"/>
            <div id="ret-res" style="margin-top:12px"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-hd"><span class="card-title">⏰ Overdue Books</span></div>
          <div id="ov-list"><div class="loader"><div class="spin"></div></div></div>
        </div>
      </div>
      <div class="card">
        <div class="card-hd">
          <span class="card-title">✅ Recently Returned</span>
          <button class="btn btn-ghost btn-xs" onclick="Issues._loadRecentReturns()">🔄 Refresh</button>
        </div>
        <div id="ret-recent"><div class="loader"><div class="spin"></div></div></div>
      </div>`;

    try {
      const {issues}=await API.get('/issues?status=overdue&limit=20');
      const ol=document.getElementById('ov-list');
      if(!issues.length){
        ol.innerHTML='<div class="empty" style="padding:24px"><span class="empty-icon">✅</span><h3>No overdue books!</h3></div>';
      } else {
        ol.innerHTML=`<div class="tbl-wrap"><table>
          <thead><tr><th>Student</th><th>Book</th><th>Days Late</th><th>Fine</th><th></th></tr></thead>
          <tbody>${issues.map(i=>{
            const days=Math.ceil((new Date()-new Date(i.due_date))/(1000*60*60*24));
            return`<tr>
              <td><div style="font-weight:600;font-size:.82rem">${esc(i.student_name)}</div>
                  <div style="font-size:.7rem;color:var(--text2)">${esc(i.roll_number||'')}</div></td>
              <td style="font-size:.8rem;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(i.book_title)}</td>
              <td><span class="badge b-danger">${days}d</span></td>
              <td style="font-size:.82rem;color:var(--danger);font-weight:700">₹${(days*2).toFixed(2)}</td>
              <td><button class="btn btn-success btn-xs" onclick="Issues.returnBook(${i.id})">Return</button></td>
            </tr>`;}).join('')}
          </tbody>
        </table></div>`;
      }
    } catch{}

    _loadRecentReturns();
  };

  const _loadRecentReturns = async ()=>{
    const el=document.getElementById('ret-recent');
    if(!el) return;
    el.innerHTML='<div class="loader"><div class="spin"></div></div>';
    try {
      const {issues}=await API.get('/issues?status=returned&limit=10');
      if(!issues.length){
        el.innerHTML='<div class="empty" style="padding:24px"><span class="empty-icon">📭</span><h3>No returns yet</h3></div>';
        return;
      }
      el.innerHTML=`<div class="tbl-wrap"><table>
        <thead><tr><th>Student</th><th>Book</th><th>Issued</th><th>Returned</th><th>Fine</th><th>Status</th></tr></thead>
        <tbody>${issues.map(i=>`
          <tr>
            <td><div style="font-weight:600;font-size:.82rem">${esc(i.student_name)}</div>
                <div style="font-size:.7rem;color:var(--text2)">${esc(i.roll_number||'')}</div></td>
            <td class="td-book"><div class="t">${esc(i.book_title)}</div><div class="s">${esc(i.isbn)}</div></td>
            <td style="font-size:.8rem">${fmtDate(i.issue_date)}</td>
            <td style="font-size:.8rem;color:var(--success);font-weight:600">${fmtDate(i.return_date)}</td>
            <td>${i.fine_amount>0?`<span style="color:${i.fine_paid?'var(--success)':'var(--danger)'};font-weight:700">₹${parseFloat(i.fine_amount).toFixed(2)} ${i.fine_paid?'✅':'⏳'}</span>`:'<span style="color:var(--text3)">No fine</span>'}</td>
            <td>${statusBadge(i.status)}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;
    } catch(e){
      el.innerHTML=`<div class="empty"><span class="empty-icon">❌</span><h3>${e.message}</h3></div>`;
    }
  };

  let _retTimer;
  const _searchRet = val=>{
    clearTimeout(_retTimer);
    _retTimer=setTimeout(async()=>{
      if(!val.trim()){document.getElementById('ret-res').innerHTML='';return;}
      const res=document.getElementById('ret-res');
      res.innerHTML='<div class="loader" style="padding:20px"><div class="spin"></div></div>';
      try {
        const {issues}=await API.get(`/issues?status=issued&search=${encodeURIComponent(val)}&limit=20`);
        if(!issues.length){res.innerHTML='<p style="color:var(--text2);font-size:.85rem;text-align:center">No active issues found.</p>';return;}
        res.innerHTML=`<div style="display:flex;flex-direction:column;gap:8px">
          ${issues.map(i=>{
            const days=Math.ceil((new Date(i.due_date)-new Date())/(1000*60*60*24));
            const late=days<0;
            return`<div style="border:1px solid ${late?'var(--danger)':'var(--border)'};border-radius:10px;padding:12px;background:${late?'rgba(220,38,38,.04)':'var(--card)'}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
                <div>
                  <div style="font-weight:700;font-size:.855rem">${esc(i.book_title)}</div>
                  <div style="font-size:.75rem;color:var(--text2)">${esc(i.student_name)} · ${esc(i.roll_number||'')}</div>
                  <div style="font-size:.75rem;margin-top:3px;color:${late?'var(--danger)':'var(--text2)'}">
                    Due: ${fmtDate(i.due_date)} ${late?`<strong>(${Math.abs(days)}d overdue · Fine: ₹${(Math.abs(days)*2).toFixed(2)})</strong>`:days===0?'(Due today!)':''}
                  </div>
                </div>
                <button class="btn btn-success btn-sm" onclick="Issues.returnBook(${i.id})" style="flex-shrink:0">📥 Return</button>
              </div>
            </div>`;}).join('')}
        </div>`;
      } catch(e){res.innerHTML=`<p style="color:var(--danger);font-size:.85rem">${e.message}</p>`;}
    },400);
  };

  const syncOverdue = async ()=>{
    try {
      const {message}=await API.post('/issues/sync-overdue',{});
      Toast.info(message);
      _load();
    } catch(e){Toast.error(e.message);}
  };

  return { render, renderReturn, _search, _filterStatus, showIssueModal,
           _filterStu, _filterBk, _issue, returnBook, _return, payFine,
           showDetail, syncOverdue, _searchRet, _loadRecentReturns };
})();