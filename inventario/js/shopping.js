/* ============================================================
   shopping.js — Logica lista della spesa
   Usato SOLO da lista-spesa.html
   Dipende da: config (sb), utils, api
   ============================================================ */

// Stato locale: array di { id, oggetto_id, quantita, note, checked, oggetti: {...} }
let shopItems = [];

/* ── Caricamento ─────────────────────────────────── */
async function loadShoppingList() {
  const container = document.getElementById('shop-content');
  container.innerHTML = '<div class="loading-state"><div class="spinner"></div> Caricamento lista…</div>';

  const { data, error } = await apiLoadShoppingList();

  if (error) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__glyph empty-state__glyph--violet">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div class="empty-state__title">Errore di connessione</div>
        <div class="empty-state__sub">Verifica le credenziali Supabase in js/config.js.</div>
      </div>`;
    return;
  }

  // Merge con stato checked locale (per non perdere le spunte al reload)
  shopItems = (data || []).map(row => {
    const existing = shopItems.find(s => s.id === row.id);
    return {
      ...row,
      quantita: parseFloat(row.quantita) || 1,
      checked: existing ? existing.checked : false,
    };
  });

  renderShopList();
  updateShopStats();
}

/* ── Render lista ────────────────────────────────── */
function renderShopList() {
  const container = document.getElementById('shop-content');

  if (shopItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__glyph empty-state__glyph--violet">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </div>
        <div class="empty-state__title">Lista vuota</div>
        <div class="empty-state__sub">Aggiungi oggetti dall'inventario con il pulsante carrello.</div>
      </div>`;
    updateConfirmBar();
    return;
  }

  // Da comprare prima, nel carrello dopo
  const todo = shopItems.filter(i => !i.checked);
  const done = shopItems.filter(i =>  i.checked);

  let html = todo.map(item => renderShopItem(item)).join('');

  if (done.length > 0) {
    html += `<div class="shop-category-label" style="margin-top:${todo.length > 0 ? '6px' : '0'}">Nel carrello</div>`;
    html += done.map(item => renderShopItem(item)).join('');
  }

  container.innerHTML = `<div class="shop-list" style="padding-top:8px">${html}</div>`;

  // Event delegation
  container.querySelectorAll('.shop-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.shop-remove') || e.target.closest('.shop-qty-ctrl')) return;
      toggleShopItem(el.dataset.id);
    });
  });
  container.querySelectorAll('.shop-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeShopItem(btn.dataset.id);
    });
  });
  // Controlli qty
  container.querySelectorAll('.shop-qty-minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      adjustShopQty(btn.dataset.id, -1);
    });
  });
  container.querySelectorAll('.shop-qty-plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      adjustShopQty(btn.dataset.id, +1);
    });
  });

  updateConfirmBar();
}

function renderShopItem(item) {
  const obj      = item.oggetti || {};
  const nome     = obj.nome || '(oggetto eliminato)';
  const unita    = obj.unita_misura || 'pz';
  const posizione = obj.posizione_casa || '';
  const meta     = [item.note, posizione].filter(Boolean).join(' · ');
  const cls      = item.checked ? 'shop-item checked' : 'shop-item';
  const qty      = item.quantita || 1;

  return `
    <div class="${cls}" data-id="${item.id}">
      <div class="shop-check">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div class="shop-info">
        <div class="shop-name">${nome}</div>
        ${meta ? `<div class="shop-meta">${meta}</div>` : ''}
      </div>
      <div class="shop-qty-ctrl">
        <button class="shop-qty-btn shop-qty-minus" data-id="${item.id}">−</button>
        <span class="shop-qty-val num">${qty} <span class="shop-qty-unit">${unita}</span></span>
        <button class="shop-qty-btn shop-qty-plus" data-id="${item.id}">+</button>
      </div>
      <button class="shop-remove" data-id="${item.id}" title="Rimuovi dalla lista">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>`;
}

/* ── Toggle checked ─────────────────────────────── */
function toggleShopItem(id) {
  const item = shopItems.find(i => i.id === id);
  if (!item) return;
  item.checked = !item.checked;
  renderShopList();
  updateShopStats();
}

/* ── Aggiusta quantità ───────────────────────────── */
async function adjustShopQty(id, delta) {
  const item = shopItems.find(i => i.id === id);
  if (!item) return;
  const newQty = Math.max(1, Math.round((item.quantita + delta) * 100) / 100);
  item.quantita = newQty;

  // Aggiorna in DB (fire & forget — aggiorna anche localmente)
  apiUpdateShoppingQty(id, newQty);

  // Aggiorna solo il valore nel DOM senza ri-renderizzare tutto
  const valEl = document.querySelector(`.shop-item[data-id="${id}"] .shop-qty-val`);
  if (valEl) {
    const unita = item.oggetti?.unita_misura || 'pz';
    valEl.innerHTML = `${newQty} <span class="shop-qty-unit">${unita}</span>`;
  }
  updateShopStats();
}

/* ── Rimuovi singolo ─────────────────────────────── */
async function removeShopItem(id) {
  const { error } = await apiDeleteFromShoppingList(id);
  if (error) { toast('Errore durante la rimozione.', 'error'); return; }
  shopItems = shopItems.filter(i => i.id !== id);
  renderShopList();
  updateShopStats();
  toast('Rimosso dalla lista.', 'success');
}

/* ── Confirm bar ─────────────────────────────────── */
function updateConfirmBar() {
  const bar     = document.getElementById('confirm-bar');
  // Contatore: solo gli item checked
  const checked = shopItems.filter(i => i.checked);
  bar.classList.toggle('visible', checked.length > 0);

  const totQty = checked.reduce((s, i) => s + (i.quantita || 1), 0);
  document.getElementById('confirm-bar-label').textContent =
    `${checked.length} oggett${checked.length === 1 ? 'o' : 'i'} · ${totQty} pz/unità`;
}

/* ── FATTO: rimuove dalla lista E aggiorna inventario ── */
async function confirmShoppingDone() {
  const checked = shopItems.filter(i => i.checked);
  if (checked.length === 0) return;

  const ok = await confirmDialog(
    `Vuoi confermare l'acquisto di ${checked.length} oggett${checked.length === 1 ? 'o' : 'i'}? Le quantità saranno aggiunte all'inventario.`,
    'Conferma acquisto'
  );
  if (!ok) return;

  // Prepara i dati per aggiornare l'inventario
  const toUpdate = checked
    .filter(i => i.oggetto_id && i.oggetti)
    .map(i => ({
      oggettoId:  i.oggetto_id,
      quantita:   i.quantita || 1,
      unitaMisura: i.oggetti?.unita_misura || 'pz',
    }));

  // Aggiorna inventario
  if (toUpdate.length > 0) {
    await apiConfirmShoppingToInventory(toUpdate);
  }

  // Rimuove dalla lista
  const ids = checked.map(i => i.id);
  const { error } = await apiClearCheckedFromShoppingList(ids);
  if (error) { toast('Errore durante la conferma.', 'error'); return; }

  shopItems = shopItems.filter(i => !i.checked);
  renderShopList();
  updateShopStats();
  toast(`${ids.length} oggett${ids.length === 1 ? 'o aggiornato' : 'i aggiornati'} in inventario.`, 'success');
}

/* ── Stats ───────────────────────────────────────── */
function updateShopStats() {
  document.getElementById('stat-shop-total').textContent   = shopItems.length;
  // Contatore carrello = solo checked
  document.getElementById('stat-shop-checked').textContent = shopItems.filter(i => i.checked).length;
}

/* ── Avvio ───────────────────────────────────────── */
document.getElementById('confirm-bar-ok').addEventListener('click', confirmShoppingDone);
document.getElementById('confirm-bar-cancel').addEventListener('click', () => {
  shopItems.forEach(i => { i.checked = false; });
  renderShopList();
  updateShopStats();
});

loadShoppingList();
