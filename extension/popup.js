const API_URL = 'https://katalyst-fybi.onrender.com/api/resources';
const AUTH_URL = 'https://katalyst-fybi.onrender.com/api/auth/me';

let allResources = [];
let currentToken  = null;   // Google access token for this session

// ── Auth helpers ─────────────────────────────────────────────────────────────

/** Wrapper around fetch() that always injects the Bearer token. */
async function authFetch(url, options = {}) {
  if (!currentToken) throw new Error('Not authenticated');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${currentToken}`,
    },
  });
}

/** Get a Google access token. interactive=false = silent (no popup). */
function getGoogleToken(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(chrome.runtime.lastError || new Error('No token'));
      } else {
        resolve(token);
      }
    });
  });
}

/** Remove cached token and clear session state. */
function revokeToken(token) {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, resolve);
  });
}

/** Show the main app UI and populate the user chip. */
function showAppUI(user) {
  document.getElementById('loginScreen').style.display  = 'none';
  document.getElementById('appContent').style.display   = 'block';
  document.getElementById('openWebBtn').style.display   = 'flex';
  document.getElementById('userChip').style.display     = 'flex';

  const avatar = document.getElementById('userAvatar');
  const nameEl = document.getElementById('userName');
  if (user.picture) {
    avatar.src = user.picture;
    avatar.style.display = 'block';
  } else {
    avatar.style.display = 'none';
  }
  nameEl.textContent = user.name || user.email || 'User';
}

/** Show the login screen and hide everything else. */
function showLoginUI() {
  document.getElementById('loginScreen').style.display  = 'flex';
  document.getElementById('appContent').style.display   = 'none';
  document.getElementById('openWebBtn').style.display   = 'none';
  document.getElementById('userChip').style.display     = 'none';
  document.getElementById('loginError').style.display   = 'none';
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  showLoginUI(); // default: hide app until auth confirmed

  try {
    // Try silent sign-in first (no popup if already authorised)
    const token = await getGoogleToken(false);
    currentToken = token;

    // Verify token & get user profile
    const meRes = await authFetch(AUTH_URL);
    if (!meRes.ok) throw new Error('Token rejected by server');
    const user = await meRes.json();

    showAppUI(user);
    initTabs();
    autoCaptureCurrentTab();
    fetchResources();
    setupEventListeners();
  } catch (_) {
    // Not signed in yet — show login screen
    showLoginUI();
    setupAuthListeners();
  }
});

/** Wire up Google sign-in and sign-out buttons. */
function setupAuthListeners() {
  document.getElementById('googleSignInBtn').addEventListener('click', async () => {
    const errEl = document.getElementById('loginError');
    errEl.style.display = 'none';
    try {
      const token = await getGoogleToken(true); // interactive = show popup
      currentToken = token;

      const meRes = await authFetch(AUTH_URL);
      if (!meRes.ok) throw new Error('Token rejected');
      const user = await meRes.json();

      showAppUI(user);
      initTabs();
      autoCaptureCurrentTab();
      fetchResources();
      setupEventListeners();
    } catch (err) {
      errEl.style.display = 'block';
    }
  });
}

// Tab switching
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });
}

// Auto-capture current browser tab
function autoCaptureCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      const activeTab = tabs[0];
      const urlInput = document.getElementById('resUrl');
      const titleInput = document.getElementById('resTitle');

      if (activeTab.url && !activeTab.url.startsWith('chrome://') && !activeTab.url.startsWith('chrome-extension://')) {
        urlInput.value = activeTab.url;
        titleInput.value = activeTab.title || '';

        checkYouTubeUrl(activeTab.url);

        // Auto-suggest description from page content
        autoSuggestDescription(activeTab.id);
      }
    }
  });
}

// Toggle YouTube timestamp input visibility
function checkYouTubeUrl(url) {
  const tsGroup = document.getElementById('timestampGroup');
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    tsGroup.style.display = 'block';
  } else {
    tsGroup.style.display = 'none';
  }
}

document.getElementById('resUrl').addEventListener('input', (e) => {
  checkYouTubeUrl(e.target.value);
});

// Grab timestamp from live YouTube tab
document.getElementById('grabTimeBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'GET_YOUTUBE_TIMESTAMP' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.timestamp) {
          // Fallback script injection if content script wasn't pre-loaded
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              const v = document.querySelector('video');
              if (v && !isNaN(v.currentTime)) {
                const s = Math.floor(v.currentTime);
                const m = Math.floor(s / 60);
                const sec = s % 60;
                return `${m}:${sec < 10 ? '0' : ''}${sec}`;
              }
              return null;
            }
          }, (results) => {
            if (results && results[0] && results[0].result) {
              document.getElementById('resTimestamp').value = results[0].result;
              showToast(`Grabbed timestamp ${results[0].result}`);
            } else {
              showToast('No video playing on tab', true);
            }
          });
        } else {
          document.getElementById('resTimestamp').value = response.timestamp;
          showToast(`Grabbed timestamp ${response.timestamp}`);
        }
      });
    }
  });
});

// Setup event listeners
function setupEventListeners() {
  // Form submission
  document.getElementById('addResourceForm').addEventListener('submit', handleAddResource);

  // Search & Filter
  document.getElementById('searchInput').addEventListener('input', filterAndRenderList);
  document.getElementById('filterCategory').addEventListener('change', filterAndRenderList);

  // Open Web App
  document.getElementById('openWebBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://katalyst-app.netlify.app' });
  });

  // Sign out
  document.getElementById('signOutBtn').addEventListener('click', async () => {
    if (currentToken) await revokeToken(currentToken);
    currentToken = null;
    allResources = [];
    showLoginUI();
    setupAuthListeners();
    showToast('Signed out');
  });

  // Suggest Description button
  document.getElementById('suggestDescBtn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        autoSuggestDescription(tabs[0].id, true); // true = user-triggered, show toast
      }
    });
  });

  // Chip: use the suggestion
  document.getElementById('useDescSuggestion').addEventListener('click', () => {
    const suggestionText = document.getElementById('descSuggestionText').textContent;
    const descField = document.getElementById('resDescription');
    descField.value = suggestionText;
    document.getElementById('descSuggestionChip').style.display = 'none';
    descField.focus();
  });

  // Chip: dismiss the suggestion
  document.getElementById('dismissDescSuggestion').addEventListener('click', () => {
    document.getElementById('descSuggestionChip').style.display = 'none';
  });

  // Dynamically add previously-used categories to the datalist
  updateCategorySuggestions();
}

// Handle adding new resource
async function handleAddResource(e) {
  e.preventDefault();

  let url = document.getElementById('resUrl').value.trim();
  const title = document.getElementById('resTitle').value.trim();
  const timestamp = document.getElementById('resTimestamp').value.trim();
  const category = document.getElementById('resCategory').value;
  const status = document.getElementById('resStatus').value;
  const description = document.getElementById('resDescription').value.trim();

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  // Strip any existing timestamp param so we always store a clean base URL
  let baseUrl = isYouTube ? stripYouTubeTimestamp(url) : url;

  // Build the URL to save (with new timestamp appended if provided)
  let urlToSave = baseUrl;
  if (timestamp && isYouTube) {
    const formattedTs = convertTimestampToSeconds(timestamp);
    if (formattedTs) {
      const joinChar = baseUrl.includes('?') ? '&' : '?';
      urlToSave = `${baseUrl}${joinChar}t=${formattedTs}`;
    }
  }

  // --- Duplicate check for YouTube: update existing item instead of creating a new one ---
  if (isYouTube) {
    const incomingVideoId = extractYouTubeVideoId(url);
    if (incomingVideoId) {
      const existing = allResources.find(r => {
        if (!r.url) return false;
        return extractYouTubeVideoId(r.url) === incomingVideoId;
      });

      if (existing) {
        // Update the existing item with the new timestamp, description, etc.
        const updatePayload = {
          url: urlToSave,
          timestamp: timestamp || undefined,
          description,
          title,
          category,
          status,
        };

        try {
          const res = await authFetch(`${API_URL}/${existing._id}`, {
            method: 'PUT',
            body: JSON.stringify(updatePayload)
          });

          if (res.ok) {
            showToast('Timestamp & note updated on existing item!');
            document.getElementById('addResourceForm').reset();
            autoCaptureCurrentTab();
            fetchResources();
            document.querySelector('[data-tab="listTab"]').click();
          } else {
            const err = await res.json();
            showToast(err.message || 'Failed to update resource', true);
          }
        } catch (error) {
          showToast('Backend unreachable (Render server might be waking up, try again in 30s)', true);
        }
        return; // Don't fall through to create a new item
      }
    }
  }

  // No existing item found — create a new one
  const payload = {
    title,
    url: urlToSave,
    category,
    status,
    description,
    timestamp: timestamp || undefined
  };

  try {
    const res = await authFetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Resource saved successfully!');
      document.getElementById('addResourceForm').reset();
      autoCaptureCurrentTab();
      fetchResources();

      // Switch to list tab
      document.querySelector('[data-tab="listTab"]').click();
    } else {
      const err = await res.json();
      showToast(err.message || 'Failed to save resource', true);
    }
  } catch (error) {
    showToast('Backend unreachable (Render server might be waking up, try again in 30s)', true);
  }
}

// Extract YouTube video ID from a URL (handles both watch?v= and youtu.be/)
function extractYouTubeVideoId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v');
    } else if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1).split('?')[0];
    }
  } catch (_) {}
  return null;
}

// Strip timestamp params from a YouTube URL so we can store a clean base URL
function stripYouTubeTimestamp(url) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('t');
    return parsed.toString();
  } catch (_) {
    return url;
  }
}

// Convert "1:24" or "84" or "1m24s" to "1m24s"
function convertTimestampToSeconds(ts) {
  if (!ts) return null;
  if (/^\d+m\d+s$/.test(ts)) return ts;
  if (ts.includes(':')) {
    const parts = ts.split(':').map(Number);
    if (parts.length === 2) {
      return `${parts[0]}m${parts[1]}s`;
    } else if (parts.length === 3) {
      const totalM = parts[0] * 60 + parts[1];
      return `${totalM}m${parts[2]}s`;
    }
  }
  if (!isNaN(ts)) {
    const s = parseInt(ts, 10);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m${sec}s`;
  }
  return ts;
}

// Fetch resources from Express backend
async function fetchResources() {
  try {
    const res = await authFetch(API_URL);
    if (res.ok) {
      allResources = await res.json();
      updateStats();
      filterAndRenderList();
      populateCategoryFilter();
      updateCategorySuggestions();
    }
  } catch (error) {
    console.error('Error fetching resources:', error);
  }
}

// Auto-suggest description: extract page content, condense to 2-3 sentences, show as chip
function autoSuggestDescription(tabId, userTriggered = false) {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab || !tab.url) return;
    if (
      tab.url.startsWith('chrome://') ||
      tab.url.startsWith('chrome-extension://') ||
      tab.url.startsWith('about:')
    ) return;

    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        // Helper: split text into sentences
        function toSentences(text) {
          return text
            .replace(/\s+/g, ' ')
            .trim()
            .match(/[^.!?]+[.!?]+/g) || [];
        }

        // 1. YouTube description
        const ytDesc = document.querySelector(
          '#description-inline-expander yt-attributed-string, #description yt-attributed-string'
        );
        if (ytDesc && ytDesc.textContent && ytDesc.textContent.trim().length > 30) {
          const sentences = toSentences(ytDesc.textContent.trim());
          if (sentences.length >= 1) return sentences.slice(0, 3).join(' ').trim();
        }

        // 2. og:description
        const og = document.querySelector('meta[property="og:description"]');
        if (og && og.content && og.content.trim().length > 20) {
          const sentences = toSentences(og.content.trim());
          if (sentences.length >= 1) return sentences.slice(0, 3).join(' ').trim();
        }

        // 3. meta description
        const meta = document.querySelector('meta[name="description"]');
        if (meta && meta.content && meta.content.trim().length > 20) {
          const sentences = toSentences(meta.content.trim());
          if (sentences.length >= 1) return sentences.slice(0, 3).join(' ').trim();
        }

        // 4. First meaningful paragraph on the page
        const paras = Array.from(document.querySelectorAll(
          'article p, main p, .content p, [role="main"] p, p'
        ));
        for (const p of paras) {
          const text = p.textContent.trim();
          if (text.length > 60) {
            const sentences = toSentences(text);
            if (sentences.length >= 1) return sentences.slice(0, 3).join(' ').trim();
          }
        }

        return null;
      }
    }, (results) => {
      if (chrome.runtime.lastError) return;
      if (results && results[0] && results[0].result) {
        const raw = results[0].result;
        // Show the suggestion chip, never touch the textarea
        const chip = document.getElementById('descSuggestionChip');
        document.getElementById('descSuggestionText').textContent = raw;
        chip.style.display = 'block';
        if (userTriggered) showToast('Suggestion updated from page!');
      } else if (userTriggered) {
        showToast('No usable text found on this page', true);
      }
    });
  });
}

// Populate category filter dropdown from saved resources
function populateCategoryFilter() {
  const filterSelect = document.getElementById('filterCategory');
  const categories = [...new Set(allResources.map(r => r.category).filter(Boolean))];
  
  // Keep "All" option, clear the rest
  filterSelect.innerHTML = '<option value="All">All Categories</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    filterSelect.appendChild(opt);
  });
}

// Add previously-used categories to the datalist suggestions
function updateCategorySuggestions() {
  const datalist = document.getElementById('categorySuggestions');
  if (!datalist) return;
  const existingValues = new Set(Array.from(datalist.options).map(o => o.value));
  const usedCategories = [...new Set(allResources.map(r => r.category).filter(Boolean))];
  
  usedCategories.forEach(cat => {
    if (!existingValues.has(cat)) {
      const opt = document.createElement('option');
      opt.value = cat;
      datalist.appendChild(opt);
    }
  });
}

// Filter & render resources list
function filterAndRenderList() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const selectedCat = document.getElementById('filterCategory').value;

  const filtered = allResources.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(query) || (item.url && item.url.toLowerCase().includes(query));
    const matchesCat = selectedCat === 'All' || item.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  const listContainer = document.getElementById('resourceList');
  if (filtered.length === 0) {
    listContainer.innerHTML = `<div class="empty-state">No resources found. Add one above!</div>`;
    return;
  }

  listContainer.innerHTML = filtered.map(item => {
    // Build a timestamped URL for YouTube videos
    let displayUrl = item.url;
    if (item.timestamp && (item.url.includes('youtube.com') || item.url.includes('youtu.be'))) {
      // Only add timestamp to URL if not already present
      if (!item.url.includes('&t=') && !item.url.includes('?t=')) {
        const ts = convertTimestampToSeconds(item.timestamp);
        if (ts) {
          const joinChar = item.url.includes('?') ? '&' : '?';
          displayUrl = `${item.url}${joinChar}t=${ts}`;
        }
      }
    }

    return `
    <div class="resource-card" data-id="${item._id}">
      <div class="resource-top">
        <a href="${displayUrl}" target="_blank" class="resource-title">${escapeHtml(item.title)}</a>
        <span class="platform-badge ${(item.platform || 'other').toLowerCase()}">${item.platform || 'Web'}</span>
      </div>
      
      ${item.description ? `<p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 6px;">${escapeHtml(item.description)}</p>` : ''}

      ${item.timestamp ? `
        <a href="${displayUrl}" target="_blank" class="timestamp-badge" title="Jump to ${item.timestamp} in video">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          ${escapeHtml(item.timestamp)}
        </a>
      ` : ''}

      <div class="resource-meta">
        <span class="tag-badge">${item.category || 'General'}</span>
        
        <div style="display: flex; align-items: center; gap: 8px;">
          <select class="status-select ${item.status.replace(/\s+/g, '-')}" data-id="${item._id}">
            <option value="To-Do" ${item.status === 'To-Do' ? 'selected' : ''}>To-Do</option>
            <option value="In Progress" ${item.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Completed" ${item.status === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>

          <button class="delete-btn" data-id="${item._id}" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `}).join('');

  // Attach status change events
  document.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const newStatus = e.target.value;
      await updateStatus(id, newStatus);
    });
  });

  // Attach delete events
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = btn.getAttribute('data-id');
      await deleteItem(id);
    });
  });
}

// Update status
async function updateStatus(id, newStatus) {
  try {
    const res = await authFetch(`${API_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      showToast('Status updated');
      fetchResources();
    }
  } catch (error) {
    showToast('Failed to update status', true);
  }
}

// Delete item
async function deleteItem(id) {
  try {
    const res = await authFetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      showToast('Item deleted');
      fetchResources();
    }
  } catch (error) {
    showToast('Failed to delete item', true);
  }
}

// Update Stats widget counters
function updateStats() {
  document.getElementById('totalBadge').innerText = allResources.length;
  document.getElementById('statTotal').innerText = allResources.length;
  document.getElementById('statTodo').innerText = allResources.filter(r => r.status === 'To-Do').length;
  document.getElementById('statInProgress').innerText = allResources.filter(r => r.status === 'In Progress').length;
  document.getElementById('statCompleted').innerText = allResources.filter(r => r.status === 'Completed').length;
}

// Toast helper
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  toastMsg.innerText = msg;
  toast.style.background = isError ? 'rgba(244, 63, 94, 0.95)' : 'rgba(16, 185, 129, 0.95)';
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
