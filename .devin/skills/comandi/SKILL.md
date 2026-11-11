---
name: comandi
description: Restituisce i comandi utili per il progetto MichaelUtilities (avvio server, git push, utente, struttura). Da elenco sintetico quando invocata con /comandi.
---

# Skill: comandi

Quando l'utente invoca `/comandi` (o chiede "dammi i comandi", "come avvio il server", "come pusho"), leggi il file `Commands/COMANDI.md` nella root del progetto e restituisci le informazioni come **elenco sintetico e diretto**, in questo formato:

## Output atteso (elenco a punti, niente preamboli)

**Avvio server locale (test app)**
- `cd "C:/Users/michael.moro/Desktop/PERSONAL_CHATGPT/MichaelUtilitiesApps"`
- `python -m http.server 5500`
- Apri http://localhost:5500 (homepage) o http://localhost:5500/itinerario_cracovia/index.html (app specifica)
- Ferma con `Ctrl+C`

**Git**
- Utente: `MichaelMoro`
- Remote: `https://github.com/MichaelMoro/MichaelUtilities.git` · branch `main`
- Commit+push:
  ```
  git add <file>
  git commit -m "messaggio"
  git push origin main
  ```
- Auth: serve **Personal Access Token** come password (non la password GitHub). Genera su https://github.com/settings/tokens (scope `repo`).
- Memorizza token: `git config --global credential.helper store`
- Se push rifiutato: `git pull --rebase origin main` poi `git push origin main`

**Struttura progetto**
- `index.html` — dashboard indice
- `Commands/COMANDI.md` — questo riferimento completo
- `itinerario_cracovia/`, `itinerario_fuerteventura/`, `team_generator/` — singole app

**Note**
- Stack: HTML/CSS/JS vanilla, niente build, niente `ng serve`.
- Per auto-reload: estensione Live Server di VS Code.

## Regole

- Sii **breve e diretto**: l'utente vuole il copia-incolla, non spiegazioni lunghe.
- Mostra i comandi come blocchi di codice copiabili.
- Se l'utente chiede solo una parte (es. "solo il push"), dai solo quella.
- Riferimento completo sempre disponibile in `Commands/COMANDI.md` — se serve dettaglio extra, leggi quel file.
