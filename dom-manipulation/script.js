// script.js

// ---------- Storage Keys ----------
const LOCAL_STORAGE_QUOTES_KEY = "dynamic_quote_generator_quotes_v3";
const LOCAL_STORAGE_CATEGORY_KEY = "dynamic_quote_generator_selected_category";
const SESSION_STORAGE_LAST_QUOTE = "dynamic_quote_generator_last_viewed_quote";

// ---------- Mock Server URL ----------
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // simulation endpoint

// ---------- Default Quotes ----------
const defaultQuotes = [
  { id: 1, text: "The best way to predict the future is to create it.", category: "Motivation", updatedAt: Date.now() },
  { id: 2, text: "In the middle of every difficulty lies opportunity.", category: "Inspiration", updatedAt: Date.now() },
  { id: 3, text: "Do one thing every day that scares you.", category: "Courage", updatedAt: Date.now() },
  { id: 4, text: "Life is what happens when you're busy making other plans.", category: "Life", updatedAt: Date.now() },
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
const syncNowBtn = document.getElementById("syncNow");
const syncStatus = document.getElementById("syncStatus");

// ---------- Load & Save ----------
function saveQuotes() {
  localStorage.setItem(LOCAL_STORAGE_QUOTES_KEY, JSON.stringify(quotes));
}

function loadQuotes() {
  const stored = localStorage.getItem(LOCAL_STORAGE_QUOTES_KEY);
  quotes = stored ? JSON.parse(stored) : [...defaultQuotes];
  saveQuotes();
}

// ---------- UI Feedback ----------
function showSyncMessage(message, duration = 3000, color = "#e0e7ff") {
  syncStatus.textContent = message;
  syncStatus.style.background = color;
  syncStatus.style.display = "block";
  setTimeout(() => (syncStatus.style.display = "none"), duration);
}

// ---------- Populate Category Dropdown ----------
function populateCategories() {
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  const categories = [...new Set(quotes.map(q => q.category))];
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const savedCategory = localStorage.getItem(LOCAL_STORAGE_CATEGORY_KEY);
  if (savedCategory && categoryFilter.querySelector(`option[value="${savedCategory}"]`)) {
    categoryFilter.value = savedCategory;
  }
}

// ---------- Filter & Display ----------
function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  localStorage.setItem(LOCAL_STORAGE_CATEGORY_KEY, selectedCategory);
  showRandomQuote(selectedCategory);
}

function showRandomQuote(filterCategory = "all") {
  const filtered = filterCategory === "all"
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

  const newQuote = {
    id: Date.now(),
    text,
    category,
    updatedAt: Date.now(),
  };

  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  showSyncMessage(`New quote added to "${category}"`, 2000, "#d1fae5");
  newQuoteText.value = "";
  newQuoteCategory.value = "";
}

// ---------- Simulate Server Sync ----------
async function fetchFromServer() {
  try {
    const res = await fetch(SERVER_URL);
    const serverData = await res.json();

    // Simulate server quotes based on fetched data
    const serverQuotes = serverData.slice(0, 5).map(post => ({
      id: post.id,
      text: post.title,
      category: "Server",
      updatedAt: Date.now(),
    }));

    handleConflicts(serverQuotes);
  } catch (error) {
    console.error("Server fetch failed:", error);
    showSyncMessage("⚠️ Failed to sync with server", 4000, "#fee2e2");
  }
}

// ---------- Conflict Resolution ----------
function handleConflicts(serverQuotes) {
  let updated = false;

  serverQuotes.forEach(serverQuote => {
    const localQuote = quotes.find(q => q.id === serverQuote.id);

    if (!localQuote) {
      quotes.push(serverQuote);
      updated = true;
    } else if (serverQuote.updatedAt > localQuote.updatedAt) {
      // Server takes precedence
      Object.assign(localQuote, serverQuote);
      updated = true;
    }
  });

  if (updated) {
    saveQuotes();
    populateCategories();
    showSyncMessage("🔄 Data synced with server (server took precedence)", 3500, "#bfdbfe");
  } else {
    showSyncMessage("✅ Local data is up-to-date with server", 2500, "#d1fae5");
  }
}

// ---------- Manual Sync ----------
function syncNow() {
  fetchFromServer();
}

// ---------- Periodic Sync ----------
setInterval(fetchFromServer, 15000); // every 15 seconds

// ---------- Initialization ----------
function init() {
  loadQuotes();
  populateCategories();

  const savedCategory = localStorage.getItem(LOCAL_STORAGE_CATEGORY_KEY) || "all";
  categoryFilter.value = savedCategory;
  showRandomQuote(savedCategory);

  newQuoteBtn.addEventListener("click", () => filterQuotes());
  addQuoteBtn.addEventListener("click", addQuote);
  exportBtn.addEventListener("click", exportQuotes);
  importFileInput.addEventListener("change", importFromJsonFile);
  importBtn.addEventListener("click", () => importFileInput.click());
  clearStorageBtn.addEventListener("click", clearSavedQuotes);
  syncNowBtn.addEventListener("click", syncNow);

  // Initial server sync
  fetchFromServer();
}

init();
