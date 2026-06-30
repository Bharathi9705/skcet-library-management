/* api.js */
const API = (() => {
  const BASE = '/api';
  const getToken = () => localStorage.getItem('lms_token');

  const req = async (method, path, body=null) => {
    const headers = {'Content-Type':'application/json'};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = {method, headers};
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  };

  return {
    get:    p      => req('GET', p),
    post:   (p,b)  => req('POST', p, b),
    put:    (p,b)  => req('PUT', p, b),
    delete: p      => req('DELETE', p),
  };
})();

/* ── Toast ───────────────────────────────────────────── */
const Toast = {
  show(msg, type='info', dur=3600) {
    const icons = {success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
    document.getElementById('toasts').appendChild(el);
    setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(20px)';
      el.style.transition='.3s'; setTimeout(()=>el.remove(),300); }, dur);
  },
  success: m => Toast.show(m,'success'),
  error:   m => Toast.show(m,'error'),
  warning: m => Toast.show(m,'warning'),
  info:    m => Toast.show(m,'info'),
};

/* ── Modal ───────────────────────────────────────────── */
const Modal = {
  show(title, body, footer='') {
    const id = 'M'+Date.now()+Math.floor(Math.random()*1000);
    if (typeof footer === 'function') footer = footer(id);
    document.getElementById('modals').insertAdjacentHTML('beforeend',`
      <div class="modal-bg" id="${id}" onclick="if(event.target.id==='${id}')Modal.close('${id}')">
        <div class="modal">
          <div class="modal-hd">
            <span class="modal-title">${title}</span>
            <button class="modal-x" onclick="Modal.close('${id}')">✕</button>
          </div>
          <div class="modal-body">${body}</div>
          ${footer?`<div class="modal-ft">${footer}</div>`:''}
        </div>
      </div>`);
    requestAnimationFrame(()=>document.getElementById(id).classList.add('show'));
    return id;
  },
  close(id) {
    const el = document.getElementById(id);
    if(!el) return;
    el.classList.remove('show');
    setTimeout(()=>el.remove(),220);
  },
  closeAll() { document.querySelectorAll('.modal-bg').forEach(e=>e.remove()); }
};

/* ── Helpers ─────────────────────────────────────────── */
function esc(s){ if(s==null)return''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtDate(d){ if(!d)return'—'; return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function fmtDateTime(d){ if(!d)return'—'; return new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); }
function timeAgo(d){
  const diff=(Date.now()-new Date(d))/1000;
  if(diff<60)return'just now';
  if(diff<3600)return Math.floor(diff/60)+'m ago';
  if(diff<86400)return Math.floor(diff/3600)+'h ago';
  return Math.floor(diff/86400)+'d ago';
}

function roleBadge(r){
  const m={admin:'b-danger',librarian:'b-info',student:'b-success'};
  return`<span class="badge ${m[r]||'b-muted'}">${r}</span>`;
}
function statusBadge(s){
  const m={issued:'b-primary',returned:'b-success',overdue:'b-danger',lost:'b-warning'};
  const icons={issued:'📤',returned:'✅',overdue:'⏰',lost:'❌'};
  return`<span class="badge ${m[s]||'b-muted'}">${icons[s]||''} ${s}</span>`;
}

function pager(total, page, limit, fn) {
  const pages = Math.ceil(total/limit);
  if(pages<=1) return '';
  let h = '<div class="pager">';
  h+=`<button class="pg" ${page===1?'disabled':''} onclick="${fn}(${page-1})">‹</button>`;
  for(let i=1;i<=pages;i++){
    if(i===1||i===pages||Math.abs(i-page)<=1){
      h+=`<button class="pg ${i===page?'active':''}" onclick="${fn}(${i})">${i}</button>`;
    } else if(Math.abs(i-page)===2){
      h+=`<span style="color:var(--text3);padding:0 3px">…</span>`;
    }
  }
  h+=`<button class="pg" ${page===pages?'disabled':''} onclick="${fn}(${page+1})">›</button>`;
  h+='</div>';
  return h;
}

function togglePw(id, btn){
  const inp=document.getElementById(id);
  inp.type = inp.type==='password'?'text':'password';
  btn.textContent = inp.type==='password'?'👁':'🙈';
}

const DEPT_CFG = {
  'Computer Science and Engineering':    {icon:'💻',color:'#3b82f6',short:'CSE'},
  'Computer Science and Design':         {icon:'🎨',color:'#8b5cf6',short:'CSD'},
  'Electronics and Communication Engineering':{icon:'📡',color:'#06b6d4',short:'ECE'},
  'Electrical and Electronics Engineering':   {icon:'⚡',color:'#f59e0b',short:'EEE'},
  'Civil Engineering':                   {icon:'🏗️',color:'#84cc16',short:'CIVIL'},
  'Mechanical Engineering':              {icon:'⚙️',color:'#f97316',short:'MECH'},
  'Mechatronics':                        {icon:'🤖',color:'#ec4899',short:'MCT'},
  'Information Technology':              {icon:'🌐',color:'#14b8a6',short:'IT'},
  'Cyber Security':                      {icon:'🔒',color:'#ef4444',short:'CYB'},
  'General':                             {icon:'📖',color:'#6b7280',short:'GEN'},
};
function deptIcon(d){ return (DEPT_CFG[d]||{icon:'📚'}).icon; }
function deptColor(d){ return (DEPT_CFG[d]||{color:'#6b7280'}).color; }
function deptShort(d){ return (DEPT_CFG[d]||{short:'?'}).short; }
