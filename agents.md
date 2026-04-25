## Agents

This is a Chrome extension (Manifest V3) that extracts data from Google Sheets and generates CLI commands for the `spreadsheet-extractor` tool.

**Key files:** `content.js` (page scraping), `popup.js` (UI logic), `popup.html` (UI)

**Scope:** Only operates on `https://docs.google.com/spreadsheets/*`. No backend — all logic runs client-side.

### popup.js

Manages state: `{ spreadsheetId, gid, range, columns[] }` where each column has `{ letter, name, repeat, include }`.

On load, queries the active tab URL to extract `spreadsheetId` and `gid`, then messages the content script (`getSheetInfo`) to get the selected range. If the content script is unavailable, falls back to a manual range input.

Builds a CLI command of the form:
```
spreadsheet-extractor fetch-sheet <id> <gid> <range> [--headers "B:Name,..."] [--repeat-columns B,C]
```
Only columns with `include=true` and a non-empty `name` appear in `--headers`. Columns with `repeat=true` appear in `--repeat-columns`. Column config is preserved by letter when the range is changed.

### Build / CI

`.github/workflows/build.yml` — runs on push to `master`/`main` or manual trigger. Reads version from `manifest.json`, zips `manifest.json`, `popup.html`, `popup.js`, `content.js`, and `icons/` into `spreadsheet-extractor-v<version>.zip`, and uploads it as a GitHub Actions artifact (retained 90 days).

## Sync

**Last synced commit:** `8396b0bc9d61c45b298795b7910744ee491e4762`

When asked to sync, run `git diff --name-only <last-synced-commit> HEAD` to find files changed since the last sync, read only those files, update this document accordingly, then update the commit hash above to the current `HEAD`.
