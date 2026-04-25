## Agents

This is a Chrome extension (Manifest V3) that extracts data from Google Sheets and generates CLI commands for the `spreadsheet-extractor` tool.

**Key files:** `content.js` (page scraping), `popup.js` (UI logic), `popup.html` (UI)

**Scope:** Only operates on `https://docs.google.com/spreadsheets/*`. No backend — all logic runs client-side.
