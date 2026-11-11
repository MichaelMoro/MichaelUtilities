# Comandi utili — MichaelUtilities

Riferimento rapido per lavorare su questo progetto. La skill `/comandi` restituisce queste informazioni a elenco.

## Avviare il server locale (per testare le app)

Le app sono HTML/CSS/JS vanilla — niente build, niente `ng serve`. Basta un server statico.

```bash
cd "C:/Users/michael.moro/Desktop/PERSONAL_CHATGPT/MichaelUtilitiesApps"
python -m http.server 5500
```

Poi apri nel browser:
- Homepage dashboard: http://localhost:5500
- Itinerario Cracovia: http://localhost:5500/itinerario_cracovia/index.html
- Itinerario Fuerteventura: http://localhost:5500/itinerario_fuerteventura/itinerario.html
- Team Generator: http://localhost:5500/team_generator/team_generator.html

Per fermare il server: `Ctrl+C` nel terminale.

> Alternativa: estensione **Live Server** di VS Code (tasto destro su un `.html` → "Open with Live Server"), fa auto-reload ad ogni salvataggio.

## Git

- **Utente git**: `MichaelMoro`
- **Remote**: `https://github.com/MichaelMoro/MichaelUtilities.git`
- **Branch default**: `main`

### Workflow commit + push

```bash
cd "C:/Users/michael.moro/Desktop/PERSONAL_CHATGPT/MichaelUtilitiesApps"
git status                       # vedi cosa è cambiato
git add <file o cartella>         # es: git add itinerario_cracovia/
git commit -m "messaggio descrittivo"
git push origin main
```

### Autenticazione (importante)

GitHub **non accetta più la password** via HTTPS. Usa un **Personal Access Token (PAT)**:
1. Vai su https://github.com/settings/tokens → "Generate new token (classic)" → spunta `repo` → copia il token
2. Quando il push chiede la password, **incolla il token** (non la password GitHub)
3. Per memorizzarlo e non ridigitarlo ogni volta:
   ```bash
   git config --global credential.helper store
   ```
   (salva il token in chiaro su disco — ok su macchina personale)

### Se il push viene rifiutato (origine andata avanti)

```bash
git pull --rebase origin main
git push origin main
```

### Passare a SSH (alternativa al token)

Se hai una chiave SSH configurata su GitHub:
```bash
git remote set-url origin git@github.com:MichaelMoro/MichaelUtilities.git
git push origin main
```

## Struttura del progetto

```
MichaelUtilitiesApps/
├── index.html                       # Homepage dashboard (linka le app)
├── README.md                        # Itinerario Cracovia (contenuto)
├── Commands/
│   └── COMANDI.md                    # Questo file
├── itinerario_cracovia/              # App Cracovia (HTML/CSS/JS vanilla)
├── itinerario_fuerteventura/         # App Fuerteventura
└── team_generator/                  # App Team Generator
```

## Convenzioni tecniche

- **Stack**: HTML5, CSS3 (custom properties), Vanilla JS. Niente framework, niente build.
- **Font**: Google Fonts via `<link>` (Playfair Display, JetBrains Mono, ecc.).
- **Dark mode**: via `body.dark` + CSS variables, persistenza in `localStorage`.
- **Stile**: ogni app ha il suo tema, ma la homepage fa da indice comune.
