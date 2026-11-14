/* ============================================================
   api.js — Tutte le chiamate Supabase (nessun DOM qui)
   ============================================================ */

async function apiLoadAll() {
  const [catRes, oggRes] = await Promise.all([
    sb.from('categorie').select('*').order('ordine'),
    sb.from('oggetti').select('*').eq('attivo', true).order('nome'),
  ]);
  return { catRes, oggRes };
}

async function apiLoadLastPurchase() {
  const { data } = await sb
    .from('storico_prezzi')
    .select('data_acquisto, negozio')
    .order('data_acquisto', { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

async function apiUpdateItem(id, payload) {
  return sb.from('oggetti').update(payload).eq('id', id);
}

async function apiInsertItem(payload) {
  return sb.from('oggetti').insert(payload).select().single();
}

async function apiUpsertItem(nome, payload) {
  // Cerca un record con lo stesso nome (case-insensitive), qualsiasi stato attivo
  const { data: existing, error: findErr } = await sb
    .from('oggetti')
    .select('id, attivo')
    .ilike('nome', nome)
    .limit(1);

  if (findErr) console.warn('Upsert lookup error:', findErr);
  return existing?.[0] ?? null;
}

async function apiSoftDeleteItem(id) {
  return sb.from('oggetti').update({ attivo: false }).eq('id', id);
}

async function apiInsertPrice(payload) {
  return sb.from('storico_prezzi').insert(payload);
}

async function apiDeletePrice(id) {
  return sb.from('storico_prezzi').delete().eq('id', id);
}

async function apiLoadPrices(itemId) {
  return sb
    .from('storico_prezzi')
    .select('*')
    .eq('oggetto_id', itemId)
    .order('data_acquisto', { ascending: false });
}

async function apiLoadLastPrice(itemId) {
  const { data } = await sb
    .from('storico_prezzi')
    .select('prezzo')
    .eq('oggetto_id', itemId)
    .order('data_acquisto', { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

async function apiInsertCategory(payload) {
  return sb.from('categorie').insert(payload).select().single();
}

/* ── Lista spesa ───────────────────────────────── */
async function apiLoadShoppingList() {
  return sb
    .from('lista_spesa')
    .select('*, oggetti(nome, unita_misura, categoria_id, posizione_casa)')
    .order('created_at');
}

async function apiAddToShoppingList(oggettoId, note) {
  // Se l'oggetto è già in lista, incrementa la quantità di 1
  const { data: existing } = await sb
    .from('lista_spesa')
    .select('id, quantita')
    .eq('oggetto_id', oggettoId)
    .limit(1);

  if (existing && existing.length > 0) {
    const row = existing[0];
    const newQty = Math.round(((row.quantita || 1) + 1) * 100) / 100;
    const res = await sb.from('lista_spesa').update({ quantita: newQty }).eq('id', row.id);
    return { ...res, incremented: true, newQty };
  }

  return sb.from('lista_spesa').insert({
    oggetto_id: oggettoId,
    note: note || null,
    quantita: 1,
  });
}

async function apiUpdateShoppingQty(id, quantita) {
  return sb.from('lista_spesa').update({ quantita }).eq('id', id);
}

async function apiDeleteFromShoppingList(id) {
  return sb.from('lista_spesa').delete().eq('id', id);
}

async function apiClearCheckedFromShoppingList(ids) {
  return sb.from('lista_spesa').delete().in('id', ids);
}

// Aggiunge la quantità acquistata all'inventario per ogni item checked
async function apiConfirmShoppingToInventory(items) {
  // items: array di { oggettoId, quantita, unitaMisura }
  const results = [];
  for (const item of items) {
    // Leggi la quantità attuale
    const { data: obj } = await sb
      .from('oggetti')
      .select('id, quantita')
      .eq('id', item.oggettoId)
      .single();

    if (!obj) continue;

    const newQty = Math.round(
      (parseFloat(obj.quantita || 0) + parseFloat(item.quantita || 1)) * 100
    ) / 100;

    results.push(
      sb.from('oggetti').update({ quantita: newQty }).eq('id', item.oggettoId)
    );
  }
  return Promise.all(results);
}
