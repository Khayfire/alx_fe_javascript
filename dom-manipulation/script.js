// script.js

// ---------- Storage Keys ----------
const LOCAL_STORAGE_QUOTES_KEY = "dynamic_quote_generator_quotes_v2";
const LOCAL_STORAGE_CATEGORY_KEY = "dynamic_quote_generator_selected_category";
const SESSION_STORAGE_LAST_QUOTE = "dynamic_quote_generator_last_viewed_quote";

// ---------- Default Quotes ----------
const defaultQuotes = [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "In the middle of every difficulty lies opportunity.", category: "Inspiration" },
  { text: "Do one thing every day that scares you.", category: "Courage" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
];

// ---------- App State ----------
let quotes = [];

// ---------- DOM Elements ----------
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const newQuoteText = document.getElementById("newQuoteText");
const newQuoteCategory = document.getElementById("newQuoteCategory");
const categoryFilter = document.getElementById("categoryFilter");
const importFileInput = document.getElementById("importFile");
const importBtn = document.getElementById("importBtn");
const exportBtn = document.getElementById("exportBtn");
const clearStorageBtn = document.getElementById("clearStorage");

// ---------- Helper: Save Quotes ----------
function saveQuotes() {
  localStorage.setItem(LOCAL_STORAGE_QUOTES_KEY, JSON.stringify(quotes));
}

// ---------- Helper: Load Quotes ----------
function loadQuotes() {
  const stored = localStorage.getItem(LOCAL_STORAGE_QUOTES_KEY);
  quotes = stored ? JSON.parse(stored) : [...defaultQuotes];
  saveQuotes();
}

// ---------- Populate Category Dropdown ----------
function populateCategories() {
  // Clear existing options except 'All'
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  const categories = [...new Set(quotes.map(q => q.category))];
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  // Restore last selected category (if any)
  const savedCategory = localStorage.getItem(LOCAL_STORAGE_CATEGORY_KEY);
  if (savedCategory && categoryFilter.querySelector(`option[value="${savedCategory}"]`)) {
    categoryFilter.value = savedCategory;
  }
}

// ---------- Filter Quotes Based on Selected Category ----------
function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  localStorage.setItem(LOCAL_STORAGE_CATEGORY_KEY, selectedCategory);
  showRandomQuote(selectedCategory);
}

// ---------- Show Random Quote ----------
function showRandomQuote(filterCategory = "all") {
  const filtered =
    filterCategory === "all"
      ? quotes
      : quotes.filter(q => q.category === filterCategory);

  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const quote = filtered[randomIndex];
  quoteDisplay.innerHTML = `"${quote.text}"<br><small>Category: ${quote.category}</small>`;

  sessionStorage.setItem(SESSION_STORAGE_LAST_QUOTE, JSON.stringify(quote));
}

// ---------- Add New Quote ----------
function addQuote() {
  const text = newQuoteText.value.trim();
  const category = newQuoteCategory.value.trim();

  if (!text || !category) {
    alert("Please enter both quote and category!");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  newQuoteText.value = "";
  newQuoteCategory.value = "";
  populateCategories(); // ✅ Update dropdown dynamically
  quoteDisplay.textContent = `New quote added to "${category}"!`;
}

// ---------- Export Quotes as JSON ----------
function exportQuotes() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Import Quotes from JSON ----------
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const imported = JSON.parse(e.target.result);
    quotes.push(...imported);
    saveQuotes();
    populateCategories();
    alert("Quotes imported successfully!");
  };
  reader.readAsText(file);
}

// ---------- Clear Storage ----------
function clearSavedQuotes() {
  if (confirm("This will clear all saved quotes and filters. Continue?")) {
    localStorage.removeItem(LOCAL_STORAGE_QUOTES_KEY);
    localStorage.removeItem(LOCAL_STORAGE_CATEGORY_KEY);
    quotes = [...defaultQuotes];
    saveQuotes();
    populateCategories();
    quoteDisplay.textContent = "Storage cleared. Defaults restored.";
  }
}

// ---------- Initialization ----------
function init() {
  loadQuotes();
  populateCategories();

  // Restore last category filter if exists
  const savedCategory = localStorage.getItem(LOCAL_STORAGE_CATEGORY_KEY) || "all";
  categoryFilter.value = savedCategory;
  showRandomQuote(savedCategory);

  newQuoteBtn.addEventListener("click", () => filterQuotes());
  addQuoteBtn.addEventListener("click", addQuote);
  exportBtn.addEventListener("click", exportQuotes);
  importFileInput.addEventListener("change", importFromJsonFile);
  importBtn.addEventListener("click", () => importFileInput.click());
  clearStorageBtn.addEventListener("click", clearSavedQuotes);
}

init();
