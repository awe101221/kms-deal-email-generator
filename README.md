# KMS Deal Email Generator

React app that generates **KMS.deals** branded wholesale deal emails from CSV product data.

## What it does

1. **Upload CSV** — Paste or upload a CSV file containing product data (brand, title, category, MSRP, cost, quantity, status, image URL, match tags)
2. **Review & Edit** — Preview parsed products in a table, edit individual fields before generating
3. **Configure Email** — Set recipient categories, date, and choose how many featured cards vs. list items
4. **Generate HTML** — Outputs a fully formatted, email-client-compatible HTML email following the KMS.deals brand template
5. **Copy & Send** — Copy the raw HTML to clipboard for pasting into your email platform

## CSV Format

| Column | Description | Example |
|--------|-------------|---------|
| brand | Brand name | Enbrighten |
| title | Product title | Flameless LED Candles, 3-Pack w/ Remote |
| category | Product category | Lighting |
| msrp | Retail price | 24.99 |
| cost | Wholesale cost | 8.50 |
| qty | Available quantity | 2400 |
| status | Stock status | In Stock / Network |
| image_url | Product image URL | https://example.com/img.jpg |
| match_tags | Match reason tags (comma-separated) | lighting, seasonal decor, retail-ready |

## Brand System

Follows the KMS.deals email design system:
- **Colors:** Navy (#1B2A4A), Brand Blue (#2B7DE9), semantic status colors
- **Typography:** Inter (UI) + JetBrains Mono (data values)
- **Layout:** 580px max-width, table-based for Outlook compatibility
- **Tone:** Zero salesmanship — data-driven, matter-of-fact, no urgency language

## Quick Start

```bash
npm install
npm start
```

Opens at `http://localhost:3000`. Upload your CSV and generate emails.

## Tech Stack

- React 18
- PapaParse (CSV parsing)
- Single-file component (`src/KmsDealEmailGenerator.jsx`)

## License

Private — KMS, LLC
