/* ============================================================
   utils.js — Funzioni di utilità pure (no DOM, no Supabase)
   ============================================================ */

function roundQty(q) {
  const r = Math.round(parseFloat(q) * 100) / 100;
  return r % 1 === 0 ? parseInt(r) : r;
}

function fmtQty(q, u)  { return `${roundQty(q)} ${u}`; }
function fmtPrice(p)   { return `€${parseFloat(p).toFixed(2)}`; }
function today()       { return new Date().toISOString().split('T')[0]; }
function isLow(item)   { return parseFloat(item.quantita) < parseFloat(item.soglia_minima); }

function fmtDate(d) {
  if (!d) return '—';
  const [y, m, g] = d.split('-');
  return `${g}/${m}/${y}`;
}

/* ── Toast ─────────────────────────────────────── */
function toast(msg, type = 'default') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ── Modal helpers ─────────────────────────────── */
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

/* ── Confirm dialog custom ─────────────────────── */
function confirmDialog(message, title = 'Conferma') {
  return new Promise((resolve) => {
    document.getElementById('confirm-title').textContent   = title;
    document.getElementById('confirm-message').textContent = message;
    openModal('confirm-modal-overlay');

    const ok      = document.getElementById('confirm-ok');
    const cancel  = document.getElementById('confirm-cancel');
    const close   = document.getElementById('confirm-modal-close');
    const overlay = document.getElementById('confirm-modal-overlay');

    function finish(result) {
      closeModal('confirm-modal-overlay');
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      close.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onOverlay);
      resolve(result);
    }
    function onOk()       { finish(true); }
    function onCancel()   { finish(false); }
    function onOverlay(e) { if (e.target === overlay) finish(false); }

    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    close.addEventListener('click', onCancel);
    overlay.addEventListener('click', onOverlay);
  });
}
