# Itinerario Cracovia — Mercatini di Natale

App interattiva per il viaggio a Cracovia dal **29 novembre al 1° dicembre**.
Contenuto basato sul `README.md` principale del repo (itinerario travel-planner).

## Struttura

```
itinerario_cracovia/
├── index.html   # App monopagina
├── style.css    # Tema chiaro + dark mode (palette natalizia: borgogna, oro, neve, abete)
├── script.js    # Filtri giorno, ricerca, dark mode, checklist
└── README.md    # Questo file
```

## Funzionalità

- **Itinerario giorno per giorno** (Dom 29 · Lun 30 · Mar 01) con slot mattina/pranzo/pomeriggio/cena
- **Filtro per giorno**: chip sticky in alto, mostra solo la giornata scelta
- **Ricerca live**: cerca piatti, luoghi, ristoranti con evidenziazione dei match
- **Sezione aeroportali**: andata/ritorno in treno + info biglietti (17 PLN / ~4€)
- **5 cibi imperdibili**: obwarzanek, żurek, pierogi, zapiekanka, grzane wino + oscypek
- **Checklist interattiva** con stato salvato su `localStorage` e contatore progressi
- **Dark mode** con persistenza + rispetto di `prefers-color-scheme`
- **Convertitore PLN ↔ EUR**: tasso personalizzabile e persistente, tap rapidi (17 PLN treno, 10/25/50/100), bottone swap
- **Link diretti via hash** (`index.html#day-30` apre direttamente lunedì)
- **Mobile-first**, ottimizzato touch, supporta `prefers-reduced-motion`

## Tech

HTML5, CSS3 (con `color-mix` e custom properties), Vanilla JS. Nessun framework, nessun build.

## Come aprirla

Apri `index.html` direttamente nel browser, oppure servila con un semplice server locale:

```bash
# dalla cartella itinerario_cracovia
python -m http.server 8000
# poi vai su http://localhost:8000
```
