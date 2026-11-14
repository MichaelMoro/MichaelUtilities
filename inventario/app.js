/* ============================================================
   Inventario di Casa — app.js
   Integrazione Supabase + logica CRUD completa
   ============================================================ */

// ──────────────────────────────────────────────
// 1. CONFIGURAZIONE SUPABASE
//    Sostituisci con le tue credenziali dal dashboard Supabase
//    Project Settings → API
// ──────────────────────────────────────────────
const SUPABASE_URL  = 'https://adkcmjimbnoqzxujyzfu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka2NtamltYm5vcXp4dWp5emZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2Mjk4MDMsImV4cCI6MjExMDIwNTgwM30.jfguCpA5ETXX6NXJvPl13ypELfp0_ZJh-d-4teLp6Vg';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ──────────────────────────────────────────────
// 2. STATO APPLICAZIONE
// ──────────────────────────────────────────────
let state = {
  categorie: [],
  oggetti: [],
  currentFilter: '',      // categoria_id attivo ('' = tutte)
  searchQuery: '',
  drawerItemId: null,     // id oggetto aperto nel drawer
  prezziCache: {},        // { item_id: [...prezzi] }
};

// ──────────────────────────────────────────────
// 3. UTILITY
// ──────────────────────────────────────────────
function roundQty(q)   { const r = Math.round(parseFloat(q) * 100) / 100; return r % 1 === 0 ? parseInt(r) : r; }
function fmtQty(q, u)  { return `${roundQty(q)} ${u}`; }
function fmtPrice(p)   { return `€${parseFloat(p).toFixed(2)}`; }
function fmtDate(d)    {
  if (!d) return '—';
  const [y,m,g] = d.split('-');
  return `${g}/${m}/${y}`;
}
function today()       { return new Date().toISOString().split('T')[0]; }
function isLow(item)   { return parseFloat(item.quantita) < parseFloat(item.soglia_minima); }

// Modal di conferma custom (sostituisce confirm() nativo)
function confirmDialog(message, title = 'Conferma') {
  return new Promise((resolve) => {
    document.getElementById('confirm-title').textContent   = title;
    document.getElementById('confirm-message').textContent = message;
    openModal('confirm-modal-overlay');

    const ok     = document.getElementById('confirm-ok');
    const cancel = document.getElementById('confirm-cancel');
    const close  = document.getElementById('confirm-modal-close');
    const overlay = document.getElementById('confirm-modal-overlay');

    function finish(result) {
      closeModal('confirm-modal-overlay');
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      close.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onOverlay);
      resolve(result);
    }
    function onOk()      { finish(true); }
    function onCancel()  { finish(false); }
    function onOverlay(e){ if (e.target === overlay) finish(false); }

    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    close.addEventListener('click', onCancel);
    overlay.addEventListener('click', onOverlay);
  });
}

function toast(msg, type = 'default') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ──────────────────────────────────────────────
// 4. CARICAMENTO DATI
// ──────────────────────────────────────────────
async function loadAll() {
  document.getElementById('main-content').innerHTML =
    '<div class="loading-state"><div class="spinner"></div> Caricamento inventario…</div>';

  const [catRes, oggRes] = await Promise.all([
    sb.from('categorie').select('*').order('ordine'),
    sb.from('oggetti').select('*').eq('attivo', true).order('nome'),
  ]);

  if (catRes.error || oggRes.error) {
    document.getElementById('main-content').innerHTML =
      `<div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <div class="empty-state__title">Errore di connessione</div>
        <div class="empty-state__sub">Verifica le credenziali Supabase in app.js e riprova.</div>
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

// ──────────────────────────────────────────────
// 5. STATISTICHE
// ──────────────────────────────────────────────
async function updateStats() {
  const all    = state.oggetti;
  const low    = all.filter(isLow);

  document.getElementById('stat-total').textContent = all.length;
  document.getElementById('stat-cats').textContent  = state.categorie.length;
  document.getElementById('stat-low').textContent   = low.length;

  // Ultimo acquisto
  const { data: last } = await sb
    .from('storico_prezzi')
    .select('data_acquisto, negozio')
    .order('data_acquisto', { ascending: false })
    .limit(1);

  if (last && last.length > 0) {
    document.getElementById('stat-last').textContent =
      `${fmtDate(last[0].data_acquisto)}${last[0].negozio ? ' · ' + last[0].negozio : ''}`;
  } else {
    document.getElementById('stat-last').textContent = 'Nessuno';
  }
}

// ──────────────────────────────────────────────
// 6. RENDER PRINCIPALE
// ──────────────────────────────────────────────
function getFilteredItems() {
  let items = [...state.oggetti];
  if (state.currentFilter) {
    items = items.filter(i => i.categoria_id === state.currentFilter);
  }
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    items = items.filter(i =>
      i.nome.toLowerCase().includes(q) ||
      (i.posizione_casa || '').toLowerCase().includes(q) ||
      (i.note || '').toLowerCase().includes(q)
    );
  }
  return items;
}

function renderSections() {
  const container = document.getElementById('main-content');
  const items     = getFilteredItems();

  if (items.length === 0) {
    const isSearch = !!state.searchQuery;
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__glyph">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            ${isSearch
              ? '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>'
              : '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>'}
          </svg>
        </div>
        <div class="empty-state__title">${isSearch ? 'Nessun risultato' : 'Inventario vuoto'}</div>
        <div class="empty-state__sub">${isSearch
          ? `Nessun oggetto corrisponde a "${state.searchQuery}".`
          : 'Aggiungi il tuo primo oggetto con il tasto + in alto.'}</div>
      </div>`;
    return;
  }

  // Raggruppa per categoria
  const catMap = {};
  state.categorie.forEach(c => { catMap[c.id] = { cat: c, items: [] }; });
  // Bucket per oggetti senza categoria
  const noCat = { cat: { id: '__none__', nome: 'Senza categoria', icona: '📦', colore: '#94A3B8' }, items: [] };

  items.forEach(item => {
    if (item.categoria_id && catMap[item.categoria_id]) {
      catMap[item.categoria_id].items.push(item);
    } else {
      noCat.items.push(item);
    }
  });

  const sections = [...Object.values(catMap), ...(noCat.items.length ? [noCat] : [])]
    .filter(s => s.items.length > 0);

  if (sections.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📦</div><div class="empty-state__title">Nessun oggetto trovato</div></div>`;
    return;
  }

  container.innerHTML = `<div class="sections-list">${sections.map(renderCatSection).join('')}</div>`;

  // Prezzi last (async, fill in background)
  sections.forEach(s => s.items.forEach(item => fillLastPrice(item.id)));

  // Event delegation click su righe
  container.querySelectorAll('.item-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.item-actions')) return;
      openDrawer(row.dataset.id);
    });
  });
  container.querySelectorAll('.btn-edit-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(btn.dataset.id);
    });
  });
  container.querySelectorAll('.btn-delete-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteItem(btn.dataset.id);
    });
  });
  container.querySelectorAll('.add-item-btn').forEach(btn => {
    btn.addEventListener('click', () => openAddModal(btn.dataset.catId));
  });
  container.querySelectorAll('.cat-header').forEach(header => {
    header.addEventListener('click', () => toggleSection(header.dataset.catId));
  });
}

function renderCatSection({ cat, items }) {
  const bg = cat.colore ? `${cat.colore}18` : 'var(--surface-2)';
  const alertCount = items.filter(isLow).length;

  return `
    <div class="cat-section" id="cat-section-${cat.id}">
      <div class="cat-header" data-cat-id="${cat.id}">
        <div class="cat-header__left">
          <div class="cat-icon" style="background:${bg}">${cat.icona || '📦'}</div>
          <span class="cat-name">${cat.nome}</span>
          <span class="cat-count">${items.length} oggett${items.length === 1 ? 'o' : 'i'}</span>
          ${alertCount > 0 ? `<span class="alert-chip">${alertCount} basse</span>` : ''}
        </div>
        <div class="cat-header__right">
          <span class="cat-toggle open" id="toggle-${cat.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          </span>
        </div>
      </div>
      <div class="cat-body" id="body-${cat.id}">
        ${items.length === 0
          ? `<div class="cat-empty">Nessun oggetto. Aggiungi il primo.</div>`
          : items.map(renderItemRow).join('')}
        <div class="cat-footer">
          <button class="add-item-btn" data-cat-id="${cat.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Aggiungi oggetto
          </button>
        </div>
      </div>
    </div>`;
}

function renderItemRow(item) {
  const low = isLow(item);
  return `
    <div class="item-row" data-id="${item.id}">
      <div class="item-info">
        <div class="item-name">${item.nome}</div>
        <div class="item-meta">
          ${item.posizione_casa ? `<span class="item-meta-txt">${item.posizione_casa}</span>` : ''}
          ${item.note ? `<span class="item-meta-txt">${item.note.substring(0,36)}${item.note.length>36?'…':''}</span>` : ''}
        </div>
      </div>
      <div class="item-qty num">${roundQty(item.quantita)} <span class="unit">${item.unita_misura}</span></div>
      <div class="item-price num" id="price-${item.id}">—</div>
      <span class="status-dot ${low ? 'alert' : 'ok'}" title="${low ? 'Scorta bassa' : 'OK'}"></span>
      <div class="item-actions">
        <button class="btn btn--ghost btn--icon btn-edit-item" data-id="${item.id}" title="Modifica">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
        </button>
        <button class="btn btn--danger btn--icon btn-delete-item" data-id="${item.id}" title="Elimina">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>`;
}

// Riempie il prezzo dell'ultimo acquisto in background
async function fillLastPrice(itemId) {
  const cell = document.getElementById(`price-${itemId}`);
  if (!cell) return;

  if (state.prezziCache[itemId]) {
    const list = state.prezziCache[itemId];
    if (list.length > 0) cell.textContent = fmtPrice(list[0].prezzo);
    return;
  }

  const { data } = await sb
    .from('storico_prezzi')
    .select('prezzo')
    .eq('oggetto_id', itemId)
    .order('data_acquisto', { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    if (cell) cell.textContent = fmtPrice(data[0].prezzo);
  }
}

function toggleSection(catId) {
  const body   = document.getElementById(`body-${catId}`);
  const toggle = document.getElementById(`toggle-${catId}`);
  if (!body) return;
  const isNowCollapsed = body.classList.toggle('collapsed');
  toggle.classList.toggle('open', !isNowCollapsed);
}

// ──────────────────────────────────────────────
// 7. PILLS & FILTRI
// ──────────────────────────────────────────────
function buildPills() {
  const wrap = document.getElementById('pills-wrap');
  const all  = state.oggetti;

  wrap.innerHTML = `<button class="pill-filter active" data-id="">
    Tutte <span class="pill-count">${all.length}</span>
  </button>`;

  state.categorie.forEach(cat => {
    const count = all.filter(i => i.categoria_id === cat.id).length;
    if (count === 0) return;
    const btn = document.createElement('button');
    btn.className = 'pill-filter';
    btn.dataset.id = cat.id;
    btn.innerHTML = `${cat.icona || ''} ${cat.nome} <span class="pill-count">${count}</span>`;
    wrap.appendChild(btn);
  });

  wrap.querySelectorAll('.pill-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('.pill-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentFilter = btn.dataset.id;
      document.getElementById('category-filter').value = btn.dataset.id;
      renderSections();
    });
  });
}

function buildFilterSelect() {
  const sel = document.getElementById('category-filter');
  sel.innerHTML = '<option value="">Tutte le categorie</option>';
  state.categorie.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.icona || ''} ${cat.nome}`;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => {
    state.currentFilter = sel.value;
    // Sync pills
    document.querySelectorAll('.pill-filter').forEach(b => {
      b.classList.toggle('active', b.dataset.id === sel.value);
    });
    renderSections();
  });
}

function buildFormCategorySelect() {
  const sel = document.getElementById('form-categoria');
  sel.innerHTML = '<option value="">— Seleziona categoria —</option>';
  state.categorie.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.icona || ''} ${cat.nome}`;
    sel.appendChild(opt);
  });
}

// ──────────────────────────────────────────────
// 8. MODAL AGGIUNGI / MODIFICA OGGETTO
// ──────────────────────────────────────────────
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
  document.getElementById('form-item-id').value = '';
  document.getElementById('form-quantita').value = '0';
  document.getElementById('form-soglia').value   = '1';
  document.getElementById('form-data').value    = today();
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

  // Dati acquisto (opzionali)
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
    // UPDATE esplicito (modifica da form)
    const { error } = await sb.from('oggetti').update(payload).eq('id', id);
    if (error) { toast('Errore durante l\'aggiornamento.', 'error'); saveBtn.disabled = false; saveBtn.textContent = 'Aggiorna oggetto'; return; }
    toast('Oggetto aggiornato.', 'success');
  } else {
    // UPSERT INTELLIGENTE: cerca un oggetto con lo stesso nome (case-insensitive),
    // in qualsiasi categoria e con qualsiasi valore di attivo.
    // La ricerca è volutamente larga: se c'è già "Pasta Barilla" (attivo=false),
    // lo riattiva invece di creare un duplicato.
    const { data: existing, error: findErr } = await sb
      .from('oggetti')
      .select('id, attivo')
      .ilike('nome', nome)
      .limit(1);

    if (findErr) console.warn('Upsert lookup error:', findErr);
    const found = existing?.[0];

    if (found) {
      // Riattiva e aggiorna tutti i campi (quantita, unita, soglia, posizione, note, categoria, attivo)
      const updatePayload = { ...payload, attivo: true };
      const { error } = await sb.from('oggetti').update(updatePayload).eq('id', found.id);
      if (error) { toast('Errore durante il ripristino.', 'error'); saveBtn.disabled = false; saveBtn.textContent = 'Salva oggetto'; return; }
      itemId = found.id;
      const wasDeleted = !found.attivo;
      toast(wasDeleted ? 'Oggetto ripristinato. Lo storico prezzi è stato preservato.' : 'Oggetto aggiornato.', 'success');
    } else {
      // INSERT nuovo — nessun duplicato trovato
      const { data: ins, error } = await sb.from('oggetti').insert({ ...payload, attivo: true }).select().single();
      if (error) { toast('Errore durante il salvataggio.', 'error'); saveBtn.disabled = false; saveBtn.textContent = 'Salva oggetto'; return; }
      itemId = ins.id;
      toast('Oggetto aggiunto.', 'success');
    }
  }

  // Acquisto opzionale
  if (!isNaN(prezzo) && prezzo > 0) {
    await sb.from('storico_prezzi').insert({
      oggetto_id: itemId,
      prezzo,
      negozio: negozio || null,
      data_acquisto: data || today(),
      note: notaAcq || null,
    });
  }

  closeModal('item-modal-overlay');
  saveBtn.disabled = false;
  await loadAll();
}

// ──────────────────────────────────────────────
// 9. ELIMINA OGGETTO
// ──────────────────────────────────────────────
async function deleteItem(itemId) {
  const item = state.oggetti.find(i => i.id === itemId);
  if (!item) return;
  const ok = await confirmDialog(`Vuoi eliminare "${item.nome}"? Questa azione è irreversibile.`, 'Elimina oggetto');
  if (!ok) return;

  const { error } = await sb.from('oggetti').update({ attivo: false }).eq('id', itemId);
  if (error) { toast('Errore durante l\'eliminazione.', 'error'); return; }

  if (state.drawerItemId === itemId) closeDrawer();
  toast(`"${item.nome}" eliminato.`, 'success');
  await loadAll();
}

// ──────────────────────────────────────────────
// 10. DRAWER DETTAGLIO
// ──────────────────────────────────────────────
function openDrawer(itemId) {
  const item = state.oggetti.find(i => i.id === itemId);
  if (!item) return;
  state.drawerItemId = itemId;

  // Header
  document.getElementById('drawer-name').textContent = item.nome;
  const cat = state.categorie.find(c => c.id === item.categoria_id);
  document.getElementById('drawer-subtitle').textContent =
    `${cat ? cat.nome : 'Senza categoria'}${item.posizione_casa ? ' · ' + item.posizione_casa : ''}`;

  // Dettagli
  document.getElementById('qty-display').textContent = roundQty(item.quantita);
  document.getElementById('qty-unit').textContent    = item.unita_misura;
  document.getElementById('detail-soglia').textContent =
    fmtQty(item.soglia_minima, item.unita_misura);

  const posEl  = document.getElementById('detail-posizione');
  const noteEl = document.getElementById('detail-note');
  posEl.innerHTML  = item.posizione_casa
    ? `<div class="detail-field__value">${item.posizione_casa}</div>`
    : `<div class="detail-field__empty">Non specificata</div>`;
  noteEl.innerHTML = item.note
    ? `<div class="detail-field__value">${item.note}</div>`
    : `<div class="detail-field__empty">Nessuna nota</div>`;

  // Azioni drawer
  document.getElementById('drawer-edit').onclick   = () => { closeDrawer(); openEditModal(itemId); };
  document.getElementById('drawer-delete').onclick = () => deleteItem(itemId);
  document.getElementById('price-form-item-id').value = itemId;

  // Reset tab
  switchTab('detail');

  // Overlay + drawer
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');

  // Carica prezzi
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

async function loadPrices(itemId) {
  const container = document.getElementById('price-history');
  const summary   = document.getElementById('price-summary');
  container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
  summary.style.display = 'none';

  const { data, error } = await sb
    .from('storico_prezzi')
    .select('*')
    .eq('oggetto_id', itemId)
    .order('data_acquisto', { ascending: false });

  state.prezziCache[itemId] = data || [];

  if (error || !data || data.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:32px 0">
      <div class="empty-state__icon">💰</div>
      <div class="empty-state__title">Nessun acquisto registrato</div>
      <div class="empty-state__sub">Aggiungi il primo acquisto per tracciare i prezzi.</div>
    </div>`;
    return;
  }

  // Summary
  const prezzi = data.map(r => parseFloat(r.prezzo));
  const avg    = prezzi.reduce((a,b) => a+b, 0) / prezzi.length;
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
      <div class="price-summary__val num" style="color:var(--emerald)">${fmtPrice(min)}</div>
    </div>
    <div class="price-summary__item">
      <div class="price-summary__label">Massimo storico</div>
      <div class="price-summary__val num" style="color:var(--coral)">${fmtPrice(max)}</div>
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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>`;
  }).join('');
}

// ──────────────────────────────────────────────
// 11. QUANTITÀ +/- nel drawer
// ──────────────────────────────────────────────
document.getElementById('qty-minus').addEventListener('click', () => adjustQty(-1));
document.getElementById('qty-plus').addEventListener('click',  () => adjustQty(1));

async function adjustQty(delta) {
  if (!state.drawerItemId) return;
  const item = state.oggetti.find(i => i.id === state.drawerItemId);
  if (!item) return;

  const step   = item.unita_misura === 'kg' || item.unita_misura === 'L' ? 0.1 : 1;
  const rawQty = parseFloat(item.quantita) + delta * step;
  const newQty = Math.max(0, Math.round(rawQty * 100) / 100);  // evita 1.7999...

  document.getElementById('qty-display').textContent = roundQty(newQty);

  const { error } = await sb.from('oggetti').update({ quantita: newQty }).eq('id', item.id);
  if (error) { toast('Errore aggiornamento quantità.', 'error'); return; }

  item.quantita = newQty;
  // Aggiorna anche la riga nella lista
  renderSections();
}

// ──────────────────────────────────────────────
// 12. MODAL AGGIUNGI ACQUISTO (dal drawer)
// ──────────────────────────────────────────────
document.getElementById('drawer-add-price').addEventListener('click', () => {
  document.getElementById('price-form').reset();
  document.getElementById('pf-data').value = today();
  openModal('price-modal-overlay');
  document.getElementById('pf-prezzo').focus();
});

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

  const { error } = await sb.from('storico_prezzi').insert({
    oggetto_id: itemId,
    prezzo,
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
  const { error } = await sb.from('storico_prezzi').delete().eq('id', priceId);
  if (error) { toast('Errore durante l\'eliminazione.', 'error'); return; }
  delete state.prezziCache[itemId];
  toast('Acquisto eliminato.', 'success');
  loadPrices(itemId);
  updateStats();
}

// ──────────────────────────────────────────────
// 13. MODALE / DRAWER HELPERS
// ──────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ──────────────────────────────────────────────
// 13b. CREA CATEGORIA INLINE
// ──────────────────────────────────────────────
let selectedIcon  = '📦';
let selectedColor = '#2D6A4F';

function initNewCatPanel() {
  // Toggle apertura pannello
  document.getElementById('btn-new-cat-toggle').addEventListener('click', () => {
    const panel = document.getElementById('new-cat-panel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      document.getElementById('new-cat-nome').focus();
    }
  });

  // Chiudi pannello
  document.getElementById('btn-new-cat-cancel').addEventListener('click', () => {
    document.getElementById('new-cat-panel').classList.remove('open');
    document.getElementById('new-cat-nome').value = '';
  });

  // Icon picker
  document.getElementById('icon-picker').addEventListener('click', (e) => {
    const opt = e.target.closest('.icon-opt');
    if (!opt) return;
    document.querySelectorAll('.icon-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    selectedIcon = opt.dataset.icon;
  });

  // Color picker
  document.getElementById('color-picker').addEventListener('click', (e) => {
    const opt = e.target.closest('.color-opt');
    if (!opt) return;
    document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    selectedColor = opt.dataset.color;
  });

  // Salva nuova categoria
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
  const { data, error } = await sb.from('categorie').insert({
    nome,
    icona: selectedIcon,
    colore: selectedColor,
    ordine: maxOrdine + 1,
  }).select().single();

  if (error) {
    toast('Errore durante la creazione della categoria.', 'error');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Crea categoria';
    return;
  }

  // Aggiorna stato locale
  state.categorie.push(data);
  buildPills();
  buildFilterSelect();
  buildFormCategorySelect();

  // Seleziona la nuova categoria nel select
  document.getElementById('form-categoria').value = data.id;

  // Chiudi pannello e resetta
  document.getElementById('new-cat-panel').classList.remove('open');
  document.getElementById('new-cat-nome').value = '';
  selectedIcon  = '📦';
  selectedColor = '#2D6A4F';
  document.querySelectorAll('.icon-opt').forEach((o,i) => o.classList.toggle('selected', i === 0));
  document.querySelectorAll('.color-opt').forEach((o,i) => o.classList.toggle('selected', i === 0));

  saveBtn.disabled = false;
  saveBtn.textContent = 'Crea categoria';
  toast(`Categoria "${nome}" creata.`, 'success');
}

// ──────────────────────────────────────────────
// 14. EVENT LISTENERS
// ──────────────────────────────────────────────
document.getElementById('btn-add-item').addEventListener('click', () => openAddModal());
document.getElementById('modal-close').addEventListener('click',  () => closeModal('item-modal-overlay'));
document.getElementById('modal-cancel').addEventListener('click', () => closeModal('item-modal-overlay'));
document.getElementById('modal-save').addEventListener('click', saveItem);

// Chiudi modal cliccando overlay
document.getElementById('item-modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('item-modal-overlay')) closeModal('item-modal-overlay');
});

// Drawer
document.getElementById('drawer-close').addEventListener('click', closeDrawer);
document.getElementById('drawer-overlay').addEventListener('click', closeDrawer);

// Tabs drawer
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
    if (btn.dataset.tab === 'prices' && state.drawerItemId) loadPrices(state.drawerItemId);
  });
});

// Modal prezzo
document.getElementById('price-modal-close').addEventListener('click',  () => closeModal('price-modal-overlay'));
document.getElementById('price-modal-cancel').addEventListener('click', () => closeModal('price-modal-overlay'));
document.getElementById('price-modal-save').addEventListener('click', savePrice);
document.getElementById('price-modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('price-modal-overlay')) closeModal('price-modal-overlay');
});

// Ricerca real-time
let searchTimer;
document.getElementById('search-input').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.searchQuery = e.target.value.trim();
    renderSections();
  }, 180);
});

// Pulsante Categorie (gestione semplice tramite prompt)
document.getElementById('btn-manage-categories').addEventListener('click', () => {
  toast('Gestione categorie: vai su supabase.com/dashboard → Table Editor → categorie');
});

// Tasto ESC chiude modal/drawer
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('confirm-modal-overlay').classList.contains('open')) { document.getElementById('confirm-cancel').click(); return; }
  if (document.getElementById('item-modal-overlay').classList.contains('open'))   { closeModal('item-modal-overlay');  return; }
  if (document.getElementById('price-modal-overlay').classList.contains('open'))  { closeModal('price-modal-overlay'); return; }
  if (document.getElementById('drawer').classList.contains('open'))               { closeDrawer(); }
});

// ──────────────────────────────────────────────
// 15. AVVIO
// ──────────────────────────────────────────────
initNewCatPanel();
loadAll();
