# Itinerario Cracovia — Hallmark Dispatch

App monopagina per il viaggio a Cracovia **29 nov – 1 dic** (mercatini di Natale).
Contenuto basato sul `README.md` principale del repo.
Design in stile **Hallmark / editoriale**: off-white caldo, rosso master,
verde abete, accenti oro; Playfair Display + JetBrains Mono; angoli vivi,
blocchi di colore pieni. Mobile-first.

## Struttura

```
itinerario_cracovia/
├── index.html   # App monopagina (masthead, airport, converter, itinerario, cibi)
├── style.css    # Tema Hallmark + dark mode (fango/cemento caldi)
├── script.js    # Tema, filtri giorno, ricerca, convertitore PLN/EUR
└── README.md    # Questo file
```

## Funzionalità

- **Masthead editoriale**: titolo Playfair 800, eyebrow mono, lede italica
- **Trasferimenti aeroportuali**: andata/ritorno in treno + box biglietto (17 PLN / ~4€)
- **Convertitore PLN ↔ EUR**: tasso fisso a 4,41 PLN per 1 €, conversione live bidirezionale, swap
- **Itinerario giorno per giorno** (29/30/01) con slot mattina/pranzo/pomeriggio/cena
- **Filtro per giorno**: chip sticky, evidenziazione giorno attivo
- **Ricerca live** con evidenziazione dei match
- **5 cibi imperdibili**: obwarzanek, żurek, pierogi, zapiekanka, grzane wino + oscypek
- **Dark mode** con persistenza + rispetto di `prefers-color-scheme`
- **Link diretti via hash** (`index.html#day-30`)
- **Mobile-first**, touch-friendly, `prefers-reduced-motion`

## Come avviarlo

```bash
cd itinerario_cracovia
python -m http.server 5500
# apri http://localhost:5500
```

## Tech

HTML5, CSS3 (custom properties), Vanilla JS. Nessun framework, nessun build.
Font: Google Fonts (Playfair Display, JetBrains Mono).
