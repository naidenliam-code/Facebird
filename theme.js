(function(){
  const BTN_ID = 'theme-toggle';
  const KEY = 'fb-theme';
  const root = document.documentElement;

  function apply(t){ root.dataset.theme = t; const b=document.getElementById(BTN_ID); if(b){ b.textContent = t==='dark' ? '☀️ Mode clair' : '🌙 Mode sombre'; } }
  function load(){ return localStorage.getItem(KEY) || 'light'; }
  function save(t){ localStorage.setItem(KEY, t); }

  document.addEventListener('DOMContentLoaded', ()=>{
    apply(load());
    const btn = document.getElementById(BTN_ID);
    btn?.addEventListener('click', ()=>{
      const next = (load()==='dark') ? 'light' : 'dark';
      save(next); apply(next);
    });
  });
})();
