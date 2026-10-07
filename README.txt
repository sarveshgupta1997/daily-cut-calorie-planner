# Daily Cut

A simple, mobile-friendly weight-loss planner. Pick foods from a library, build your whole day by meal, and stay inside your calorie budget. It runs entirely in the browser, with no build step, no server and no account.

## Features

- **Calorie ring** showing planned calories against your daily target, with remaining (or over) calories
- **Protein progress** against your protein goal, plus deficit vs maintenance
- **Meals**: Breakfast, Lunch, Snacks and Dinner, each with quantity steppers (0.5 steps)
- **Food picker** with search and filters: Best, Good, High protein, Under 150 kcal
- **Food manager**: add, edit and delete foods with a form, or edit them all as JSON
- **Morning weight** logging and a **7-day history** of calories and weight
- **Backup**: export and import all your data as a JSON file
- **Dark mode**, and a layout that adapts from phone (bottom tab bar) to desktop
- Each day starts with a fresh plan; past days are kept for the history

## Getting started

1. Clone or download this repository.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).

That's it. To host it online, enable **GitHub Pages** on the repository (Settings, Pages, deploy from the `main` branch).

## Project structure

```
index.html   page layout and dialogs
style.css    styling, themes and responsive rules
app.js       app logic and rendering
data.js      default food database (FOOD_DATA)
```

## Managing your foods

A web page can't write to files on your computer, so edits made in the app are saved in your browser's `localStorage`. To make them permanent in the repo:

1. Go to **Settings, Download data.js**.
2. Replace `data.js` in your project folder with the downloaded file.
3. Commit the change.

You can also edit `data.js` by hand. Each food looks like this:

```js
{
  "id": "paneer",            // unique, no spaces
  "name": "Paneer",
  "category": "Protein/Dairy",
  "rating": "good",          // best | good | worst
  "quantity": "150 g",       // serving size shown in the app
  "calories": 420,           // kcal per serving
  "unit": "serving",
  "protein": 27,             // grams per serving
  "notes": "Calorie dense."
}
```

Calories and protein are per **one serving**. The quantity stepper in your plan multiplies them.

## Settings

Under **Settings** you can change:

| Setting | Default | Purpose |
| --- | --- | --- |
| Maintenance calories | 2,200 | Used to work out your daily deficit |
| Daily calorie target | 1,700 | The goal shown on the ring |
| Daily protein goal | 100 g | The goal shown on the protein bar |

The default maintenance figure is a rough estimate. Recalibrate it using your morning-weight trend over 2 to 3 weeks.

## Data and privacy

Everything stays in your browser. Nothing is sent anywhere. Use **Export backup** to save your data, and **Import backup** to restore it on another device or browser.

Clearing your browser data removes your saved plans, weights and food edits, and the app falls back to `data.js`.

## Disclaimer

Calorie and protein values are estimates. Oil, portion size and recipes change them a lot, especially for homemade and restaurant food. This tool is not medical advice. If you have a health condition, talk to a doctor or dietitian before changing your diet.

## License

Add a license of your choice, for example MIT, before publishing.