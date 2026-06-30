/* reports.js */
const Reports = (() => {

  const render = async () => {
    const pc = document.getElementById('page-content');
    pc.innerHTML = '<div class="loader"><div class="spin"></div></div>';
    try {
      const [{ stats, monthly, popular }, { departments }] = await Promise.all([
        API.get('/issues/stats'),
        API.get('/books/departments'),
      ]);
      const { issues: is, books: bk, users: us } = stats;

      // bar chart for monthly
      const maxV = Math.max(...(monthly.map(m => +m.issues) || [1]), 1);
      const barChart = monthly.length ? `
        <div class="bar-chart">
          ${monthly.map(m => `
            <div class="bar" style="height:${Math.round((+m.issues / maxV) * 140)}px;background:var(--primary-l)"
                 title="${m.month}: ${m.issues} issued, ${m.returns} returned"></div>`).join('')}
        </div>
        <div class="bar-labels">
          ${monthly.map(m => `<span>${m.month.split(' ')[0]}</span>`).join('')}
        </div>` : '<p style="text-align:center;color:var(--text2);padding:30px">No data yet</p>';

      // dept availability bars
      const deptBars = departments.map(d => {
        const pct = d.total > 0 ? Math.round((d.available / d.total) * 100) : 0;
        const col = deptColor(d.department);
        return `
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:4px">
              <span style="font-weight:600">${deptIcon(d.department)} ${esc(deptShort(d.department))}</span>
              <span style="color:var(--text2)">${d.available}/${d.total} (${pct}%)</span>
            </div>
            <div style="height:8px;background:var(--border);border-radius:99px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${col};border-radius:99px;transition:width .5s"></div>
            </div>
          </div>`;
      }).join('');

      // popular books table
      const popTable = popular && popular.length ? `
        <table>
          <thead><tr><th>#</th><th>Book</th><th>Department</th><th>Issues</th></tr></thead>
          <tbody>
            ${popular.map((b, i) => `
              <tr>
                <td style="font-size:.75rem;color:var(--text3)">${i + 1}</td>
                <td class="td-book"><div class="t">${esc(b.title)}</div>
                    <div class="s">${esc(b.author)}</div></td>
                <td><span style="font-size:.72rem">${deptIcon(b.department)} ${esc(deptShort(b.department))}</span></td>
                <td><span class="badge b-primary">${b.issue_count} issues</span></td>
              </tr>`).join('')}
          </tbody>
        </table>` : '<div class="empty"><span class="empty-icon">📊</span><p>No data yet</p></div>';

      pc.innerHTML = `
        <div class="ph">
          <div><h2>📊 Reports & Analytics</h2><p>Library performance overview</p></div>
          <button class="btn btn-outline btn-sm" onclick="Reports.exportCSV()">⬇ Export CSV</button>
        </div>

        <!-- Summary Stats -->
        <div class="stats-grid" style="margin-bottom:20px">
          <div class="stat-card">
            <div class="stat-ic ic-blue">📚</div>
            <div><div class="stat-val">${bk.total_titles ?? 0}</div><div class="stat-lbl">Total Titles</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic ic-cyan">🗂</div>
            <div><div class="stat-val">${bk.total_copies ?? 0}</div><div class="stat-lbl">Total Copies</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic ic-amber">📤</div>
            <div><div class="stat-val">${is.total_issues ?? 0}</div><div class="stat-lbl">Total Issues</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic ic-green">✅</div>
            <div><div class="stat-val">${is.returned ?? 0}</div><div class="stat-lbl">Returned</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic ic-red">⏰</div>
            <div><div class="stat-val">${is.overdue ?? 0}</div><div class="stat-lbl">Overdue</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic ic-orange">💰</div>
            <div><div class="stat-val">₹${parseFloat(is.total_fines ?? 0).toFixed(0)}</div><div class="stat-lbl">Total Fines</div></div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
          <!-- Monthly trend -->
          <div class="card">
            <div class="card-hd"><span class="card-title">📈 Monthly Issue Trend</span></div>
            <div class="card-body">${barChart}</div>
          </div>

          <!-- Dept availability -->
          <div class="card">
            <div class="card-hd"><span class="card-title">🏢 Department Availability</span></div>
            <div class="card-body">${deptBars || '<p style="color:var(--text2)">No data</p>'}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <!-- Popular Books -->
          <div class="card">
            <div class="card-hd"><span class="card-title">🔥 Most Popular Books</span></div>
            <div class="tbl-wrap">${popTable}</div>
          </div>

          <!-- Fine Summary -->
          <div class="card">
            <div class="card-hd"><span class="card-title">💰 Fine Summary</span></div>
            <div class="card-body">
              ${[
                ['Total Fines Generated', `₹${parseFloat(is.total_fines ?? 0).toFixed(2)}`, '#ef4444'],
                ['Collected', `₹${parseFloat(is.collected_fines ?? 0).toFixed(2)}`, '#16a34a'],
                ['Pending', `₹${parseFloat(is.pending_fines ?? 0).toFixed(2)}`, '#d97706'],
                ['Collection Rate', is.total_fines > 0
                  ? `${Math.round((is.collected_fines / is.total_fines) * 100)}%`
                  : '0%', '#3b82f6'],
              ].map(([l, v, c]) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
                  <span style="font-size:.845rem;color:var(--text2)">${l}</span>
                  <span style="font-weight:800;font-size:1rem;color:${c}">${v}</span>
                </div>`).join('')}
              <div style="margin-top:14px">
                <div style="font-size:.78rem;color:var(--text2);margin-bottom:6px">Collection Progress</div>
                <div style="height:10px;background:var(--border);border-radius:99px;overflow:hidden">
                  <div style="height:100%;width:${is.total_fines > 0 ? Math.round((is.collected_fines / is.total_fines) * 100) : 0}%;
                       background:var(--success);border-radius:99px;transition:width .6s"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- User Stats -->
        <div class="card" style="margin-top:16px">
          <div class="card-hd"><span class="card-title">👥 User Statistics</span></div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px">
              ${[
                ['Total Users', us.total ?? 0, '👥', '#3b82f6'],
                ['Students', us.students ?? 0, '🎓', '#16a34a'],
                ['Librarians', us.librarians ?? 0, '📋', '#8b5cf6'],
                ['Admins', us.admins ?? 0, '👑', '#ef4444'],
                ['Active', us.active ?? 0, '✅', '#0891b2'],
              ].map(([l, v, ic, c]) => `
                <div style="text-align:center;padding:16px;background:var(--bg);border-radius:10px">
                  <div style="font-size:28px;margin-bottom:6px">${ic}</div>
                  <div style="font-size:1.6rem;font-weight:800;color:${c}">${v}</div>
                  <div style="font-size:.72rem;color:var(--text2);margin-top:2px">${l}</div>
                </div>`).join('')}
            </div>
          </div>
        </div>`;
    } catch (e) {
      pc.innerHTML = `<div class="empty"><span class="empty-icon">❌</span><h3>${e.message}</h3></div>`;
    }
  };

  const exportCSV = async () => {
    try {
      const { issues } = await API.get('/issues?limit=1000');
      const rows = [
        ['#', 'Student', 'Roll No', 'Book', 'ISBN', 'Issue Date', 'Due Date', 'Return Date', 'Fine', 'Fine Paid', 'Status'],
        ...issues.map(i => [
          i.id, i.student_name, i.roll_number || '', i.book_title, i.isbn,
          i.issue_date, i.due_date, i.return_date || '', i.fine_amount, i.fine_paid ? 'Yes' : 'No', i.status
        ])
      ];
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `skcet_library_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
      Toast.success('Report exported!');
    } catch (e) { Toast.error(e.message); }
  };

  return { render, exportCSV };
})();
