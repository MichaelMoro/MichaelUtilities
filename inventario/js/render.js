/* ============================================================
   render.js — Funzioni di rendering DOM (inventario)
   Dipende da: state, utils
   ============================================================ */

/* ── Stats ─────────────────────────────────────── */
async function updateStats() {
  const all = state.oggetti;
  const low = all.filter(isLow);

  document.getElementById('stat-total').textContent = all.length;
  document.getElementById('stat-cats').textContent  = state.categorie.length;
  document.getElementById('stat-low').textContent   = low.length;

  // Aggiorna aspetto tile scorte basse
  const alertTile = document.getElementById('stat-low-tile');
  alertTile.classList.toggle('active-filter', state.lowStockFilter);

  const last = await apiLoadLastPurchase();
  document.getElementById('stat-last').textContent = last
    ? `${fmtDate(last.data_acquisto)}${last.negozio ? ' · ' + last.negozio : ''}`
    : 'Nessuno';
}

/* ── Pills ─────────────────────────────────────── */
function buildPills() {
  const wrap = document.getElementById('pills-wrap');
  const all  = state.oggetti;
  const low  = all.filter(isLow);

  wrap.innerHTML = `
    <button class="pill-filter${!state.currentFilter && !state.lowStockFilter ? ' active' : ''}" data-id="">
      Tutte <span class="pill-count">${all.length}</span>
    </button>`;

  if (low.length > 0) {
    const btn = document.createElement('button');
    btn.className = `pill-filter pill-filter--alert${state.lowStockFilter ? ' active' : ''}`;
    btn.dataset.id = 'low';
    btn.innerHTML = `⚠ Scorte basse <span class="pill-count">${low.length}</span>`;
    wrap.appendChild(btn);
  }

  state.categorie.forEach(cat => {
    const count = all.filter(i => i.categoria_id === cat.id).length;
    if (count === 0) return;
    const btn = document.createElement('button');
    btn.className = `pill-filter${state.currentFilter === cat.id ? ' active' : ''}`;
    btn.dataset.id = cat.id;
    btn.innerHTML = `${cat.icona || ''} ${cat.nome} <span class="pill-count">${count}</span>`;
    wrap.appendChild(btn);
  });

  wrap.querySelectorAll('.pill-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (id === 'low') {
        state.lowStockFilter = !state.lowStockFilter;
        state.currentFilter  = '';
      } else {
        state.lowStockFilter = false;
        state.currentFilter  = id;
      }
      buildPills();
      document.getElementById('category-filter').value = state.lowStockFilter ? '' : state.currentFilter;
      renderSections();
      updateStats();
    });
  });
}

function buildFilterSelect() {
  const sel = document.getElementById('category-filter');
  // Rimuove listener precedente clonando il nodo
  const fresh = sel.cloneNode(false);
  sel.parentNode.replaceChild(fresh, sel);

  fresh.innerHTML = '<option value="">Tutte le categorie</option>';
  state.categorie.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.icona || ''} ${cat.nome}`;
    fresh.appendChild(opt);
  });
  fresh.addEventListener('change', () => {
    state.currentFilter  = fresh.value;
    state.lowStockFilter = false;
    buildPills();
    renderSections();
    updateStats();
  });
}

function buildFormCategorySelect() {
  const sel = document.getElementById('form-categoria');
  const prev = sel.value;
  sel.innerHTML = '<option value="">— Seleziona categoria —</option>';
  state.categorie.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.icona || ''} ${cat.nome}`;
    sel.appendChild(opt);
  });
  if (prev) sel.value = prev;
}

/* ── Filtered items ─────────────────────────────── */
function getFilteredItems() {
  let items = [...state.oggetti];

  if (state.lowStockFilter) {
    items = items.filter(isLow);
  } else if (state.currentFilter) {
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

/* ── Main render ────────────────────────────────── */
function renderSections() {
  const container = document.getElementById('main-content');
  const items     = getFilteredItems();

  if (items.length === 0) {
    const isSearch   = !!state.searchQuery;
    const isLowMode  = state.lowStockFilter;
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__glyph">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            ${isSearch
              ? '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>'
              : isLowMode
                ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
                : '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>'}
          </svg>
        </div>
        <div class="empty-state__title">${isSearch ? 'Nessun risultato' : isLowMode ? 'Nessuna scorta bassa' : 'Inventario vuoto'}</div>
        <div class="empty-state__sub">${isSearch
          ? `Nessun oggetto corrisponde a "${state.searchQuery}".`
          : isLowMode
            ? 'Ottimo! Tutte le scorte sono sopra la soglia minima.'
            : 'Aggiungi il tuo primo oggetto con il tasto + in alto.'}</div>
      </div>`;
    return;
  }

  // Raggruppa per categoria
  const catMap = {};
  state.categorie.forEach(c => { catMap[c.id] = { cat: c, items: [] }; });
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

  container.innerHTML = `<div class="sections-list">${sections.map(renderCatSection).join('')}</div>`;

  // Prezzi in background
  sections.forEach(s => s.items.forEach(item => fillLastPrice(item.id)));

  // Event delegation
  container.querySelectorAll('.item-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.item-actions')) return;
      openDrawer(row.dataset.id);
    });
  });
  container.querySelectorAll('.btn-edit-item').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); openEditModal(btn.dataset.id); });
  });
  container.querySelectorAll('.btn-delete-item').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); deleteItem(btn.dataset.id); });
  });
  container.querySelectorAll('.btn-cart-item').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); addToShoppingList(btn.dataset.id); });
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </span>
        </div>
      </div>
      <div class="cat-body" id="body-${cat.id}">
        ${items.map(renderItemRow).join('')}
        <div class="cat-footer">
          <button class="add-item-btn" data-cat-id="${cat.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
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
          ${item.note ? `<span class="item-meta-txt">${item.note.substring(0,36)}${item.note.length > 36 ? '…' : ''}</span>` : ''}
        </div>
      </div>
      <div class="item-row__right">
        <div class="item-qty num">${roundQty(item.quantita)} <span class="unit">${item.unita_misura}</span></div>
        <span class="status-dot ${low ? 'alert' : 'ok'}" title="${low ? 'Scorta bassa' : 'OK'}"></span>
        <div class="item-actions">
          <button class="btn--cart btn-cart-item" data-id="${item.id}" title="Aggiungi alla lista spesa">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </button>
          <button class="btn btn--ghost btn--icon btn-edit-item" data-id="${item.id}" title="Modifica">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/>
            </svg>
          </button>
          <button class="btn btn--danger btn--icon btn-delete-item" data-id="${item.id}" title="Elimina">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>`;
}

async function fillLastPrice(itemId) {
  const cell = document.getElementById(`price-${itemId}`);
  if (!cell) return;
  if (state.prezziCache[itemId]) {
    const list = state.prezziCache[itemId];
    if (list.length > 0) cell.textContent = fmtPrice(list[0].prezzo);
    return;
  }
  const last = await apiLoadLastPrice(itemId);
  if (last && cell) cell.textContent = fmtPrice(last.prezzo);
}

function toggleSection(catId) {
  const body   = document.getElementById(`body-${catId}`);
  const toggle = document.getElementById(`toggle-${catId}`);
  if (!body) return;
  const isNowCollapsed = body.classList.toggle('collapsed');
  toggle.classList.toggle('open', !isNowCollapsed);
}
