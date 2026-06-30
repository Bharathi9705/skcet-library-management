/* dashboard.js */
const Dashboard = (() => {

  const render = async () => {
    const role = Auth.getUser().role;
    if(role==='student') { await renderStudent(); return; }
    await renderAdmin();
  };

  /* ── Admin/Librarian Dashboard ─────────────────────── */
  const renderAdmin = async () => {
    const pc=document.getElementById('page-content');
    pc.innerHTML='<div class="loader"><div class="spin"></div></div>';
    try {
      const {stats,recent,monthly} = await API.get('/issues/stats');
      const {is,bk,us} = {is:stats.issues,bk:stats.books,us:stats.users};

      // Build monthly chart
      const maxIssues = Math.max(...(monthly.map(m=>m.issues)||[1]),1);
      const barChart = monthly.length ? `
        <div class="bar-chart">
          ${monthly.map(m=>`
            <div class="bar" style="height:${Math.round((m.issues/maxIssues)*140)}px;background:var(--primary-l);opacity:.85"
                 title="${m.month}: ${m.issues} issues"></div>`).join('')}
        </div>
        <div class="bar-labels">
          ${monthly.map(m=>`<span>${m.month.split(' ')[0]}</span>`).join('')}
        </div>` : '<p style="color:var(--text2);text-align:center;padding:40px 0">No data yet</p>';

      pc.innerHTML=`
        <div class="ph">
          <div><h2>📊 Dashboard</h2><p>Welcome back, ${esc(Auth.getUser().name)}! Here's today's overview.</p></div>
          <button class="btn btn-outline btn-sm" onclick="Issues.syncOverdue()">🔄 Sync Overdue</button>
        </div>

        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-ic ic-blue">📚</div>
            <div><div class="stat-val">${bk.total_titles??0}</div><div class="stat-lbl">Total Titles</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic ic-green">✅</div>
            <div><div class="stat-val">${bk.available_copies??0}</div><div class="stat-lbl">Available Copies</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic ic-amber">📤</div>
            <div><div class="stat-val">${is.active??0}</div><div class="stat-lbl">Books Issued</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic ic-red">⏰</div>
            <div><div class="stat-val">${is.overdue??0}</div><div class="stat-lbl">Overdue</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic ic-purple">👥</div>
            <div><div class="stat-val">${us.students??0}</div><div class="stat-lbl">Students</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic ic-orange">💰</div>
            <div><div class="stat-val">₹${parseFloat(is.pending_fines??0).toFixed(0)}</div><div class="stat-lbl">Pending Fines</div></div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 380px;gap:16px;align-items:start">
          <!-- Recent Activity -->
          <div class="card">
            <div class="card-hd">
              <span class="card-title">📋 Recent Activity</span>
              <button class="btn btn-outline btn-xs" onclick="App.go('issues')">View All</button>
            </div>
            <div class="tbl-wrap">
              <table>
                <thead><tr><th>Student</th><th>Book</th><th>Issue Date</th><th>Due Date</th><th>Status</th></tr></thead>
                <tbody>
                  ${recent.length ? recent.map(r=>`
                    <tr>
                      <td><div style="font-weight:600;font-size:.82rem">${esc(r.student_name)}</div>
                          <div style="font-size:.7rem;color:var(--text2)">${esc(r.roll_number||'')}</div></td>
                      <td class="td-book"><div class="t">${esc(r.book_title)}</div></td>
                      <td style="font-size:.8rem">${fmtDate(r.issue_date)}</td>
                      <td style="font-size:.8rem">${fmtDate(r.due_date)}</td>
                      <td>${statusBadge(r.status)}</td>
                    </tr>`).join('') :
                    '<tr><td colspan="5"><div class="empty"><span class="empty-icon">📭</span><h3>No activity yet</h3></div></td></tr>'}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Right panel -->
          <div style="display:flex;flex-direction:column;gap:14px">
            <!-- Chart -->
            <div class="card">
              <div class="card-hd"><span class="card-title">📈 Issue Trend (6 months)</span></div>
              <div class="card-body">${barChart}</div>
            </div>

            <!-- Quick actions -->
            <div class="card">
              <div class="card-hd"><span class="card-title">⚡ Quick Actions</span></div>
              <div class="card-body" style="display:flex;flex-direction:column;gap:8px">
                <button class="btn btn-primary" style="justify-content:center" onclick="Issues.showIssueModal()">📤 Issue a Book</button>
                <button class="btn btn-success" style="justify-content:center" onclick="App.go('return-book')">📥 Return a Book</button>
                <button class="btn btn-outline" style="justify-content:center" onclick="App.go('books')">📚 Browse Catalog</button>
                <button class="btn btn-outline" style="justify-content:center" onclick="App.go('reports')">📊 View Reports</button>
              </div>
            </div>

            <!-- Collection summary -->
            <div class="card">
              <div class="card-hd"><span class="card-title">📚 Collection</span></div>
              <div class="card-body">
                ${[['Departments',bk.departments??0,'#3b82f6'],['Categories',bk.categories??0,'#8b5cf6'],
                   ['Total Copies',bk.total_copies??0,'#16a34a'],['Issued Out',bk.issued_copies??0,'#f59e0b']
                  ].map(([l,v,c])=>`
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">
                    <span style="font-size:.82rem;color:var(--text2)">${l}</span>
                    <span style="font-size:.92rem;font-weight:700;color:${c}">${v}</span>
                  </div>`).join('')}
              </div>
            </div>
          </div>
        </div>`;
    } catch(e){
      pc.innerHTML=`<div class="empty"><span class="empty-icon">❌</span><h3>${e.message}</h3></div>`;
    }
  };

  /* ── Student Dashboard ─────────────────────────────── */
  const renderStudent = async () => {
    const pc=document.getElementById('page-content');
    const u=Auth.getUser();
    pc.innerHTML='<div class="loader"><div class="spin"></div></div>';
    try {
      const issues = await API.get(`/users/${u.id}/issues`);
      const myIssues = issues.issues||[];
      const active   = myIssues.filter(i=>i.status==='issued'||i.status==='overdue');
      const overdue  = myIssues.filter(i=>i.status==='overdue');
      const returned = myIssues.filter(i=>i.status==='returned');
      const totalFine= myIssues.reduce((s,i)=>s+(parseFloat(i.fine_amount)||0),0);
      const unpaid   = myIssues.filter(i=>i.fine_amount>0&&!i.fine_paid).reduce((s,i)=>s+parseFloat(i.fine_amount),0);

      pc.innerHTML=`
        <div class="ph">
          <div><h2>🎓 My Library</h2><p>Welcome, ${esc(u.name)}! Your borrowing overview.</p></div>
          <button class="btn btn-primary btn-sm" onclick="App.go('books')">📚 Browse Books</button>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-ic ic-blue">📤</div>
            <div><div class="stat-val">${active.length}</div><div class="stat-lbl">Currently Borrowed</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic ic-red">⏰</div>
            <div><div class="stat-val">${overdue.length}</div><div class="stat-lbl">Overdue Books</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic ic-green">✅</div>
            <div><div class="stat-val">${returned.length}</div><div class="stat-lbl">Books Returned</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic ic-amber">💰</div>
            <div><div class="stat-val">₹${unpaid.toFixed(0)}</div><div class="stat-lbl">Pending Fine</div></div>
          </div>
        </div>

        ${overdue.length?`
        <div class="fine-banner" style="margin-bottom:16px">
          <span style="font-size:32px">⚠️</span>
          <div>
            <div style="font-weight:700;font-size:1rem">You have ${overdue.length} overdue book${overdue.length>1?'s':''}!</div>
            <div style="font-size:.82rem;opacity:.85;margin-top:2px">Please return immediately to avoid additional fines (₹2/day)</div>
          </div>
        </div>`:''}

        <div style="display:grid;grid-template-columns:1fr 300px;gap:16px;align-items:start">
          <div>
            <div class="tabs">
              <button class="tab active" onclick="Dashboard.stuTab('active',this)">📤 Active (${active.length})</button>
              <button class="tab" onclick="Dashboard.stuTab('returned',this)">✅ Returned (${returned.length})</button>
              <button class="tab" onclick="Dashboard.stuTab('all',this)">📋 All History</button>
            </div>
            <div id="stu-issues">
              ${renderIssueList(active,'active')}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px">
            <div class="card">
              <div class="card-hd"><span class="card-title">👤 My Profile</span></div>
              <div class="card-body" style="text-align:center">
                <div class="av av-lg" style="margin:0 auto 10px" id="std-av">${u.name[0].toUpperCase()}</div>
                <div style="font-weight:700">${esc(u.name)}</div>
                <div style="font-size:.8rem;color:var(--text2)">${esc(u.email)}</div>
                <div style="margin-top:8px">${roleBadge(u.role)}</div>
                ${u.roll_number?`<div style="font-size:.78rem;color:var(--text2);margin-top:8px">🎓 ${esc(u.roll_number)}</div>`:''}
                ${u.department?`<div style="font-size:.75rem;color:var(--text2)">${esc(u.department)}</div>`:''}
                <button class="btn btn-outline btn-sm" style="width:100%;justify-content:center;margin-top:12px" onclick="App.go('profile')">Edit Profile</button>
              </div>
            </div>
            <div class="card">
              <div class="card-hd"><span class="card-title">📌 Quick Links</span></div>
              <div class="card-body" style="display:flex;flex-direction:column;gap:7px">
                <button class="btn btn-outline btn-sm" style="justify-content:center" onclick="App.go('books')">📚 Browse All Books</button>
                <button class="btn btn-outline btn-sm" style="justify-content:center" onclick="App.go('issues')">📋 My Issue History</button>
                <button class="btn btn-outline btn-sm" style="justify-content:center" onclick="App.go('reservations')">📌 My Reservations</button>
              </div>
            </div>
          </div>
        </div>`;

      // load saved pic
      _loadPic();
    } catch(e){
      pc.innerHTML=`<div class="empty"><span class="empty-icon">❌</span><h3>${e.message}</h3></div>`;
    }
  };

  const _issuesCache = {};
  const stuTab = async (type, btn) => {
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    btn.classList.add('active');
    const u=Auth.getUser();
    const el=document.getElementById('stu-issues');
    el.innerHTML='<div class="loader"><div class="spin"></div></div>';
    try {
      const res = await API.get(`/users/${u.id}/issues`);
      const all = res.issues||[];
      let list = type==='active'?all.filter(i=>i.status==='issued'||i.status==='overdue')
               : type==='returned'?all.filter(i=>i.status==='returned')
               : all;
      el.innerHTML = renderIssueList(list,type);
    } catch{}
  };

  const renderIssueList = (issues, type) => {
    if(!issues.length) return `<div class="empty"><span class="empty-icon">📭</span><h3>No records</h3></div>`;
    return `<div style="display:flex;flex-direction:column;gap:10px">
      ${issues.map(i=>{
        const due=new Date(i.due_date);
        const now=new Date();
        const daysLeft=Math.ceil((due-now)/(1000*60*60*24));
        const late=daysLeft<0;
        return`<div class="card" style="border-left:4px solid ${i.status==='overdue'?'var(--danger)':i.status==='returned'?'var(--success)':'var(--primary)'}">
          <div class="card-body" style="padding:14px 16px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
              <div style="flex:1">
                <div style="font-weight:700;font-size:.875rem">${esc(i.book_title)}</div>
                <div style="font-size:.75rem;color:var(--text2)">${esc(i.author||'')} · ISBN: ${esc(i.isbn)}</div>
                <div style="font-size:.75rem;margin-top:5px;display:flex;gap:12px;flex-wrap:wrap">
                  <span>📅 Issued: ${fmtDate(i.issue_date)}</span>
                  <span style="color:${late&&i.status!=='returned'?'var(--danger)':'var(--text2)'}">
                    🗓 Due: ${fmtDate(i.due_date)}
                    ${i.status!=='returned'?late?` <strong style="color:var(--danger)">(${Math.abs(daysLeft)}d overdue)</strong>`:daysLeft===0?' <strong style="color:var(--warning)">(Today!)</strong>':daysLeft<=3?` <strong style="color:var(--warning)">(${daysLeft}d left)</strong>`:'':''}
                  </span>
                  ${i.return_date?`<span>↩️ Returned: ${fmtDate(i.return_date)}</span>`:''}
                </div>
                ${i.fine_amount>0?`<div style="font-size:.75rem;margin-top:4px;color:${i.fine_paid?'var(--success)':'var(--danger)'};font-weight:600">
                  💰 Fine: ₹${parseFloat(i.fine_amount).toFixed(2)} ${i.fine_paid?'(Paid)':'(Pending)'}
                </div>`:''}
              </div>
              ${statusBadge(i.status)}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  };

  const _loadPic = () => {
    const u=Auth.getUser();
    const pic=localStorage.getItem(`lms_pic_${u.id}`);
    const el=document.getElementById('std-av');
    if(pic&&el){ el.style.backgroundImage=`url(${pic})`;el.style.backgroundSize='cover';el.textContent=''; }
  };

  return { render, stuTab };
})();
