/* auth.js */
const Auth = (() => {
  let _user = null;
  const getUser  = () => _user;
  const setUser  = u => { _user = u; };

  const showTab = tab => {
    ['login','register'].forEach(t=>{
      document.getElementById(`tab-${t}`).classList.toggle('active',t===tab);
      document.getElementById(`form-${t}`).style.display = t===tab?'':'none';
    });
  };

  const fillDemo = (email, pass) => {
    document.getElementById('l-email').value = email;
    document.getElementById('l-pass').value  = pass;
    showTab('login');
  };

  const login = async () => {
    const email = document.getElementById('l-email').value.trim();
    const pass  = document.getElementById('l-pass').value;
    if(!email||!pass) return Toast.error('Please fill email and password.');
    try {
      const data = await API.post('/auth/login',{email,password:pass});
      localStorage.setItem('lms_token', data.token);
      _user = data.user;
      document.getElementById('auth-page').style.display='none';
      App.init();
    } catch(e){ Toast.error(e.message); }
  };

  const register = async () => {
    const name  = document.getElementById('r-name').value.trim();
    const email = document.getElementById('r-email').value.trim();
    const pass  = document.getElementById('r-pass').value;
    const roll  = document.getElementById('r-roll').value.trim();
    const dept  = document.getElementById('r-dept').value;
    const phone = document.getElementById('r-phone').value.trim();
    if(!name||!email||!pass) return Toast.error('Name, email and password are required.');
    if(pass.length<6) return Toast.error('Password must be at least 6 characters.');
    try {
      const data = await API.post('/auth/register',{name,email,password:pass,roll_number:roll,department:dept,phone});
      localStorage.setItem('lms_token', data.token);
      _user = data.user;
      document.getElementById('auth-page').style.display='none';
      App.init();
      Toast.success('Welcome to SKCET Library! 🎉');
    } catch(e){ Toast.error(e.message); }
  };

  const logout = () => {
    localStorage.removeItem('lms_token');
    _user = null;
    document.getElementById('app').style.display='none';
    document.getElementById('auth-page').style.display='flex';
    showTab('login');
    document.getElementById('l-email').value='';
    document.getElementById('l-pass').value='';
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('lms_token');
    if(!token) return false;
    try {
      const data = await API.get('/auth/me');
      _user = data.user;
      return true;
    } catch { localStorage.removeItem('lms_token'); return false; }
  };

  return { getUser, setUser, showTab, fillDemo, login, register, logout, checkAuth };
})();

document.addEventListener('keydown', e => {
  if(e.key!=='Enter') return;
  const lf=document.getElementById('form-login');
  const rf=document.getElementById('form-register');
  if(lf&&lf.style.display!=='none') Auth.login();
  else if(rf&&rf.style.display!=='none') Auth.register();
});
