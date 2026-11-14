/* ============================================================
   events.js — Tutti i listener globali dell'inventario
   Dipende da: utils, modals, render
   ============================================================ */

/* ── Header ─────────────────────────────────────── */
document.getElementById('btn-add-item').addEventListener('click', () => openAddModal());

/* ── Lista spesa nav ─────────────────────────────── */
document.getElementById('btn-shopping-list').addEventListener('click', () => {
  window.location.href = 'lista-spesa.html';
});

/* ── Modal oggetto ───────────────────────────────── */
document.getElementById('modal-close').addEventListener('click',  () => closeModal('item-modal-overlay'));
document.getElementById('modal-cancel').addEventListener('click', () => closeModal('item-modal-overlay'));
document.getElementById('modal-save').addEventListener('click', saveItem);
document.getElementById('item-modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('item-modal-overlay')) closeModal('item-modal-overlay');
});

/* ── Drawer ──────────────────────────────────────── */
document.getElementById('drawer-close').addEventListener('click', closeDrawer);
document.getElementById('drawer-overlay').addEventListener('click', closeDrawer);

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
    if (btn.dataset.tab === 'prices' && state.drawerItemId) loadPrices(state.drawerItemId);
  });
});

/* ── Quantità +/- ───────────────────────────────── */
document.getElementById('qty-minus').addEventListener('click', () => adjustQty(-1));
document.getElementById('qty-plus').addEventListener('click',  () => adjustQty(1));

/* ── Modal prezzo ────────────────────────────────── */
document.getElementById('drawer-add-price').addEventListener('click', () => {
  document.getElementById('price-form').reset();
  document.getElementById('pf-data').value = today();
  openModal('price-modal-overlay');
  document.getElementById('pf-prezzo').focus();
});
document.getElementById('price-modal-close').addEventListener('click',  () => closeModal('price-modal-overlay'));
document.getElementById('price-modal-cancel').addEventListener('click', () => closeModal('price-modal-overlay'));
document.getElementById('price-modal-save').addEventListener('click', savePrice);
document.getElementById('price-modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('price-modal-overlay')) closeModal('price-modal-overlay');
});

/* ── Scorte basse tile ───────────────────────────── */
document.getElementById('stat-low-tile').addEventListener('click', () => {
  state.lowStockFilter = !state.lowStockFilter;
  state.currentFilter  = '';
  buildPills();
  document.getElementById('category-filter').value = '';
  renderSections();
  updateStats();
});

/* ── Ricerca ─────────────────────────────────────── */
let _searchTimer;
document.getElementById('search-input').addEventListener('input', (e) => {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => {
    state.searchQuery = e.target.value.trim();
    renderSections();
  }, 180);
});

/* ── Tasto ESC ───────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('confirm-modal-overlay').classList.contains('open')) {
    document.getElementById('confirm-cancel').click(); return;
  }
  if (document.getElementById('item-modal-overlay').classList.contains('open')) {
    closeModal('item-modal-overlay'); return;
  }
  if (document.getElementById('price-modal-overlay').classList.contains('open')) {
    closeModal('price-modal-overlay'); return;
  }
  if (document.getElementById('drawer').classList.contains('open')) {
    closeDrawer();
  }
});
