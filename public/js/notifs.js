/* notifs.js */
const Notifs = (() => {
  let _open = false;

  const load = async () => {
    try {
      const {notifications,unread} = await API.get('/notifications');
      const dot = document.getElementById('notif-dot');
      if(dot) dot.style.display = unread>0?'block':'none';
      const list = document.getElementById('notif-list');
      if(!list) return;
      if(!notifications.length){
        list.innerHTML='<div class="empty" style="padding:24px"><span class="empty-icon">🔔</span><p>No notifications</p></div>';
        return;
      }
      list.innerHTML = notifications.map(n=>`
        <div class="notif-item ${n.is_read?'':'unread'}" onclick="Notifs.markOne(${n.id},this)">
          <div class="n-title">${esc(n.title)}</div>
          <div class="n-msg">${esc(n.message)}</div>
          <div class="n-time">${timeAgo(n.created_at)}</div>
        </div>`).join('');
    } catch{}
  };

  const toggle = () => {
    _open = !_open;
    const panel = document.getElementById('notif-panel');
    if(panel) panel.classList.toggle('open', _open);
    if(_open) load();
  };

  const markAll = async () => {
    try {
      await API.put('/notifications/read-all',{});
      const dot=document.getElementById('notif-dot');
      if(dot) dot.style.display='none';
      document.querySelectorAll('.notif-item').forEach(el=>el.classList.remove('unread'));
    } catch{}
  };

  const markOne = async (id, el) => {
    try {
      await API.put(`/notifications/${id}/read`,{});
      el.classList.remove('unread');
    } catch{}
  };

  // Close on outside click
  document.addEventListener('click', e => {
    if(_open && !document.getElementById('notif-wrap')?.contains(e.target)){
      _open=false;
      const p=document.getElementById('notif-panel');
      if(p) p.classList.remove('open');
    }
  });

  return { load, toggle, markAll, markOne };
})();
