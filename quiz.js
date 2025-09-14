// FaceBird - Quiz 15 questions + difficulté + meilleur score + badges
(function(){
  const QKEY = 'fb-quiz-best';
  const $ = (sel) => document.querySelector(sel);

  // 15 questions avec difficulté
  const QUESTIONS = [
    // --- Facile (5) ---
    { q: "Quel oiseau a une poitrine orange et est commun dans les jardins européens ?", choices: ["Moineau domestique", "Rouge-gorge", "Goéland"], answer: 1, difficulty:"Facile" },
    { q: "Quel oiseau de ville est souvent confondu avec la tourterelle ?", choices: ["Pigeon ramier", "Corneille noire", "Faucon pèlerin"], answer: 0, difficulty:"Facile" },
    { q: "Le merle noir est…", choices: ["Toujours brun", "Mâle noir, femelle brune", "Toujours blanc"], answer: 1, difficulty:"Facile" },
    { q: "Quel oiseau nocturne a de grands yeux et chasse la nuit ?", choices: ["Hibou", "Hirondelle", "Pie"], answer: 0, difficulty:"Facile" },
    { q: "Quel oiseau accroche ses nids sous les toits au printemps ?", choices: ["Hirondelle", "Pingouin", "Mésange"], answer: 0, difficulty:"Facile" },

    // --- Moyen (5) ---
    { q: "Quel oiseau marin plonge et peut rester longtemps sous l’eau ?", choices: ["Cormoran", "Moineau", "Pie"], answer: 0, difficulty:"Moyen" },
    { q: "Quel oiseau chante au lever du soleil et est symbole du matin ?", choices: ["Rossignol", "Coq", "Mésange charbonnière"], answer: 1, difficulty:"Moyen" },
    { q: "Quel rapace est capable de fondre en piqué à plus de 300 km/h ?", choices: ["Buse variable", "Faucon pèlerin", "Aigle royal"], answer: 1, difficulty:"Moyen" },
    { q: "Quel petit oiseau jaune et vert est très présent en hiver aux mangeoires ?", choices: ["Chardonneret élégant", "Verdier", "Troglodyte mignon"], answer: 1, difficulty:"Moyen" },
    { q: "Quel oiseau a un bec rouge et noir, et niche souvent dans les clochers ?", choices: ["Cigogne blanche", "Huppe fasciée", "Tourterelle turque"], answer: 0, difficulty:"Moyen" },

    // --- Difficile (5) ---
    { q: "Quel oiseau imite les sons de son environnement, y compris d’autres oiseaux ?", choices: ["Geai des chênes", "Mésange bleue", "Pigeon ramier"], answer: 0, difficulty:"Difficile" },
    { q: "Quel oiseau migrateur vole chaque année de l’Arctique à l’Antarctique ?", choices: ["Sterne arctique", "Albatros hurleur", "Hirondelle rustique"], answer: 0, difficulty:"Difficile" },
    { q: "Quel oiseau rare a une huppe orange et noire et un cri ‘oup-oup-oup’ ?", choices: ["Huppe fasciée", "Pic épeiche", "Ibis sacré"], answer: 0, difficulty:"Difficile" },
    { q: "Quel oiseau plane en V lors des migrations et émet des cris sonores ?", choices: ["Grue cendrée", "Canard colvert", "Goéland argenté"], answer: 0, difficulty:"Difficile" },
    { q: "Quel oiseau de proie est l’emblème des États-Unis ?", choices: ["Aigle royal", "Pygargue à tête blanche", "Buse à queue rousse"], answer: 1, difficulty:"Difficile" }
  ];

  // UI
  const box = $('#quiz-box');
  const bestEl = $('#best-score');
  const startBtn = $('#start-btn');

  function loadBest(){
    const v = Number(localStorage.getItem(QKEY) || '0');
    return Number.isFinite(v) ? v : 0;
  }
  function saveBest(pct){
    const best = loadBest();
    if (pct > best) localStorage.setItem(QKEY, String(pct));
  }
  function renderBest(){
    const best = loadBest();
    bestEl.textContent = best ? `Meilleur score : ${best}%` : 'Meilleur score : —';
  }

  function renderQuestion(i, picks){
    const q = QUESTIONS[i];
    box.innerHTML = `
      <p><b>Question ${i+1}/${QUESTIONS.length}</b> <span class="badge">${q.difficulty}</span></p>
      <p>${q.q}</p>
      <div id="choices"></div>
      <div style="display:flex;gap:10px;margin-top:10px">
        <button class="btn" id="prev" ${i===0?'disabled':''}>⬅ Précédent</button>
        <button class="btn" id="next">${i===QUESTIONS.length-1?'Terminer ➡':'Suivant ➡'}</button>
      </div>
    `;
    const choices = $('#choices');
    q.choices.forEach((c,idx)=>{
      const checked = picks[i]===idx ? 'checked' : '';
      choices.insertAdjacentHTML('beforeend', `
        <label style="display:block;margin:6px 0">
          <input type="radio" name="q${i}" value="${idx}" ${checked}> ${c}
        </label>
      `);
    });

    $('#prev').addEventListener('click', ()=>{
      const sel = box.querySelector(`input[name="q${i}"]:checked`);
      if (sel) picks[i] = Number(sel.value);
      renderQuestion(i-1, picks);
    });

    $('#next').addEventListener('click', ()=>{
      const sel = box.querySelector(`input[name="q${i}"]:checked`);
      if (sel) picks[i] = Number(sel.value);
      if (i===QUESTIONS.length-1){
        finish(picks);
      } else {
        renderQuestion(i+1, picks);
      }
    });
  }

  function finish(picks){
    let correct = 0;
    QUESTIONS.forEach((q, i)=>{
      if (picks[i] === q.answer) correct++;
    });
    const pct = Math.round((correct / QUESTIONS.length) * 100);
    saveBest(pct);
    renderBest();

    // Résultat
    box.innerHTML = `
      <h3>Résultat : ${correct}/${QUESTIONS.length} (${pct}%)</h3>
      <p class="muted">Tu peux recommencer pour améliorer ton meilleur score.</p>
      <button class="btn" id="restart">↻ Rejouer</button>
    `;
    $('#restart').addEventListener('click', start);

    // Badges quiz
    if (window.FB_BADGES){
      FB_BADGES.award('quiz_first');
      if (pct >= 80) FB_BADGES.award('quiz_80');
      if (pct === 100) FB_BADGES.award('quiz_perfect');
    }
  }

  function start(){
    const picks = [];
    renderQuestion(0, picks);
  }

  // Init
  document.addEventListener('DOMContentLoaded', ()=>{
    renderBest();
    startBtn?.addEventListener('click', start);
  });
})();
