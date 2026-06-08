# Bookish Summer Soirée 2027 — Event HQ

Nicole-only event management app. Tracks finances, to-do list, inventory/packing, people, and event day info.

## Tabs

**Finances** — Ticket price calculator. Enter attendance numbers and it computes the per-ticket price live. Side-by-side estimated vs. actual expense tracking. T-shirt, hat, and tote size/qty tables. Misc budget tracker with purchase links.

**To-do** — Full task list with assignee, done/not done, search and filter by person or status. All 44 tasks from your 2027 spreadsheet are pre-loaded.

**Inventory** — Packing checklist organized by location (Nicole's, Alyssa's, Other). Check off items as you pack. Progress bar shows overall status.

**People** — Confirmed authors with status (confirmed / asked / maybe), admin team, helpers, and the future wish list with notes.

**Event day** — Full agenda, Getting to Know You author game questions, and the book signing seating chart (2026 layout — update for 2027 as authors confirm).

## Hosting (GitHub Pages)

1. Push this folder to a GitHub repo
2. Settings → Pages → Source: main branch, / (root)
3. Your app is live at `https://YOUR-USERNAME.github.io/REPO-NAME`

## Install on home screen

**iPhone:** Open in Safari → Share → Add to Home Screen
**Android:** Open in Chrome → ⋮ menu → Add to Home Screen

## Data storage

All data saves locally in your browser (localStorage). It is **not shared** — this is a single-user app for Nicole only. No Firebase or internet connection needed.

If you clear your browser cache, data resets. To back up: Settings → (future feature) Export JSON.

## Updating for 2028

When planning the next year:
1. Open the browser console (Safari: Develop → Show Web Inspector → Console)
2. Type: `localStorage.removeItem('soiree_hq_2027')` and press Enter
3. Reload the app — it will start fresh with the default template
4. Or: just edit `js/data.js` directly with the new year's numbers before deploying

## This app vs. the Prize Manager

These are two separate apps by design:
- **Soirée HQ** (this app) — Nicole only. Finances, planning, operations.
- **Soirée Prizes** (the other app) — Shared with your prize coordinator. Prize tracking only.

Both use the same Soirée logo icon on your home screen.
