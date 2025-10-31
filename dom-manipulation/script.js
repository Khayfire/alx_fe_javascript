// ---------- Simulate Server Sync ----------
async function fetchQuotesFromServer() {
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
  fetchQuotesFromServer();
}

// ---------- Periodic Sync ----------
setInterval(fetchQuotesFromServer, 15000); // every 15 seconds

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
  fetchQuotesFromServer();
}

init();
