/* ============================================================
   auth.js — Guard di autenticazione + logout
   Includere SUBITO dopo config.js in index.html e lista-spesa.html
   ============================================================ */

(async () => {
  const { data: { session } } = await sb.auth.getSession();

  if (!session) {
    // Non autenticato → login
    window.location.replace('login.html');
    return; // blocca caricamento resto della pagina
  }

  // Espone l'utente corrente per eventuale uso futuro
  window.__currentUser = session.user;

  // Aggiorna email nell'header se presente
  const emailEl = document.getElementById('header-user-email');
  if (emailEl) emailEl.textContent = session.user.email;

  // Listener: se la sessione scade → redirect automatico
  sb.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') window.location.replace('login.html');
  });
})();

async function logout() {
  await sb.auth.signOut();
  window.location.replace('login.html');
}
