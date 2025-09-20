// FaceBird — Points & Niveaux (localStorage) + Avatar évolutif
(() => {
  const PKEY = 'fb-points-v1';
  const HKEY = 'fb-points-history-v1';

  const RULES = {
    observation: 10,   // ajouter une observation
    like: 1,           // liker un post (1 fois / post)
    comment: 2,        // publier un commentaire
    share: 1,          // partager un post
    quiz_play: 5,      // lancer un quiz
    quiz_80: 10,       // score >= 80%
    quiz_100: 25,      // score 100%
    gps_used: 2        // géolocalisation utilisée
  };

  const LEVELS = [
    { name: 'Débutant',      min: 0   },
    { name: 'Intermédiaire', min: 50  },
    { name: 'Avancé',        min: 150 },
    { name: 'Expert',        min: 350 },
    { name: 'Maître',        min: 700 },
  ];

  const load = () => Number(localStorage.getItem(PKEY) || '0') || 0;
  const save = (v) => localStorage.setItem(PKEY, String(v));
  const log  = (action, delta) => {
    try {
      const h = JSON.parse(localStorage.getItem(HKEY) || '[]');
      h.push({ action, delta, at: Date.now() });
      localStorage.setItem(HKEY, JSON.stringify(h.slice(-200)));
    } catch {}
  };

  function getLevel(points){
    let current = LEVELS[0], next = null;
    for (let i=0;i<LEVELS.length;i++){
      if (points >= LEVELS[i].min){ current = LEVELS[i]; next = LEVELS[i+1] || null; }
    }
    const base = current.min;
    const cap  = next ? next.min : base + 200; // barre fixe pour le dernier niveau
    const progress = Math.max(0, Math.min(100, Math.round(((points - base)/(cap - base))*100)));
    return { current: current.name, next: next?.name || null, base, cap, progress };
  }

  function toast(msg){
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(), 2000);
  }

  function onceKey(action, id){ return `fb-once-${action}-${id}`; }
  function canEarnOnce(action, id){
    if (!id) return true;
    const k = onceKey(action, id);
    if (localStorage.getItem(k)==='1') return false;
    localStorage.setItem(k,'1');
    return true;
  }

  function add(action, opts = {}){
    const delta = RULES[action] || 0;
    if (delta === 0) return { added:0, total: load(), lvl: getLevel(load()) };

    if (opts.onceId && !canEarnOnce(action, opts.onceId)){
      return { added:0, total: load(), lvl: getLevel(load()) };
    }

    const before = load();
    const after  = before + delta;
    save(after); log(action, delta);

    const labels = {
      observation: "Nouvelle observation",
      like: "Like",
      comment: "Commentaire",
      share: "Partage",
      quiz_play: "Quiz lancé",
      quiz_80: "Super score (≥80%)",
      quiz_100: "Score parfait (100%)",
      gps_used: "GPS activé"
    };
    toast(`+${delta} pts — ${labels[action] || action}`);

    return { added: delta, total: after, lvl: getLevel(after) };
  }

  // 🔥 Avatar selon le niveau
  function getAvatar(points){
    const lvl = getLevel(points);
    switch (lvl.current){
      case 'Débutant':      return '🐦'; // petit oiseau
      case 'Intermédiaire': return '🐤'; // poussin
      case 'Avancé':        return '🕊️'; // colombe
      case 'Expert':        return '🦉'; // hibou
      case 'Maître':        return '🦅'; // aigle
      default:              return '🐦';
        // URL d'avatar selon le niveau (images locales)
function getAvatarUrl(points){
  const lvl = getLevel(points).current;
  if (lvl === 'Débutant')      return 'avatar-debutant-256.png';
  if (lvl === 'Intermédiaire') return 'avatar-intermediaire-256.png';
  if (lvl === 'Avancé')        return 'avatar-avance-256.png';
  if (lvl === 'Expert')        return 'avatar-expert-256.png';
  if (lvl === 'Maître')        return 'avatar-maitre-256.png';
  return 'avatar-debutant-256.png';
}

// expose aussi getAvatarUrl
window.FB_POINTS = { add, load, getLevel, LEVELS, getAvatar, getAvatarUrl };

    }
  }

  window.FB_POINTS = { add, load, getLevel, LEVELS, getAvatar };
})();
