/* requests.js — Book Requests management */
const Requests = (() => {
  let _page = 1, _status = 'pending';

  /* ── Librarian/Admin view ────────────────────────── */
  const render = async (page = 1) => {
    _page = page;
    const pc = document.getElementById('page-content');
    const role = Auth.getUser().role;

    if (role === 'student') {
      await renderStudent();
      return;
    }

    pc.innerHTML = `
      <div class="ph">
        <div><h2>📋 Book Requests</h2><p>Review and process student book requests</p></div>
        <button class="btn btn-outline btn-sm" onclick="Requests.render()">🔄 Refresh</button>
      </div>
      <div class="tabs">
        <button class="tab ${_status==='pending'?'active':''}" onclick="Requests._filter('pending',this)">⏳ Pending</button>
        <button class="tab ${_status==='approved'?'active':''}" onclick="Requests._filter('approved',this)">✅ Approved</button>
        <button class="tab ${_status==='rejected'?'active':''}" onclick="Requests._filter('rejected',this)">❌ Rejected</button>
        <button class="tab ${_status===''?'active':''}" onclick="Requests._filter('',this)">📋 All</button>
      </div>
      <div id="req-container"><div class="loader"><div class="spin"></div></div></div>`;

    await _load();
  };

  const _filter = (status, btn) => {
    _status = status;
    _page = 1;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    _load();
  };

  const _load = async () => {
    const con = document.getElementById('req-container');
    if (!con) return;
    con.innerHTML = '<div class="loader"><div class="spin"></div></div>';
    try {
      const qs = `?status=${_status}&page=${_page}&limit=15`;
      const { requests, total, limit } = await API.get('/requests' + qs);

      if (!requests.length) {
        con.innerHTML = `<div class="empty"><span class="empty-icon">${_status === 'pending' ? '🎉' : '📭'}</span>
          <h3>${_status === 'pending' ? 'No pending requests!' : 'No requests found'}</h3>
          <p>${_status === 'pending' ? 'All requests have been processed.' : 'Try a different filter.'}</p>
        </div>`;
        return;
      }

      con.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px">
          ${requests.map(r => `
            <div class="card" style="border-left:4px solid ${
              r.status==='pending'?'var(--warning)':
              r.status==='approved'?'var(--success)':'var(--danger)'}">
              <div class="card-body" style="padding:16px 20px">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
                  <div style="flex:1">
                    <!-- Book info -->
                    <div style="font-weight:700;font-size:.95rem">${esc(r.book_title)}</div>
                    <div style="font-size:.8rem;color:var(--text2)">by ${esc(r.author)} · ${esc(r.isbn)}</div>
                    <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
                      <span class="badge b-purple">${esc(r.book_dept||'')}</span>
                      <span class="badge ${r.available_copies>0?'b-success':'b-danger'}">
                        ${r.available_copies>0?`✅ ${r.available_copies} available`:'❌ Not available'}
                      </span>
                    </div>
                    <!-- Student info -->
                    <div style="margin-top:10px;padding:8px 12px;background:var(--bg);border-radius:8px;font-size:.82rem">
                      <span style="font-weight:600">👤 ${esc(r.student_name)}</span>
                      <span style="color:var(--text2);margin-left:8px">${esc(r.roll_number||'')} · ${esc(r.department||'')}</span>
                      <span style="color:var(--text2);margin-left:8px">📧 ${esc(r.student_email)}</span>
                    </div>
                    ${r.message ? `<div style="margin-top:8px;font-size:.8rem;color:var(--text2);font-style:italic">💬 "${esc(r.message)}"</div>` : ''}
                    ${r.rejection_reason ? `<div style="margin-top:6px;font-size:.8rem;color:var(--danger)">Reason: ${esc(r.rejection_reason)}</div>` : ''}
                    <div style="font-size:.72rem;color:var(--text3);margin-top:6px">
                      Requested: ${fmtDateTime(r.requested_at)}
                    </div>
                  </div>
                  <!-- Actions -->
                  <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
                    <span class="badge ${r.status==='pending'?'b-warning':r.status==='approved'?'b-success':'b-danger'}">
                      ${r.status==='pending'?'⏳':r.status==='approved'?'✅':'❌'} ${r.status}
                    </span>
                    ${r.status === 'pending' ? `
                      <button class="btn btn-success btn-sm" onclick="Requests.approve(${r.id})">
                        ✅ Approve & Issue
                      </button>
                      <button class="btn btn-danger btn-sm" onclick="Requests.showReject(${r.id})">
                        ❌ Reject
                      </button>` : ''}
                  </div>
                </div>
              </div>
            </div>`).join('')}
        </div>
        ${pager(total, _page, limit, 'Requests.render')}`;
    } catch (e) {
      con.innerHTML = `<div class="empty"><span class="empty-icon">❌</span><h3>${e.message}</h3></div>`;
    }
  };

  const approve = async id => {
    try {
      const { message } = await API.put(`/requests/${id}/approve`, {});
      Toast.success(message);
      _load();
      // Update badge count
      _updateBadge();
    } catch (e) { Toast.error(e.message); }
  };

  const showReject = id => {
    const mid = 'rej-' + Date.now();
    document.getElementById('modals').insertAdjacentHTML('beforeend', `
      <div class="modal-bg" id="${mid}" onclick="if(event.target.id==='${mid}')Modal.close('${mid}')">
        <div class="modal">
          <div class="modal-hd">
            <span class="modal-title">❌ Reject Request</span>
            <button class="modal-x" onclick="Modal.close('${mid}')">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Reason for rejection (optional)</label>
              <textarea id="rej-reason" class="form-control" rows="3"
                placeholder="e.g. Book is reserved for exam period..."></textarea>
            </div>
          </div>
          <div class="modal-ft">
            <button class="btn btn-outline" onclick="Modal.close('${mid}')">Cancel</button>
            <button class="btn btn-danger" onclick="Requests._confirmReject(${id},'${mid}')">❌ Reject</button>
          </div>
        </div>
      </div>`);
    requestAnimationFrame(() => document.getElementById(mid).classList.add('show'));
  };

  const _confirmReject = async (id, mid) => {
    const reason = document.getElementById('rej-reason').value.trim();
    try {
      await API.put(`/requests/${id}/reject`, { reason });
      Modal.close(mid);
      Toast.success('Request rejected. Student has been notified.');
      _load();
      _updateBadge();
    } catch (e) { Toast.error(e.message); }
  };

  /* ── Student view — My Requests ─────────────────────── */
  const renderStudent = async () => {
    const pc = document.getElementById('page-content');
    pc.innerHTML = '<div class="loader"><div class="spin"></div></div>';
    try {
      const { requests } = await API.get('/requests');
      pc.innerHTML = `
        <div class="ph">
          <div><h2>📋 My Book Requests</h2><p>Track your book requests</p></div>
          <button class="btn btn-primary btn-sm" onclick="App.go('books')">📚 Browse Books</button>
        </div>
        <div class="card">
          ${requests.length ? `
            <div style="display:flex;flex-direction:column;gap:10px;padding:16px">
              ${requests.map(r => `
                <div style="border:1px solid ${
                  r.status==='pending'?'var(--warning)':
                  r.status==='approved'?'var(--success)':
                  r.status==='rejected'?'var(--danger)':'var(--border)'};
                  border-radius:10px;padding:14px">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
                    <div>
                      <div style="font-weight:700">${esc(r.book_title)}</div>
                      <div style="font-size:.8rem;color:var(--text2)">by ${esc(r.author)} · ${esc(r.isbn)}</div>
                      ${r.message?`<div style="font-size:.78rem;color:var(--text2);margin-top:4px">💬 "${esc(r.message)}"</div>`:''}
                      ${r.rejection_reason?`<div style="font-size:.78rem;color:var(--danger);margin-top:4px">❌ ${esc(r.rejection_reason)}</div>`:''}
                      <div style="font-size:.72rem;color:var(--text3);margin-top:4px">${fmtDateTime(r.requested_at)}</div>
                    </div>
                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
                      <span class="badge ${r.status==='pending'?'b-warning':r.status==='approved'?'b-success':'b-danger'}">
                        ${r.status==='pending'?'⏳ Pending':r.status==='approved'?'✅ Approved':'❌ '+r.status}
                      </span>
                      ${r.status==='pending'?`
                        <button class="btn btn-danger btn-xs" onclick="Requests.cancel(${r.id})">Cancel</button>`:
                      r.status==='approved'?`
                        <span style="font-size:.72rem;color:var(--success)">Book has been issued to you!</span>`:''}
                    </div>
                  </div>
                </div>`).join('')}
            </div>` :
            '<div class="empty" style="padding:48px"><span class="empty-icon">📋</span><h3>No requests yet</h3><p>Browse books and request unavailable ones.</p></div>'}
        </div>`;
    } catch (e) {
      pc.innerHTML = `<div class="empty"><span class="empty-icon">❌</span><h3>${e.message}</h3></div>`;
    }
  };

  const cancel = async id => {
    try {
      await API.put(`/requests/${id}/cancel`, {});
      Toast.success('Request cancelled.');
      renderStudent();
    } catch (e) { Toast.error(e.message); }
  };

  /* ── Update sidebar badge ────────────────────────────── */
  const _updateBadge = async () => {
    try {
      const { count } = await API.get('/requests/count');
      const badge = document.getElementById('req-badge');
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline' : 'none';
      }
    } catch {}
  };

  const loadBadge = _updateBadge;

  return { render, approve, showReject, _confirmReject, cancel, loadBadge, _filter };
})();