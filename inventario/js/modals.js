/* ============================================================
   modals.js — Gestione modal oggetto, drawer, prezzi, categorie
   Dipende da: state, utils, api, render
   ============================================================ */

/* ── Caricamento dati ───────────────────────────── */
async function loadAll() {
  document.getElementById('main-content').innerHTML =
    '<div class="loading-state"><div class="spinner"></div> Caricamento inventario…</div>';

  const { catRes, oggRes } = await apiLoadAll();

  if (catRes.error || oggRes.error) {
    document.getElementById('main-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-state__glyph">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div class="empty-state__title">Errore di connessione</div>
        <div class="empty-state__sub">Verifica le credenziali Supabase in js/config.js e riprova.</div>
      </div>`;
    console.error(catRes.error || oggRes.error);
    return;
  }

  state.categorie = catRes.data;
  state.oggetti   = oggRes.data;

  buildPills();
  buildFilterSelect();
  buildFormCategorySelect();
  updateStats();
  renderSections();
}

/* ── Modal aggiungi / modifica oggetto ─────────── */
function openAddModal(catId = '') {
  resetItemForm();
  document.getElementById('modal-title').textContent = 'Aggiungi oggetto';
  document.getElementById('modal-save').textContent  = 'Salva oggetto';
  if (catId) document.getElementById('form-categoria').value = catId;
  document.getElementById('form-data').value = today();
  openModal('item-modal-overlay');
  document.getElementById('form-nome').focus();
}

async function openEditModal(itemId) {
  const item = state.oggetti.find(i => i.id === itemId);
  if (!item) return;

  resetItemForm();
  document.getElementById('modal-title').textContent = 'Modifica oggetto';
  document.getElementById('modal-save').textContent  = 'Aggiorna oggetto';
  document.getElementById('form-item-id').value      = item.id;
  document.getElementById('form-nome').value         = item.nome || '';
  document.getElementById('form-categoria').value    = item.categoria_id || '';
  document.getElementById('form-posizione').value    = item.posizione_casa || '';
  document.getElementById('form-quantita').value     = item.quantita || 0;
  document.getElementById('form-unita').value        = item.unita_misura || 'pz';
  document.getElementById('form-soglia').value       = item.soglia_minima || 1;
  document.getElementById('form-note').value         = item.note || '';
  document.getElementById('form-data').value         = today();

  openModal('item-modal-overlay');
  document.getElementById('form-nome').focus();
}

function resetItemForm() {
  document.getElementById('item-form').reset();
  document.getElementById('form-item-id').value  = '';
  document.getElementById('form-quantita').value = '0';
  document.getElementById('form-soglia').value   = '1';
  document.getElementById('form-data').value     = today();
  // Chiudi pannello nuova categoria se aperto
  document.getElementById('new-cat-panel').classList.remove('open');
  document.getElementById('new-cat-nome').value = '';
}

async function saveItem() {
  const id      = document.getElementById('form-item-id').value;
  const nome    = document.getElementById('form-nome').value.trim();
  const catId   = document.getElementById('form-categoria').value;
  const qty     = parseFloat(document.getElementById('form-quantita').value) || 0;
  const unita   = document.getElementById('form-unita').value;
  const soglia  = parseFloat(document.getElementById('form-soglia').value) || 1;
  const pos     = document.getElementById('form-posizione').value.trim();
  const note    = document.getElementById('form-note').value.trim();

  const prezzo  = parseFloat(document.getElementById('form-prezzo').value);
  const negozio = document.getElementById('form-negozio').value.trim();
  const data    = document.getElementById('form-data').value;
  const notaAcq = document.getElementById('form-nota-acquisto').value.trim();

  if (!nome) {
    document.getElementById('form-nome').classList.add('error');
    document.getElementById('form-nome').focus();
    return;
  }
  document.getElementById('form-nome').classList.remove('error');

  const saveBtn = document.getElementById('modal-save');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Salvataggio…';

  const payload = {
    nome, quantita: qty, unita_misura: unita,
    soglia_minima: soglia, posizione_casa: pos || null,
    note: note || null,
    ...(catId ? { categoria_id: catId } : {}),
  };

  let itemId = id;

  if (id) {
    const { error } = await apiUpdateItem(id, payload);
    if (error) { toast('Errore durante l\'aggiornamento.', 'error'); saveBtn.disabled = false; saveBtn.textContent = 'Aggiorna oggetto'; return; }
    toast('Oggetto aggiornato.', 'success');
  } else {
    const found = await apiUpsertItem(nome, payload);
    if (found) {
      const { error } = await apiUpdateItem(found.id, { ...payload, attivo: true });
      if (error) { toast('Errore durante il ripristino.', 'error'); saveBtn.disabled = false; saveBtn.textContent = 'Salva oggetto'; return; }
      itemId = found.id;
      toast(found.attivo === false ? 'Oggetto ripristinato. Lo storico prezzi è stato preservato.' : 'Oggetto aggiornato.', 'success');
    } else {
      const { data: ins, error } = await apiInsertItem({ ...payload, attivo: true });
      if (error) { toast('Errore durante il salvataggio.', 'error'); saveBtn.disabled = false; saveBtn.textContent = 'Salva oggetto'; return; }
      itemId = ins.id;
      toast('Oggetto aggiunto.', 'success');
    }
  }

  if (!isNaN(prezzo) && prezzo > 0) {
    await apiInsertPrice({
      oggetto_id: itemId, prezzo,
      negozio: negozio || null,
      data_acquisto: data || today(),
      note: notaAcq || null,
    });
  }

  closeModal('item-modal-overlay');
  saveBtn.disabled = false;
  await loadAll();
}

/* ── Elimina oggetto ────────────────────────────── */
async function deleteItem(itemId) {
  const item = state.oggetti.find(i => i.id === itemId);
  if (!item) return;
  const ok = await confirmDialog(`Vuoi eliminare "${item.nome}"? Questa azione è irreversibile.`, 'Elimina oggetto');
  if (!ok) return;

  const { error } = await apiSoftDeleteItem(itemId);
  if (error) { toast('Errore durante l\'eliminazione.', 'error'); return; }

  if (state.drawerItemId === itemId) closeDrawer();
  toast(`"${item.nome}" eliminato.`, 'success');
  await loadAll();
}

/* ── Drawer dettaglio ───────────────────────────── */
function openDrawer(itemId) {
  const item = state.oggetti.find(i => i.id === itemId);
  if (!item) return;
  state.drawerItemId = itemId;

  document.getElementById('drawer-name').textContent = item.nome;
  const cat = state.categorie.find(c => c.id === item.categoria_id);
  document.getElementById('drawer-subtitle').textContent =
    `${cat ? cat.nome : 'Senza categoria'}${item.posizione_casa ? ' · ' + item.posizione_casa : ''}`;

  document.getElementById('qty-display').textContent = roundQty(item.quantita);
  document.getElementById('qty-unit').textContent    = item.unita_misura;
  document.getElementById('detail-soglia').textContent = fmtQty(item.soglia_minima, item.unita_misura);

  const posEl  = document.getElementById('detail-posizione');
  const noteEl = document.getElementById('detail-note');
  posEl.innerHTML  = item.posizione_casa
    ? `<div class="detail-field__value">${item.posizione_casa}</div>`
    : `<div class="detail-field__empty">Non specificata</div>`;
  noteEl.innerHTML = item.note
    ? `<div class="detail-field__value">${item.note}</div>`
    : `<div class="detail-field__empty">Nessuna nota</div>`;

  document.getElementById('drawer-edit').onclick   = () => { closeDrawer(); openEditModal(itemId); };
  document.getElementById('drawer-delete').onclick = () => deleteItem(itemId);
  document.getElementById('price-form-item-id').value = itemId;

  switchTab('detail');
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
  loadPrices(itemId);
}

function closeDrawer() {
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
  state.drawerItemId = null;
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
}

/* ── Quantità +/- ───────────────────────────────── */
async function adjustQty(delta) {
  if (!state.drawerItemId) return;
  const item = state.oggetti.find(i => i.id === state.drawerItemId);
  if (!item) return;

  const step   = (item.unita_misura === 'kg' || item.unita_misura === 'L') ? 0.1 : 1;
  const rawQty = parseFloat(item.quantita) + delta * step;
  const newQty = Math.max(0, Math.round(rawQty * 100) / 100);

  document.getElementById('qty-display').textContent = roundQty(newQty);

  const { error } = await apiUpdateItem(item.id, { quantita: newQty });
  if (error) { toast('Errore aggiornamento quantità.', 'error'); return; }

  item.quantita = newQty;
  renderSections();
  updateStats();
}

/* ── Storico prezzi ─────────────────────────────── */
async function loadPrices(itemId) {
  const container = document.getElementById('price-history');
  const summary   = document.getElementById('price-summary');
  container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
  summary.style.display = 'none';

  const { data, error } = await apiLoadPrices(itemId);
  state.prezziCache[itemId] = data || [];

  if (error || !data || data.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:32px 0">
        <div class="empty-state__glyph">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="empty-state__title">Nessun acquisto</div>
        <div class="empty-state__sub">Aggiungi il primo acquisto per tracciare i prezzi.</div>
      </div>`;
    return;
  }

  const prezzi = data.map(r => parseFloat(r.prezzo));
  const avg    = prezzi.reduce((a, b) => a + b, 0) / prezzi.length;
  const min    = Math.min(...prezzi);
  const max    = Math.max(...prezzi);

  summary.style.display = 'flex';
  summary.innerHTML = `
    <div class="price-summary__item">
      <div class="price-summary__label">Prezzo medio</div>
      <div class="price-summary__val num">${fmtPrice(avg)}</div>
    </div>
    <div class="price-summary__item">
      <div class="price-summary__label">Minimo storico</div>
      <div class="price-summary__val num" style="color:var(--green)">${fmtPrice(min)}</div>
    </div>
    <div class="price-summary__item">
      <div class="price-summary__label">Massimo storico</div>
      <div class="price-summary__val num" style="color:var(--red)">${fmtPrice(max)}</div>
    </div>`;

  container.innerHTML = data.map(r => {
    const p = parseFloat(r.prezzo);
    const cls = p === min ? 'best' : (p === max ? 'worst' : '');
    return `
      <div class="price-row">
        <div class="price-main num ${cls}">${fmtPrice(r.prezzo)}</div>
        <div>
          <div class="price-store">${r.negozio || '—'}</div>
          ${r.note ? `<div class="price-note">${r.note}</div>` : ''}
        </div>
        <div class="price-date num">${fmtDate(r.data_acquisto)}</div>
        <button class="btn btn--danger btn--icon" onclick="deletePrice('${r.id}','${itemId}')" title="Elimina">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>`;
  }).join('');
}

async function savePrice() {
  const itemId  = document.getElementById('price-form-item-id').value;
  const prezzo  = parseFloat(document.getElementById('pf-prezzo').value);
  const negozio = document.getElementById('pf-negozio').value.trim();
  const data    = document.getElementById('pf-data').value;
  const note    = document.getElementById('pf-note').value.trim();

  if (isNaN(prezzo) || prezzo <= 0) {
    document.getElementById('pf-prezzo').classList.add('error');
    document.getElementById('pf-prezzo').focus();
    return;
  }
  document.getElementById('pf-prezzo').classList.remove('error');

  const saveBtn = document.getElementById('price-modal-save');
  saveBtn.disabled = true;

  const { error } = await apiInsertPrice({
    oggetto_id: itemId, prezzo,
    negozio: negozio || null,
    data_acquisto: data || today(),
    note: note || null,
  });

  if (error) {
    toast('Errore durante il salvataggio.', 'error');
  } else {
    toast('Acquisto salvato.', 'success');
    closeModal('price-modal-overlay');
    if (state.drawerItemId === itemId) loadPrices(itemId);
    updateStats();
  }
  saveBtn.disabled = false;
}

async function deletePrice(priceId, itemId) {
  const ok = await confirmDialog('Vuoi eliminare questo acquisto dal registro prezzi?', 'Elimina acquisto');
  if (!ok) return;
  const { error } = await apiDeletePrice(priceId);
  if (error) { toast('Errore durante l\'eliminazione.', 'error'); return; }
  delete state.prezziCache[itemId];
  toast('Acquisto eliminato.', 'success');
  loadPrices(itemId);
  updateStats();
}

/* ── Crea categoria inline ──────────────────────── */
let _selectedIcon  = '📦';
let _selectedColor = '#2D6A4F';

function initNewCatPanel() {
  document.getElementById('btn-new-cat-toggle').addEventListener('click', () => {
    const panel = document.getElementById('new-cat-panel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) document.getElementById('new-cat-nome').focus();
  });

  document.getElementById('btn-new-cat-cancel').addEventListener('click', () => {
    document.getElementById('new-cat-panel').classList.remove('open');
    document.getElementById('new-cat-nome').value = '';
  });

  document.getElementById('icon-picker').addEventListener('click', (e) => {
    const opt = e.target.closest('.icon-opt');
    if (!opt) return;
    document.querySelectorAll('.icon-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    _selectedIcon = opt.dataset.icon;
  });

  document.getElementById('color-picker').addEventListener('click', (e) => {
    const opt = e.target.closest('.color-opt');
    if (!opt) return;
    document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    _selectedColor = opt.dataset.color;
  });

  document.getElementById('btn-new-cat-save').addEventListener('click', saveNewCategory);
}

async function saveNewCategory() {
  const nome = document.getElementById('new-cat-nome').value.trim();
  if (!nome) {
    document.getElementById('new-cat-nome').classList.add('error');
    document.getElementById('new-cat-nome').focus();
    return;
  }
  document.getElementById('new-cat-nome').classList.remove('error');

  const saveBtn = document.getElementById('btn-new-cat-save');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Creazione…';

  const maxOrdine = state.categorie.reduce((max, c) => Math.max(max, c.ordine || 0), 0);
  const { data, error } = await apiInsertCategory({
    nome, icona: _selectedIcon, colore: _selectedColor, ordine: maxOrdine + 1,
  });

  if (error) {
    toast('Errore durante la creazione della categoria.', 'error');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Crea categoria';
    return;
  }

  state.categorie.push(data);
  buildPills();
  buildFilterSelect();
  buildFormCategorySelect();
  document.getElementById('form-categoria').value = data.id;

  document.getElementById('new-cat-panel').classList.remove('open');
  document.getElementById('new-cat-nome').value = '';
  _selectedIcon  = '📦';
  _selectedColor = '#2D6A4F';
  document.querySelectorAll('.icon-opt').forEach((o, i) => o.classList.toggle('selected', i === 0));
  document.querySelectorAll('.color-opt').forEach((o, i) => o.classList.toggle('selected', i === 0));

  saveBtn.disabled = false;
  saveBtn.textContent = 'Crea categoria';
  toast(`Categoria "${nome}" creata.`, 'success');
}

/* ── Aggiungi alla lista spesa ──────────────────── */
async function addToShoppingList(itemId) {
  const result = await apiAddToShoppingList(itemId, null);
  if (result.error) { toast('Errore durante l\'aggiunta.', 'error'); return; }
  if (result.incremented) {
    toast(`Quantità aggiornata: ${result.newQty} in lista.`, 'success');
  } else {
    toast('Aggiunto alla lista della spesa.', 'success');
  }
}
