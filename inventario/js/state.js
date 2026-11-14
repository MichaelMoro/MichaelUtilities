/* ============================================================
   state.js — Stato globale condiviso tra i moduli
   ============================================================ */
const state = {
  categorie:     [],
  oggetti:       [],
  currentFilter: '',      // categoria_id attivo ('' = tutte, 'low' = scorte basse)
  lowStockFilter: false,  // true quando il tile scorte basse è attivo
  searchQuery:   '',
  drawerItemId:  null,    // id oggetto aperto nel drawer
  prezziCache:   {},      // { item_id: [...prezzi] }
};
