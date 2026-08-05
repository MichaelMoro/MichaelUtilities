/* ============================================================
   FUERTEVENTURA TRIP LOG — design system
   Palette drawn from the island itself: bleached dune sand,
   deep Atlantic teal, volcanic basalt, sunset amber over lava.
   ============================================================ */

@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

:root{
  /* --- color tokens --- */
  --sand-50:   #F7F2E7;   /* page background — dune sand */
  --sand-100:  #EFE6D2;   /* card background */
  --sand-200:  #E3D5B8;   /* borders, dividers */
  --basalt-800:#2B2621;   /* primary text — volcanic rock */
  --basalt-600:#544B40;   /* secondary text */
  --ocean-700: #0F5C63;   /* deep Atlantic teal — primary accent */
  --ocean-500: #1D818A;   /* mid teal — links, icons */
  --ocean-100: #DCEEEC;   /* pale teal tint */
  --amber-500: #D97D2B;   /* sunset over lava — secondary accent */
  --amber-100: #F7E3CB;   /* pale amber tint */
  --white:     #FFFDF9;

  /* --- type --- */
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* --- scale --- */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  --shadow-card: 0 1px 2px rgba(43,38,33,0.06), 0 8px 24px -12px rgba(43,38,33,0.18);
  --shadow-hover: 0 4px 8px rgba(43,38,33,0.08), 0 16px 32px -12px rgba(43,38,33,0.24);
}

*, *::before, *::after{ box-sizing:border-box; }

html{ scroll-behavior:smooth; }

body{
  margin:0;
  background:
    radial-gradient(1200px 600px at 90% -10%, var(--amber-100) 0%, transparent 60%),
    radial-gradient(1000px 500px at -10% 10%, var(--ocean-100) 0%, transparent 55%),
    var(--sand-50);
  color:var(--basalt-800);
  font-family:var(--font-body);
  font-size:16px;
  line-height:1.6;
  -webkit-font-smoothing:antialiased;
  padding:0 0 96px;
}

a{ color:var(--ocean-700); }

::selection{ background:var(--amber-500); color:var(--white); }

/* focus visibility */
a:focus-visible, button:focus-visible{
  outline:2px solid var(--ocean-700);
  outline-offset:3px;
}

/* ============================================================
   HERO / TRIP HEADER
   ============================================================ */
.trip{
  max-width:880px;
  margin:0 auto;
  padding:0 24px;
}

.trip-header{
  padding:72px 0 48px;
  text-align:center;
  position:relative;
}

.trip-header__eyebrow{
  display:inline-flex;
  align-items:center;
  gap:8px;
  font-family:var(--font-mono);
  font-size:12.5px;
  letter-spacing:0.14em;
  text-transform:uppercase;
  color:var(--ocean-700);
  background:var(--ocean-100);
  border:1px solid var(--ocean-500);
  border-radius:999px;
  padding:6px 16px;
  margin-bottom:22px;
}

.trip-header__title{
  font-family:var(--font-display);
  font-weight:600;
  font-size:clamp(2.2rem, 5vw, 3.4rem);
  line-height:1.08;
  margin:0 0 14px;
  color:var(--basalt-800);
}

.trip-header__title em{
  font-style:italic;
  color:var(--ocean-700);
}

.trip-header__subtitle{
  font-size:1.08rem;
  color:var(--basalt-600);
  max-width:560px;
  margin:0 auto;
}

.trip-header__meta{
  display:flex;
  justify-content:center;
  gap:28px;
  flex-wrap:wrap;
  margin-top:32px;
  font-family:var(--font-mono);
  font-size:13px;
  color:var(--basalt-600);
}

.trip-header__meta span{ display:flex; align-items:center; gap:6px; }
.trip-header__meta strong{ color:var(--basalt-800); font-weight:700; }

/* ============================================================
   TIMELINE — the signature element.
   A coastline route runs down the left edge; each day is a stop
   marked with its own compass stamp, because the itinerary is a
   real day-by-day sequence and order genuinely matters here.
   ============================================================ */
.timeline{
  position:relative;
  margin-top:24px;
  padding-left:64px;
}

.timeline::before{
  content:"";
  position:absolute;
  left:23px;
  top:8px;
  bottom:8px;
  width:2px;
  background:repeating-linear-gradient(
    to bottom,
    var(--ocean-500) 0 6px,
    transparent 6px 12px
  );
}

.day-card{
  position:relative;
  margin-bottom:40px;
  background:var(--white);
  border:1px solid var(--sand-200);
  border-radius:var(--radius-lg);
  box-shadow:var(--shadow-card);
  overflow:hidden;
  transition:box-shadow .2s ease, transform .2s ease;
}

.day-card:hover{ box-shadow:var(--shadow-hover); transform:translateY(-2px); }

.day-card::before{
  /* the compass "stamp" sitting on the coastline */
  content:attr(data-day);
  position:absolute;
  left:-64px;
  top:28px;
  width:48px;
  height:48px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:var(--ocean-700);
  color:var(--sand-50);
  font-family:var(--font-mono);
  font-weight:700;
  font-size:15px;
  border-radius:50%;
  border:3px solid var(--sand-50);
  box-shadow:0 0 0 2px var(--ocean-500);
}

.day-card__header{
  display:flex;
  flex-wrap:wrap;
  align-items:baseline;
  gap:10px 16px;
  padding:28px 32px 20px;
  border-bottom:1px solid var(--sand-200);
  background:linear-gradient(180deg, var(--ocean-100) 0%, transparent 100%);
}

.day-card__date{
  font-family:var(--font-mono);
  font-size:13px;
  letter-spacing:0.06em;
  text-transform:uppercase;
  color:var(--ocean-700);
  font-weight:700;
}

.day-card__title{
  font-family:var(--font-display);
  font-size:1.5rem;
  font-weight:600;
  margin:0;
  flex:1 1 auto;
  color:var(--basalt-800);
}

.day-card__zone{
  font-family:var(--font-mono);
  font-size:11.5px;
  letter-spacing:0.08em;
  text-transform:uppercase;
  color:var(--amber-500);
  background:var(--amber-100);
  border:1px solid var(--amber-500);
  border-radius:999px;
  padding:4px 12px;
  white-space:nowrap;
}

/* ============================================================
   ACTIVITIES
   ============================================================ */
.activities{
  padding:24px 32px 8px;
  display:grid;
  gap:22px;
}

.activity{
  border-left:3px solid var(--ocean-500);
  padding-left:20px;
}

.activity__title{
  font-family:var(--font-display);
  font-size:1.12rem;
  font-weight:600;
  margin:0 0 6px;
  display:flex;
  align-items:center;
  gap:8px;
  color:var(--basalt-800);
}

.activity__reason{
  margin:0 0 12px;
  color:var(--basalt-600);
}

.activity__details{
  display:grid;
  grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));
  gap:10px 24px;
  margin:0 0 12px;
}

.activity__details div{
  display:flex;
  flex-direction:column;
  gap:2px;
}

.activity__details dt{
  font-family:var(--font-mono);
  font-size:11px;
  letter-spacing:0.08em;
  text-transform:uppercase;
  color:var(--ocean-700);
  font-weight:700;
}

.activity__details dd{
  margin:0;
  font-size:14.5px;
  color:var(--basalt-800);
}

.activity__alt{
  margin:0;
  font-size:14px;
  background:var(--amber-100);
  border-radius:var(--radius-sm);
  padding:10px 14px;
  color:var(--basalt-800);
}

.activity__alt strong{ color:var(--amber-500); }

/* ============================================================
   RESTAURANT + WHY-TODAY
   ============================================================ */
.restaurant{
  margin:20px 32px 0;
  background:var(--sand-100);
  border-radius:var(--radius-md);
  padding:18px 22px;
}

.restaurant__title{
  font-family:var(--font-display);
  font-size:1.05rem;
  font-weight:600;
  margin:0 0 6px;
  color:var(--basalt-800);
}

.restaurant__reason{
  margin:0;
  font-size:14.5px;
  color:var(--basalt-600);
}

.day-card__why{
  margin:18px 32px 28px;
  font-size:14px;
  color:var(--basalt-600);
  padding-top:14px;
  border-top:1px dashed var(--sand-200);
}

.day-card__why strong{ color:var(--ocean-700); }

/* ============================================================
   TIPS / WIND ALTERNATIVES
   ============================================================ */
.tips{
  margin-top:8px;
  padding:36px 0 8px;
}

.tips__title{
  font-family:var(--font-display);
  font-size:1.7rem;
  font-weight:600;
  margin:0 0 24px;
  text-align:center;
}

.tips-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit, minmax(230px, 1fr));
  gap:18px;
}

.tips-card{
  background:var(--white);
  border:1px solid var(--sand-200);
  border-radius:var(--radius-md);
  padding:22px;
  box-shadow:var(--shadow-card);
}

.tips-card__title{
  font-family:var(--font-mono);
  font-size:12px;
  letter-spacing:0.08em;
  text-transform:uppercase;
  color:var(--ocean-700);
  font-weight:700;
  margin:0 0 12px;
  display:flex;
  align-items:center;
  gap:8px;
}

.tips-card ul{
  margin:0;
  padding-left:18px;
  color:var(--basalt-600);
  font-size:14.5px;
}

.tips-card li + li{ margin-top:6px; }

/* ============================================================
   PACKING LIST
   ============================================================ */
.packing{
  margin-top:18px;
  display:flex;
  flex-wrap:wrap;
  gap:10px;
}

.packing__item{
  font-size:13.5px;
  font-family:var(--font-mono);
  background:var(--ocean-100);
  color:var(--ocean-700);
  border-radius:999px;
  padding:6px 14px;
  border:1px solid var(--ocean-500);
}

/* ============================================================
   SUMMARY TABLE
   ============================================================ */
.summary{
  margin-top:56px;
}

.summary__title{
  font-family:var(--font-display);
  font-size:1.7rem;
  font-weight:600;
  margin:0 0 8px;
  text-align:center;
}

.summary__subtitle{
  text-align:center;
  color:var(--basalt-600);
  font-size:14.5px;
  margin:0 0 28px;
}

.summary-table-wrap{
  overflow-x:auto;
  border-radius:var(--radius-lg);
  box-shadow:var(--shadow-card);
  border:1px solid var(--sand-200);
}

.summary-table{
  width:100%;
  border-collapse:collapse;
  background:var(--white);
  font-size:14px;
  min-width:640px;
}

.summary-table caption{ display:none; }

.summary-table thead th{
  font-family:var(--font-mono);
  font-size:11.5px;
  letter-spacing:0.08em;
  text-transform:uppercase;
  color:var(--sand-50);
  background:var(--ocean-700);
  text-align:left;
  padding:14px 18px;
}

.summary-table tbody td{
  padding:14px 18px;
  border-bottom:1px solid var(--sand-200);
  vertical-align:top;
}

.summary-table tbody tr:last-child td{ border-bottom:none; }
.summary-table tbody tr:nth-child(even){ background:var(--sand-50); }

.summary-table td[data-label="data"]{
  font-family:var(--font-mono);
  font-weight:700;
  color:var(--ocean-700);
  white-space:nowrap;
}

.summary-table td[data-label="zona"]{
  font-family:var(--font-mono);
  font-size:12px;
  color:var(--amber-500);
  white-space:nowrap;
}

/* closing note */
.trip-footer{
  margin-top:48px;
  text-align:center;
  font-size:14px;
  color:var(--basalt-600);
  padding-top:24px;
  border-top:1px solid var(--sand-200);
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 620px){
  .trip{ padding:0 14px; }
  .trip-header{ padding:52px 0 36px; }
  .timeline{ padding-left:44px; }
  .timeline::before{ left:15px; }
  .day-card::before{
    left:-44px; width:34px; height:34px; font-size:12px; top:22px;
  }
  .day-card__header, .activities, .day-card__why{ padding-left:20px; padding-right:20px; }
  .restaurant{ margin-left:20px; margin-right:20px; }
  .day-card__title{ font-size:1.28rem; }
}

/* ============================================================
   REDUCED MOTION
   ============================================================ */
@media (prefers-reduced-motion: reduce){
  html{ scroll-behavior:auto; }
  .day-card{ transition:none; }
  .day-card:hover{ transform:none; }
}
