// FaceBird - gestion des badges (localStorage)
(() => {
  const BKEY = 'fb-badges-v1';
  const SKEY = 'fb-stats-v1'; // compteur d'observations

  const CATALOG = {
    first_obs: { icon:'🎉', label:'Première observation' },
    five_obs:  { icon:'🥇', label:'Explorateur (5 obs)' },
    owl_spot:  { icon:'🦉', label:'Guetteur de nuit (Hibou)' },
    mesange:   { icon:'🐦', label:'Petit chanteur (Mésange)' },
    pigeon:    { icon:'🕊️', label:'Citadin (Pigeon)' }
  };

  const loadBadges = () => { try { return JSON.parse(localStorage.getItem(BKEY)||'[]'); } catch { return []; } };
  const saveBadges = (list) => localStorage.setItem(BKEY, JSON.stringify(list));
  const hasBadge = (id) => loadBadges().includes(id);

  function toast(msg){
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  function award(id){
    if (!CATALOG[id] || hasBadge(id)) return false;
    const list = loadBadges(); list.push(id); saveBadges(list);
    toast(`${CATALOG[id].icon} Badge débloqué : ${CATALOG[id].label}`);
    return true;
  }

  // Stats simples
  const loadStats = () => { try { return JSON.parse(localStorage.getItem(SKEY)||'{"count":0}'); } catch { return {count:0}; } };
  const saveStats = (s) => localStorage.setItem(SKEY, JSON.stringify(s));

  window.FB_BADGES = {
    catalog: CATALOG,
    has: hasBadge,
    award,
    incCount(){
      const s = loadStats(); s.count = (s.count||0)+1; saveStats(s);
      if (s.count >= 1) award('first_obs');
      if (s.count >= 5) award('five_obs');
    },
    all(){ return loadBadges(); }
  };
})();
