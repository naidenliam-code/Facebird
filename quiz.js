// FaceBird - Quiz simple avec meilleur score + badges
(function(){
  const QKEY = 'fb-quiz-best';
  const $ = (sel) => document.querySelector(sel);

  // Petit set de questions (multi-choix)
  const QUESTIONS = [
    {
      q: "Quel oiseau a une poitrine orange et est très commun dans les jardins européens ?",
      choices: ["Moineau domestique", "Rouge-gorge", "Goéland"],
      answer: 1
    },
    {
      q: "Quel oiseau de ville est souvent confondu avec la tourterelle ?",
      choices: ["Pigeon ramier", "Corneille noire", "Faucon pèlerin"],
      answer: 0
    },
    {
      q: "Le merle noir est…",
      choices: ["Toujours brun", "Le mâle est noir, la femelle est brune", "Toujours blanc"],
      answer: 1
    },
    {
      q: "Quel oiseau nocturne a de grands yeux et chasse la nuit ?",
      choices: ["Hibou", "Hirondelle", "Pie"],
      answer: 0
    },
    {
      q: "Quel oiseau accroche souvent ses nids sous les toits au printemps ?",
      choices: ["Hirondelle", "Pingouin", "Mésange"],
      answer: 0
    }
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
      <p><b>Question ${i+1}/${QUESTIONS.length}</b></p>
      <p>${q.q}</p>
      <div id="choices"></div>
      <div style="display:flex;gap:10px;margin-top:10px">
        <button class="btn" id="prev" ${i===0?'disabled':''}>⬅ Précédent</button>
        <button class="btn" id="next">${i===QUESTIONS.length-1?'Terminer ➡':'Suivant ➡'}</button>
      </div>
    `;
    const choices = $('#choices');
    q.choices.forEach((c,idx)=>{
      const id = `q${i}_c${idx}`;
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

    // Badges (si disponible)
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
