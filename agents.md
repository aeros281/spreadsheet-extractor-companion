## Agents

This is a Chrome extension (Manifest V3) that extracts data from Google Sheets and generates CLI commands for the `spreadsheet-extractor` tool.

**Key files:** `content.js` (page scraping), `popup.js` (UI logic), `popup.html` (UI)

**Scope:** Only operates on `https://docs.google.com/spreadsheets/*`. No backend — all logic runs client-side.

## Sync

**Last synced commit:** `e75080703a61b7677e470f7a78b7dd7adbbff118`

When asked to sync, run `git diff --name-only <last-synced-commit> HEAD` to find files changed since the last sync, read only those files, update this document accordingly, then update the commit hash above to the current `HEAD`.
