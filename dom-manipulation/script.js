// script.js

// ---------- Constants for storage keys ----------
const LOCAL_STORAGE_KEY = "dynamic_quote_generator_quotes_v1";
const SESSION_STORAGE_LAST_QUOTE = "dynamic_quote_generator_last_viewed_quote";

// ---------- Initial default quotes (used only if nothing in localStorage) ----------
const defaultQuotes = [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "In the middle of every difficulty lies opportunity.", category: "Inspiration" },
  { text: "Do one thing every day that scares you.", category: "Courage" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
];

// ---------- App state ----------
let quotes = [];

// ---------- DOM references ----------
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const newQuoteTextInput = document.getElementById("newQuoteText");
const newQuoteCategoryInput = document.getElementById("newQuoteCategory");
const importFileInput = document.getElementById("importFile");
const exportBtn = document.getElementById("exportBtn");
const clearStorageBtn = document.getElementById("clearStorage");
const importBtn = document.getElementById("importBtn");

// ---------- Helper: Save quotes array to localStorage ----------
function saveQuotesToLocalStorage() {
  try {
    const json = JSON.stringify(quotes);
    localStorage.setItem(LOCAL_STORAGE_KEY, json);
  } catch (e) {
    console.error("Failed to save quotes to localStorage:", e);
  }
}

// ---------- Helper: Load quotes from localStorage ----------
function loadQuotesFromLocalStorage() {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      quotes = [...defaultQuotes];
      saveQuotesToLocalStorage();
      return;
    }
    const parsed = JSON.parse(stored);
    // Validate structure (simple validation)
    if (!Array.isArray(parsed)) throw new Error("Stored quotes is not an array");
    quotes = parsed.filter(q => q && typeof q.text === "string" && typeof q.category === "string");
  } catch (e) {
    console.warn("Failed to load/parse quotes from localStorage — resetting to defaults.", e);
    quotes = [...defaultQuotes];
    saveQuotesToLocalStorage();
  }
}

// ---------- Show a random quote and record it in sessionStorage ----------
function showRandomQuote() {
  if (quotes.length === 0) {
    quoteDisplay.innerHTML = "<em>No quotes available. Add or import some!</em>";
    sessionStorage.removeItem(SESSION_STORAGE_LAST_QUOTE);
    return;
  }

  const idx = Math.floor(Math.random() * quotes.length);
  const q = quotes[idx];

  // Build display
  quoteDisplay.innerHTML = ""; // clear
  const quoteText = document.createElement("p");
  quoteText.textContent = `"${q.text}"`;
  quoteText.style.fontSize = "1.1rem";
  quoteText.style.margin = "0";

  const meta = document.createElement("small");
  meta.textContent = `Category: ${q.category} — (index ${idx})`;

  quoteDisplay.appendChild(quoteText);
  quoteDisplay.appendChild(meta);

  // Store last viewed in sessionStorage (session-only)
  try {
    sessionStorage.setItem(SESSION_STORAGE_LAST_QUOTE, JSON.stringify({ index: idx, quote: q }));
  } catch (e) {
    console.warn("Failed to write sessionStorage:", e);
  }
}

// ---------- Add a new quote from inputs ----------
function addQuote() {
  const text = newQuoteTextInput.value.trim();
  const category = newQuoteCategoryInput.value.trim();

  if (!text || !category) {
    alert("Please enter both quote text and a category.");
    return;
  }

  const newQuoteObj = { text, category };
  quotes.push(newQuoteObj);

  // Persist to localStorage
  saveQuotesToLocalStorage();

  // Clear UI inputs and give feedback
  newQuoteTextInput.value = "";
  newQuoteCategoryInput.value = "";
  quoteDisplay.textContent = `New quote added to category "${category}".`;

  // Optionally show the added quote immediately
  setTimeout(() => {
    // show the quote we just added (last index)
    const idx = quotes.length - 1;
    const q = quotes[idx];
    quoteDisplay.innerHTML = `"${q.text}"\n\n— Category: ${q.category}`;
    // record in sessionStorage
    try { sessionStorage.setItem(SESSION_STORAGE_LAST_QUOTE, JSON.stringify({ index: idx, quote: q })); } catch (e) {}
  }, 350);
}

// ---------- Export quotes as JSON file ----------
function exportQuotesToJson() {
  try {
    const dataStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const now = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `quotes-export-${now}.json`;
    document.body.appendChild(a); // required for Firefox in some cases
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Failed to export quotes:", e);
    alert("Export failed. See console for details.");
  }
}

// ---------- Import quotes from JSON file input ----------
function importFromJsonFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (!Array.isArray(parsed)) {
        alert("Imported JSON must be an array of quote objects.");
        return;
      }

      // Validate objects and map
      const validEntries = parsed
        .filter(item => item && typeof item.text === "string" && typeof item.category === "string")
        .map(item => ({ text: item.text.trim(), category: item.category.trim() }));

      if (validEntries.length === 0) {
        alert("No valid quote objects found in file.");
        return;
      }

      // Merge in (avoid duplicates simply by text+category check)
      let added = 0;
      validEntries.forEach(entry => {
        const exists = quotes.some(q => q.text === entry.text && q.category === entry.category);
        if (!exists) {
          quotes.push(entry);
          added++;
        }
      });

      saveQuotesToLocalStorage();
      alert(`Imported ${added} new quote(s). ${validEntries.length - added} duplicates were skipped.`);
    } catch (err) {
      console.error("Failed to parse imported JSON:", err);
      alert("Failed to import JSON file — invalid JSON or structure.");
    } finally {
      // Clear the file input so same file can be chosen again if needed
      importFileInput.value = "";
    }
  };

  reader.onerror = function () {
    alert("Error reading file.");
    importFileInput.value = "";
  };

  reader.readAsText(file);
}

// ---------- Clear saved quotes in localStorage (with confirmation) ----------
function clearSavedQuotes() {
  if (!confirm("This will remove all saved quotes and reset to default quotes. Continue?")) return;
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  loadQuotesFromLocalStorage();
  quoteDisplay.textContent = "Saved quotes cleared. Defaults restored.";
  sessionStorage.removeItem(SESSION_STORAGE_LAST_QUOTE);
}

// ---------- Initialization ----------
function init() {
  loadQuotesFromLocalStorage();

  // Attach event listeners
  newQuoteBtn.addEventListener("click", showRandomQuote);
  addQuoteBtn.addEventListener("click", addQuote);
  exportBtn.addEventListener("click", exportQuotesToJson);
  importFileInput.addEventListener("change", importFromJsonFile);
  clearStorageBtn.addEventListener("click", clearSavedQuotes);
  // import button merely triggers the hidden file input
  importBtn.addEventListener("click", () => importFileInput.click());

  // If there's a last viewed quote in sessionStorage, show it (session-only)
  try {
    const lastViewedRaw = sessionStorage.getItem(SESSION_STORAGE_LAST_QUOTE);
    if (lastViewedRaw) {
      const last = JSON.parse(lastViewedRaw);
      if (last && last.quote && typeof last.quote.text === "string") {
        quoteDisplay.innerHTML = `"${last.quote.text}"<br><small>Category: ${last.quote.category} (from this session)</small>`;
        return;
      }
    }
  } catch (e) {
    console.warn("Could not read last viewed from sessionStorage:", e);
  }

  // Fallback: show a random quote from loaded quotes
  showRandomQuote();
}

// run
init();
