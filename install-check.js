// Affiche un panneau d'état PWA + bouton "Installer l'app"
(function(){
  let deferredPrompt = null;

  // Crée un petit panneau en bas à droite
  function mountPanel(status){
    const old = document.getElementById('pwa-panel');
    if (old) old.remove();

    const box = document.createElement('div');
    box.id = 'pwa-panel';
    box.style.cssText = 'position:fixed;right:12px;bottom:12px;max-width:280px;background:#111827;color:#e5e7eb;padding:10px 12px;border-radius:12px;font:14px system-ui,Arial;box-shadow:0 10px 24px rgba(0,0,0,.3);z-index:9999';
    box.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span>🐦</span><b>FaceBird PWA</b>
      </div>
      <div style="line-height:1.3">
        <div>Manifest: <b id="pwa-mf">…</b></div>
        <div>Service Worker: <b id="pwa-sw">…</b></div>
        <div>Installable: <b id="pwa-inst">attente…</b></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button id="pwa-install" class="btn" style="padding:6px 10px;border-radius:10px;border:1px solid #3b82f6;background:#1d4ed8;color:#fff;cursor:pointer;display:none">⬇️ Installer l’app</button>
        <button id="pwa-close" style="padding:6px 10px;border-radius:10px;border:1px solid #334155;background:transparent;color:#e5e7eb;cursor:pointer">Fermer</button>
      </div>
    `;
    document.body.appendChild(box);
    document.getElementById('pwa-close').onclick = ()=> box.remove();

    // Remplit les statuts connus
    if (status) {
      if (status.manifest) document.getElementById('pwa-mf').textContent = status.manifest;
      if (status.sw)       document.getElementById('pwa-sw').textContent = status.sw;
    }

    // Bouton Installer
    const btn = document.getElementById('pwa-install');
    btn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      btn.style.display = 'none';
      document.getElementById('pwa-inst').textContent = 'install demandé';
    });

    return {panel:box, btn};
  }

  // Affiche le panneau rapidement
  const ui = mountPanel({ manifest:'chargement…', sw:'chargement…' });

  // Test manifest chargé
  fetch('manifest.webmanifest', {cache:'no-store'})
    .then(r => document.getElementById('pwa-mf').textContent = r.ok ? 'OK ✅' : ('Erreur ' + r.status))
    .catch(()=> document.getElementById('pwa-mf').textContent = 'Erreur ❌');

  // Test SW contrôleur
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      const active = !!reg && !!reg.active;
      document.getElementById('pwa-sw').textContent = active ? 'actif ✅' : 'inactif ❌';
    }).catch(()=> document.getElementById('pwa-sw').textContent = 'erreur ❌');
  } else {
    document.getElementById('pwa-sw').textContent = 'non supporté ❌';
  }

  // Capte l’événement d’installabilité
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('pwa-inst').textContent = 'Oui ✅';
    ui.btn.style.display = 'inline-block';
  });

  // Si l’événement n’arrive pas après quelques secondes
  setTimeout(() => {
    if (!deferredPrompt) {
      document.getElementById('pwa-inst').textContent = 'Non (voir manifest/SW) ❌';
    }
  }, 3500);
})();
