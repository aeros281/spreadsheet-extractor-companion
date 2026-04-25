// Content script: runs inside Google Sheets tab
// Extracts spreadsheet ID, gid, and selected range from the page

function getSheetInfo() {
  const url = window.location.href;

  // Extract spreadsheet ID from URL
  const spreadsheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = spreadsheetIdMatch ? spreadsheetIdMatch[1] : null;

  // Extract gid from URL
  const gidMatch = url.match(/[?&#]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  let selectedRange = null;

  // Try known Name Box selectors (these may break when Google updates Sheets)
  const nameBox =
    document.querySelector('input[aria-label="Cell/range reference"]') ||
    document.querySelector('input[aria-label="Name Box"]') ||
    document.querySelector('.cell-input') ||
    document.querySelector('[class*="name-box"] input') ||
    document.querySelector('#t-name-box input') ||
    document.querySelector('#t-name-box');

  if (nameBox && nameBox.value) {
    selectedRange = nameBox.value.trim();
  }

  // Fallback: scan all visible inputs for one whose value looks like a cell reference.
  // The Name Box always holds a value like "A1" or "B2:F50", which is distinctive enough
  // to identify it even when Google changes their class names.
  if (!selectedRange) {
    const cellRefPattern = /^[A-Z]+\d+(:[A-Z]+\d+)?$/;
    for (const input of document.querySelectorAll('input')) {
      const val = input.value ? input.value.trim().toUpperCase() : '';
      if (cellRefPattern.test(val)) {
        selectedRange = input.value.trim();
        break;
      }
    }
  }

  return {
    spreadsheetId,
    gid,
    selectedRange,
    url
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Registered!");
  if (request.action === 'getSheetInfo') {
    console.log("get sheet info");
    const info = getSheetInfo();
    sendResponse(info);
  }
  return true;
});
