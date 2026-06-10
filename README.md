# 🎮 My Videogames List

A simple, clean web app to track the games you're playing, finished, or planning to play — no backend, no installs, just open and go.

---

## Features

- **4 status tracks** — Backlog, Playing, Completed, Abandoned
- **Grid & list views** — toggle between card layout and table view
- **Search & filters** — by name, status, and platform
- **Rich game info** — platform, personal rating (1–10), start/end dates, comments
- **Cover images** — paste a URL or upload a file from your computer
- **Persistent** — data saved in LocalStorage, no account needed

## Tech Stack

- Vanilla HTML, CSS & JavaScript — zero dependencies
- LocalStorage for data persistence
- Structured to be easy to migrate to a backend later

## Getting Started

No install needed. Just clone and open:

```bash
git clone https://github.com/diegogovea/videogamesList.git
cd videogamesList
open index.html
```

## Project Structure

```
videogamesList/
├── index.html   # App structure and modals
├── style.css    # Dark theme (Steam/PlayStation inspired)
├── data.js      # LocalStorage CRUD layer
└── app.js       # UI logic: views, filters, search, forms
```

## License

MIT
