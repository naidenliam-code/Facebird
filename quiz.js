// quiz.js — FaceBird (remplacement complet)
(function () {
  const root = document.getElementById('quiz');
  if (!root) {
    console.error('[Quiz] Élément #quiz introuvable. Vérifie quiz.html');
    return;
  }

  // Jeu de questions démo (remplace/augmente à volonté)
  const questions = [
    {
      q: "Quel oiseau a un chant très varié et imite d’autres espèces ?",
      choices: ["Rouge-gorge", "Étourneau sansonnet", "Mésange bleue", "Hirondelle"],
      correct: 1
    },
    {
      q: "Quel rapace est souvent actif la nuit ?",
      choices: ["Buse variable", "Épervier d’Europe", "Chouette hulotte", "Faucon crécerelle"],
      correct: 2
    },
    {
      q: "Le pic-vert se nourrit surtout…",
      choices: ["De poissons", "D’insectes du bois", "De graines de conifères", "De nectar"],
      correct: 1
    }
  ];

  // ——— UI de base
  root.innerHTML = `
    <div id="q-progress" style="height:10px;border-radius:8px;background:var(--surface-2,#f0f2f7);overflow:hidden;margin:.75rem 0 1rem;">
      <div id="q-progress-bar" style="height:100%;width:0%;background:#1976d2;transition:width .25s;"></div>
    </div>
    <div id="q-card">
      <h2 id="q-title" style="margin:0 0 .5rem 0"></h2>
      <div id="q-choices" class="stack" style="gap:.5rem"></div>
      <div id="q-footer" style="margin-top:1rem;opacity:.8"></div>
    </div>
  `;

  const $title   = root.querySelector('#q-title');
  const $choices = root.querySelector('#q-choices');
  const $footer  = root.querySelector('#q-footer');
  const $bar     = root.querySelector('#q-progress-bar');

  let index = 0;
  let score = 0;

  function render() {
    // Progrès
    $bar.style.width = ((index / questions.length) * 100).toFixed(1) + '%';

    if (index >= questions.length) {
      // Fin du quiz
      $title.textContent = `Terminé ! Score : ${score}/${questions.length}`;
      $choices.innerHTML = '';
      $footer.innerHTML = `
        <button class="btn" id="q-retry">Rejouer</button>
        <a class="btn" href="feed.html">Aller au fil</a>
      `;
      root.querySelector('#q-retry').addEventListener('click', () => {
        index = 0; score = 0; render();
      });

      // (Optionnel) Donner des points FaceBird
      try {
        const pts = Number(localStorage.getItem('fb_points') || '0');
        // +5 points par bonne réponse
        localStorage.setItem('fb_points', String(pts + score * 5));
      } catch (e) {}

      return;
    }

    const q = questions[index];
    $title.textContent = `Q${index + 1}. ${q.q}`;
    $choices.innerHTML = '';
    q.choices.forEach((label, i) => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = label;
      btn.style.textAlign = 'left';
      btn.addEventListener('click', () => submit(i));
      $choices.appendChild(btn);
    });

    $footer.textContent = `Question ${index + 1} / ${questions.length}`;
  }

  function submit(choice) {
    const q = questions[index];
    const isCorrect = choice === q.correct;
    if (isCorrect) score++;

    // Petit feedback visuel
    [...$choices.children].forEach((btn, i) => {
      btn.disabled = true;
      btn.style.opacity = '0.9';
      btn.style.border = '1px solid transparent';
      if (i === q.correct)   btn.style.borderColor = 'var(--ok,#19a974)';
      if (i === choice && !isCorrect) btn.style.borderColor = 'var(--ko,#e53935)';
    });

    setTimeout(() => { index++; render(); }, 600);
  }

  render();
})();
