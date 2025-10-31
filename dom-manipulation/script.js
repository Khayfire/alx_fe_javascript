// ---------- Storage Keys ----------
const LOCAL_STORAGE_QUOTES_KEY = "dynamic_quote_generator_quotes_v3";
const LOCAL_STORAGE_CATEGORY_KEY = "dynamic_quote_generator_selected_category";
const SESSION_STORAGE_LAST_QUOTE = "dynamic_quote_generator_last_viewed_quote";

// ---------- Mock Server URL ----------
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// ---------- Default Quotes ----------
const defaultQuotes = [
  { id: 1, text: "The best way to predict the future is to create it.", category: "Motivation", updatedAt: Date.now() },
  { id: 2, text: "In the middle of every difficulty lies opportunity.", category: "Inspiration", updatedAt: Date.now() },
  { id: 3, text: "Do one thing every day that scares you.", category: "Courage", updatedAt: Date.now() },
  { id: 4, text: "Life is what happens when you're busy making other plans.", category: "Life", updatedAt: Date.now() },
];


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

// ---------- Send Local Quotes to Server ----------
async function postQuotesToServer(newQuotes) {
  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newQuotes),
    });

    if (response.ok) {
      showSyncMessage("☁️ Quotes successfully sent to server!", 3000, "#d1fae5");
    } else {
      showSyncMessage("⚠️ Failed to send quotes to server.", 3000, "#fee2e2");
    }
  } catch (error) {
    console.error("Error posting quotes:", error);
    showSyncMessage("⚠️ Network error during quote upload.", 3000, "#fee2e2");
  }
}


// ---------- Full Sync Function ----------
async function syncQuotes() {
  // Fetch latest quotes from the simulated server
  await fetchQuotesFromServer();

  // Send local quotes (non-server categories) to the server
  const unsyncedQuotes = quotes.filter(q => q.category !== "Server");
  if (unsyncedQuotes.length > 0) {
    await postQuotesToServer(unsyncedQuotes);
  }

  showSyncMessage("🔁 Quotes synchronized successfully!", 2500, "#d1fae5");
}


// ---------- Periodic Sync ----------
setInterval(fetchQuotesFromServer, 15000); // every 15 seconds

// Function to save quotes to local storage
function saveQuotesToLocalStorage() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

async function syncQuotes() {
  try {
    // Send local quotes to the server
    await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(quotes)
    });

    // Fetch latest quotes from server after sync
    const response = await fetchQuotesFromServer();
    localStorage.setItem("quotes", JSON.stringify(quotes));

    // ✅ Notify user that sync is complete
    alert("Quotes synced with server!");
  } catch (error) {
    console.error("Error syncing quotes:", error);
  }
}



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
