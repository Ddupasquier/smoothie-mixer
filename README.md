# smoothie-mixer

Mix and match ingredients for making well-balanced smoothies.

## Features

- 🔍 Search ingredients via the [FoodData Central API](https://fdc.nal.usda.gov/)
- 🧪 Live nutrition totals (calories, protein, carbs, fat, fiber, sugar)
- 💾 Save & load smoothies (stored in `localStorage` — no database needed)
- 📱 Mobile-first responsive UI
- 🚦 Rate-limit friendly: search results cached for 24 hours in `localStorage`

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure your API key

Copy the example env file and add your free [FDC API key](https://fdc.nal.usda.gov/api-guide.html):

```bash
cp .env.example .env
# then edit .env and replace "your_api_key_here"
```

> Your `.env` is listed in `.gitignore` — it will never be committed.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Watch-mode tests |
| `npm run check` | TypeScript + Svelte type-check |

---

## Running tests

```bash
npm test
```

Tests run entirely offline using mocked fetch — no API key required.

To run the **live integration test** against the real FDC API (verifies your key works):

```bash
# Ensure VITE_FDC_API_KEY is set in your .env, then:
npx vitest run src/lib/api/fdc.test.ts --reporter=verbose
```

---

## Project structure

```
src/
├── app.css                    # Global mobile-first styles
├── app.html                   # HTML shell
├── lib/
│   ├── api/
│   │   └── fdc.ts             # FoodData Central API client (cached)
│   ├── components/
│   │   ├── IngredientCard.svelte
│   │   ├── IngredientSearch.svelte
│   │   └── NutritionPanel.svelte
│   ├── stores/
│   │   └── smoothie.svelte.ts # Active smoothie state + saved smoothies
│   ├── cache.ts               # localStorage TTL cache
│   └── types.ts               # Shared TypeScript types
└── routes/
    ├── +layout.svelte
    └── +page.svelte           # Main smoothie builder UI
```

---

## API rate limits

The FDC API allows **3,600 requests/hour** with a free API key. This app mitigates usage by:

- Debouncing search input (500 ms)
- Caching every search result and food detail for **24 hours** in `localStorage`
- Only fetching from the API when the cache doesn't have a fresh result
