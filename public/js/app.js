/* app.js — Router, sidebar, profile, theme, bootstrap */
const App = (() => {
  let _cur = 'dashboard';
  let _dark = localStorage.getItem('lms_theme') === 'dark';

  /* ── Nav config ─────────────────────────────────────── */
  const NAV = {
    admin: [
      { sec: 'Main' },
      { id: 'dashboard',   label: 'Dashboard',     ic: '🏠' },
      { id: 'books',       label: 'Book Catalog',   ic: '📚' },
      { sec: 'Circulation' },
      { id: 'issues',      label: 'Issue Records',  ic: '📋' },
      { id: 'issue-book',  label: 'Issue a Book',   ic: '📤' },
      { id: 'return-book', label: 'Return a Book',  ic: '📥' },
      { sec: 'Admin' },
      { id: 'users',       label: 'Users',          ic: '👥' },
      { id: 'reports',     label: 'Reports',        ic: '📊' },
      { id: 'requests',    label: 'Book Requests',  ic: '📋', badge: 'req-badge' },
      { id: 'reservations',label: 'Reservations',   ic: '📌' },
      { id: 'profile',     label: 'My Profile',     ic: '👤' },
    ],
    librarian: [
      { sec: 'Main' },
      { id: 'dashboard',   label: 'Dashboard',     ic: '🏠' },
      { id: 'books',       label: 'Book Catalog',   ic: '📚' },
      { sec: 'Circulation' },
      { id: 'issues',      label: 'Issue Records',  ic: '📋' },
      { id: 'issue-book',  label: 'Issue a Book',   ic: '📤' },
      { id: 'return-book', label: 'Return a Book',  ic: '📥' },
      { sec: 'Users' },
      { id: 'users',       label: 'Students',       ic: '👥' },
      { id: 'reports',     label: 'Reports',        ic: '📊' },
      { id: 'requests',    label: 'Book Requests',  ic: '📋', badge: 'req-badge' },
      { id: 'profile',     label: 'My Profile',     ic: '👤' },
    ],
    student: [
      { sec: 'Library' },
      { id: 'dashboard',    label: 'My Dashboard',  ic: '🏠' },
      { id: 'books',        label: 'Browse Books',  ic: '📚' },
      { id: 'issues',       label: 'My Issues',     ic: '📋' },
      { id: 'requests',     label: 'My Requests',   ic: '📝' },
      { id: 'reservations', label: 'Reservations',  ic: '📌' },
      { id: 'profile',      label: 'My Profile',    ic: '👤' },
    ],
  };

  /* ── Build sidebar ───────────────────────────────────── */
  const _buildNav = role => {
    const items = NAV[role] || NAV.student;
    document.getElementById('sb-nav').innerHTML = items.map(item => {
      if (item.sec) return `<div class="sb-label">${item.sec}</div>`;
      return `<div class="sb-item ${item.id === _cur ? 'active' : ''}" id="nav-${item.id}" onclick="App.go('${item.id}')">
        <span class="ic">${item.ic}</span>${item.label}
        ${item.badge ? `<span class="sb-badge" id="${item.badge}" style="display:none">0</span>` : ''}
      </div>`;
    }).join('');
  };

  /* ── Page router ─────────────────────────────────────── */
  const go = page => {
    _cur = page;
    document.querySelectorAll('.sb-item').forEach(el => el.classList.remove('active'));
    const active = document.getElementById('nav-' + page);
    if (active) active.classList.add('active');

    const titles = {
      dashboard: 'Dashboard', books: 'Book Catalog', issues: 'Issue Records',
      users: 'User Management', reports: 'Reports & Analytics', profile: 'My Profile',
      'issue-book': 'Issue a Book', 'return-book': 'Return a Book',
      reservations: 'Reservations', requests: 'Book Requests',
    };
    document.getElementById('page-title').textContent = titles[page] || page;

    // Show/hide global search
    const gs = document.getElementById('g-search');
    if (gs) gs.style.display = page === 'books' ? 'flex' : 'none';

    closeSidebar();

    switch (page) {
      case 'dashboard':    Dashboard.render();          break;
      case 'books':        Books.renderHome();          break;
      case 'issues':       Issues.render();             break;
      case 'users':        Users.render();              break;
      case 'reports':      Reports.render();            break;
      case 'requests':     Requests.render();           break;
      case 'profile':      _renderProfile();            break;
      case 'issue-book':   go('issues'); setTimeout(()=>Issues.showIssueModal(),100); break;
      case 'return-book':  Issues.renderReturn();       break;
      case 'reservations': _renderReservations();       break;
      default:
        document.getElementById('page-content').innerHTML =
          '<div class="empty"><span class="empty-icon">🔍</span><h3>Page not found</h3></div>';
    }
  };

  /* ── Profile page ────────────────────────────────────── */
  const _renderProfile = async () => {
    const pc = document.getElementById('page-content');
    // Refresh user from server to get latest profile_pic
    try { const d = await API.get('/auth/me'); Auth.setUser(d.user); } catch {}
    const u = Auth.getUser();
    const savedPic = u.profile_pic || null;

    const avHtml = savedPic
      ? `<img src="${savedPic}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--primary-l)" id="prof-img"/>`
      : `<div class="av av-lg" id="prof-img" style="margin:0 auto">${u.name[0].toUpperCase()}</div>`;

    pc.innerHTML = `
      <div class="ph"><div><h2>👤 My Profile</h2></div></div>
      <div style="display:grid;grid-template-columns:300px 1fr;gap:16px;align-items:start">

        <!-- Left card -->
        <div class="card">
          <div class="card-body" style="text-align:center;padding:28px 20px">
            <div class="pic-wrap" style="display:inline-block;margin-bottom:12px">
              ${avHtml}
              <label for="pic-file" class="cam" title="Change photo">📷</label>
              <input type="file" id="pic-file" accept="image/*" style="display:none" onchange="App._uploadPic(event)"/>
            </div>
            <h3 style="font-size:1rem;font-weight:700">${esc(u.name)}</h3>
            <p style="color:var(--text2);font-size:.8rem;margin:3px 0">${esc(u.email)}</p>
            <div style="margin-top:8px">${roleBadge(u.role)}</div>
            <div style="margin-top:14px;text-align:left;font-size:.82rem;display:flex;flex-direction:column;gap:7px">
              ${u.roll_number ? `<div><strong>🎓 Roll:</strong> ${esc(u.roll_number)}</div>` : ''}
              ${u.department  ? `<div><strong>🏢 Dept:</strong> ${esc(u.department)}</div>` : ''}
              ${u.phone       ? `<div><strong>📱 Phone:</strong> ${esc(u.phone)}</div>` : ''}
              <div><strong>📅 Joined:</strong> ${fmtDate(u.created_at)}</div>
            </div>
            <div style="display:flex;gap:6px;margin-top:14px;justify-content:center">
              <label for="pic-file" class="btn btn-outline btn-sm" style="cursor:pointer">🖼 Change Photo</label>
              ${savedPic ? `<button class="btn btn-danger btn-sm" onclick="App._deletePic()">🗑 Remove</button>` : ''}
            </div>
          </div>
        </div>

        <!-- Right cards -->
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="card">
            <div class="card-hd"><span class="card-title">✏️ Edit Profile</span></div>
            <div class="card-body">
              <div class="form-row">
                <div class="form-group"><label class="form-label">Full Name</label>
                  <input type="text" id="p-name" class="form-control" value="${esc(u.name)}"/></div>
                <div class="form-group"><label class="form-label">Phone</label>
                  <input type="tel" id="p-phone" class="form-control" value="${esc(u.phone || '')}"/></div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="App._saveProfile()">Save Changes</button>
            </div>
          </div>

          <div class="card">
            <div class="card-hd"><span class="card-title">🔒 Change Password</span></div>
            <div class="card-body">
              <div class="form-row">
                <div class="form-group"><label class="form-label">Current Password</label>
                  <div class="pw-wrap">
                    <input type="password" id="p-cur" class="form-control" placeholder="Current password"/>
                    <button class="pw-eye" onclick="togglePw('p-cur',this)">👁</button>
                  </div>
                </div>
                <div class="form-group"><label class="form-label">New Password</label>
                  <div class="pw-wrap">
                    <input type="password" id="p-new" class="form-control" placeholder="Min. 6 characters"/>
                    <button class="pw-eye" onclick="togglePw('p-new',this)">👁</button>
                  </div>
                </div>
              </div>
              <button class="btn btn-warning btn-sm" onclick="App._changePw()">Update Password</button>
            </div>
          </div>

          <div class="card">
            <div class="card-hd"><span class="card-title">🎨 Appearance</span></div>
            <div class="card-body">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <div>
                  <div style="font-size:.875rem;font-weight:600">Dark Mode</div>
                  <div style="font-size:.78rem;color:var(--text2)">Toggle between light and dark theme</div>
                </div>
                <button class="btn btn-outline btn-sm" onclick="App.toggleTheme()" id="prof-theme-btn">
                  ${_dark ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    _applySavedPic();
  };

  const _saveProfile = async () => {
    const name  = document.getElementById('p-name').value.trim();
    const phone = document.getElementById('p-phone').value.trim();
    try {
      const { user } = await API.put(`/users/${Auth.getUser().id}`, { name, phone });
      Auth.setUser(user);
      _updateAvatars();
      Toast.success('Profile updated!');
    } catch (e) { Toast.error(e.message); }
  };

  const _changePw = async () => {
    const cur = document.getElementById('p-cur').value;
    const nw  = document.getElementById('p-new').value;
    if (!cur || !nw) return Toast.error('Both fields required.');
    if (nw.length < 6) return Toast.error('New password must be at least 6 characters.');
    try {
      await API.put('/auth/change-password', { currentPassword: cur, newPassword: nw });
      Toast.success('Password changed!');
      document.getElementById('p-cur').value = '';
      document.getElementById('p-new').value = '';
    } catch (e) { Toast.error(e.message); }
  };

  /* ── Profile pic (Cloudinary) ───────────────────────── */
  const _uploadPic = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return Toast.error('Image must be under 2MB.');
    Toast.info('Uploading photo...');
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const token = localStorage.getItem('lms_token');
      const res = await fetch('/api/upload/profile-pic', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const u = Auth.getUser();
      u.profile_pic = data.photo_url;
      Auth.setUser(u);
      _updateAvatarsWithPic(data.photo_url, u);
      Toast.success('Profile photo updated! ✅');
      _renderProfile();
    } catch (e) { Toast.error(e.message || 'Upload failed.'); }
  };

  const _deletePic = () => {
    Modal.show('🗑 Remove Photo',
      '<p>Remove your profile photo? Your initial avatar will be shown instead.</p>',
      `<button class="btn btn-outline" onclick="Modal.closeAll()">Cancel</button>
       <button class="btn btn-danger" onclick="App.__doDeletePic()">Remove</button>`);
  };

  const __doDeletePic = async () => {
    try {
      const token = localStorage.getItem('lms_token');
      await fetch('/api/upload/profile-pic', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const u = Auth.getUser();
      u.profile_pic = null;
      Auth.setUser(u);
      Modal.closeAll();
      _updateAvatarsWithPic(null, u);
      Toast.success('Photo removed.');
      _renderProfile();
    } catch (e) { Toast.error(e.message); }
  };

  const _applySavedPic = () => {
    const u = Auth.getUser(); if (!u) return;
    // Use profile_pic from DB (works across all devices)
    if (u.profile_pic) _updateAvatarsWithPic(u.profile_pic, u);
    else _updateAvatarsWithPic(null, u);
  };

  const _updateAvatars = () => {
    const u = Auth.getUser(); if (!u) return;
    _updateAvatarsWithPic(u.profile_pic || null, u);
    const sn = document.getElementById('sb-name');
    if (sn) sn.textContent = u.name;
  };

  const _updateAvatarsWithPic = (pic, u) => {
    const init = u.name[0].toUpperCase();
    ['sb-av', 'tb-av'].forEach(id => {
      const el = document.getElementById(id); if (!el) return;
      if (pic) {
        el.style.backgroundImage = `url(${pic})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.textContent = '';
      } else {
        el.style.backgroundImage = '';
        el.textContent = init;
      }
    });
  };

  /* ── Reservations page ───────────────────────────────── */
  const _renderReservations = async () => {
    const pc = document.getElementById('page-content');
    const role = Auth.getUser().role;
    pc.innerHTML = '<div class="loader"><div class="spin"></div></div>';
    try {
      const { reservations } = await API.get('/notifications/reservations');
      pc.innerHTML = `
        <div class="ph"><div><h2>📌 Reservations</h2><p>Books you've reserved</p></div></div>
        <div class="card">
          ${reservations.length ? `
            <div class="tbl-wrap"><table>
              <thead><tr><th>Book</th><th>Reserved At</th><th>Expires</th><th>Availability</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>${reservations.map(r => `
                <tr>
                  <td class="td-book"><div class="t">${esc(r.book_title)}</div><div class="s">${esc(r.isbn)}</div></td>
                  <td style="font-size:.8rem">${fmtDate(r.reserved_at)}</td>
                  <td style="font-size:.8rem">${fmtDate(r.expires_at)}</td>
                  <td>
                    <span class="badge ${r.available_copies > 0 ? 'b-success' : 'b-danger'}">
                      ${r.available_copies > 0 ? `✅ ${r.available_copies} available` : '❌ Not available'}
                    </span>
                  </td>
                  <td><span class="badge b-primary">${r.status}</span></td>
                  <td>
                    <button class="btn btn-danger btn-xs" onclick="App._cancelRes(${r.id})">Cancel</button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table></div>` :
            '<div class="empty" style="padding:48px"><span class="empty-icon">📌</span><h3>No reservations</h3><p>Reserve a book from the catalog when all copies are issued.</p></div>'}
        </div>`;
    } catch (e) {
      pc.innerHTML = `<div class="empty"><span class="empty-icon">❌</span><h3>${e.message}</h3></div>`;
    }
  };

  const _cancelRes = async id => {
    try {
      await API.put(`/notifications/reservations/${id}/cancel`, {});
      Toast.success('Reservation cancelled.');
      _renderReservations();
    } catch (e) { Toast.error(e.message); }
  };

  /* ── Theme toggle ────────────────────────────────────── */
  const toggleTheme = () => {
    _dark = !_dark;
    document.documentElement.setAttribute('data-theme', _dark ? 'dark' : 'light');
    localStorage.setItem('lms_theme', _dark ? 'dark' : 'light');
    // Update all theme buttons
    const icon = _dark ? '☀️' : '🌙';
    const txt  = _dark ? 'Light Mode' : 'Dark Mode';
    const ti = document.getElementById('theme-icon'); if (ti) ti.textContent = icon;
    const tt = document.getElementById('theme-txt');  if (tt) tt.textContent = txt;
    const pt = document.getElementById('prof-theme-btn'); if (pt) pt.textContent = `${icon} ${txt}`;
    // Also update topbar btn
    document.querySelectorAll('.t-btn').forEach(b => {
      if (b.textContent.includes('🌙') || b.textContent.includes('☀️')) b.textContent = icon;
    });
  };

  /* ── Sidebar toggle (mobile) ─────────────────────────── */
  const toggleSidebar = () => {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sb-overlay');
    sb.classList.toggle('open');
    ov.style.display = sb.classList.contains('open') ? 'block' : 'none';
  };
  const closeSidebar = () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sb-overlay').style.display = 'none';
  };

  /* ── Init ────────────────────────────────────────────── */
  const init = () => {
    const u = Auth.getUser(); if (!u) return;
    document.getElementById('app').style.display = 'flex';
    document.getElementById('auth-page').style.display = 'none';

    // Apply saved theme
    if (_dark) document.documentElement.setAttribute('data-theme', 'dark');

    // Set user info in sidebar
    document.getElementById('sb-name').textContent = u.name;
    document.getElementById('sb-role').textContent = u.role;
    document.getElementById('sb-av').textContent   = u.name[0].toUpperCase();
    document.getElementById('tb-av').textContent   = u.name[0].toUpperCase();

    _buildNav(u.role);
    _applySavedPic();
    Notifs.load();
    if (u.role !== 'student') Requests.loadBadge();
    go('dashboard');
  };

  /* ── Bootstrap on load ───────────────────────────────── */
  window.addEventListener('DOMContentLoaded', async () => {
    // Apply theme immediately
    if (_dark) document.documentElement.setAttribute('data-theme', 'dark');
    const ok = await Auth.checkAuth();
    if (ok) init();
    else {
      document.getElementById('auth-page').style.display = 'flex';
      document.getElementById('app').style.display = 'none';
    }
  });

  return {
    go, init, toggleTheme, toggleSidebar, closeSidebar,
    _uploadPic, _deletePic, __doDeletePic, _saveProfile, _changePw,
    _cancelRes,
  };
})();