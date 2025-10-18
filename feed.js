// feed.js — gère les posts locaux dans le fil d’actualité

const textarea = document.getElementById('post-content');
const publishBtn = document.getElementById('publish');
const postsDiv = document.getElementById('posts');

let posts = JSON.parse(localStorage.getItem('facebird_posts') || '[]');

function renderPosts() {
  if (posts.length === 0) {
    postsDiv.innerHTML = "<p>Aucun post pour le moment. Écris un message ci-dessus ou ajoute une observation !</p>";
    return;
  }

  postsDiv.innerHTML = posts.map(p => `
    <div class="post">
      <p>${p.text}</p>
      <small>📅 ${p.date}</small>
    </div>
  `).join('');
}

publishBtn.addEventListener('click', () => {
  const text = textarea.value.trim();
  if (!text) return;
  const newPost = { text, date: new Date().toLocaleString() };
  posts.unshift(newPost);
  localStorage.setItem('facebird_posts', JSON.stringify(posts));
  textarea.value = '';
  renderPosts();
});

renderPosts();
