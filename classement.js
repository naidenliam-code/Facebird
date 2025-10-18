// Classement FaceBird 🐦
// Les données viennent du localStorage : fb_users ou fb_posts

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('fb_users')) || [];
  } catch {
    return [];
  }
}

function buildFromPosts() {
  try {
    const posts = JSON.parse(localStorage.getItem('fb_posts')) || [];
    const map = new Map();
    for (const p of posts) {
      const name = p.userName || p.author || 'Anonyme';
      const u = map.get(name) || { name, points: 0, observations: 0 };
      u.points += p.points || 10; // 10 pts par post
      u.observations++;
      map.set(name, u);
    }
    return [...map.values()];
  } catch {
    return [];
  }
}

function medal(i) {
  return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1;
}

function render(users) {
  const body = document.getElementById('classementBody');
  const top3 = document.getElementById('top3');
  body.innerHTML = '';
  top3.innerHTML = '';

  // tri
  users.sort((a, b) => b.points - a.points);

  users.forEach((u, i) => {
    body.innerHTML += `
      <tr>
        <td>${medal(i)}</td>
        <td>${u.name}</td>
        <td class="right">${u.points}</td>
        <td class="right">${u.observations}</td>
      </tr>
    `;
  });

  users.slice(0, 3).forEach((u, i) => {
    top3.innerHTML += `
      <article class="card">
        <h3>${medal(i)} ${u.name}</h3>
        <p><b>${u.points}</b> points<br>${u.observations} observations</p>
      </article>
    `;
  });
}

function initClassement() {
  let users = getUsers();
  if (!users.length) users = buildFromPosts();

  // données fictives si rien
  if (!users.length) {
    users = [
      { name: 'Huppe Fasciée', points: 320, observations: 18 },
      { name: 'Mésange Bleue', points: 540, observations: 26 },
      { name: 'Rougegorge', points: 120, observations: 7 },
    ];
  }

  render(users);
}

document.addEventListener('DOMContentLoaded', initClassement);
