// ES module script to search the FDC API for a keyword and print item names
// Usage: node scripts/search_fdc.mjs milk

import fetch from 'node-fetch';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

const API_KEY = process.env.VITE_FDC_API_KEY;
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

if (!API_KEY || API_KEY === 'your_api_key_here') {
  console.error('Missing or invalid API key. Set VITE_FDC_API_KEY in your .env file.');
  process.exit(1);
}

const query = process.argv[2];
if (!query) {
  console.error('Usage: node scripts/search_fdc.mjs <keyword>');
  process.exit(1);
}

async function searchFoods(keyword, pageSize = 50) {
  const url = `${BASE_URL}/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(keyword)}&pageSize=${pageSize}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`FDC search failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.foods || [];
}

(async () => {
  try {
    const foods = await searchFoods(query);
    if (foods.length === 0) {
      console.log('No results found.');
      return;
    }
    console.log(`Results for "${query}":`);
    foods.forEach((food, i) => {
      console.log(`${i + 1}. ${food.description}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
