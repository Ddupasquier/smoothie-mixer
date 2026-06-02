# smoothie-mixer

Mix and match ingredients for making well-balanced smoothies.

## Features

- 🔍 Search ingredients via the [FoodData Central API](https://fdc.nal.usda.gov/)
- 🧪 Live nutrition totals (calories, protein, carbs, fat, fiber, sugar)
- 🧊 Keep fridge, shopping list, mix progress, and goal settings in `localStorage`
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

To compare live FDC product data while debugging nutrient mappings:

```bash
npm run compare:fdc -- "sunflower oil" "2% milk"
npm run audit:fdc-vitals
```

---

## Project structure

```
src/
├── app.css                    # Global mobile-first styles
├── app.html                   # HTML shell
├── lib/
│   ├── components/
│   │   ├── IngredientCard.svelte
│   │   ├── IngredientSearch.svelte
│   │   ├── PointShape.svelte
│   │   └── NutritionPanel.svelte
│   ├── stores/
│   │   └── smoothie.svelte.ts # Active smoothie state + saved smoothies
│   ├── cache.ts               # localStorage TTL cache
│   └── utils/
│       ├── fdc.ts             # FoodData Central API client (cached)
│       ├── fdcNutrients.ts    # FDC nutrient ID/name fallbacks
│       ├── servingAmount.ts   # Weight/volume to grams conversion
│       └── types.ts           # Shared TypeScript types
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
