const API_URL = 'https://katalyst-fybi.onrender.com/api/resources';

let allResources = [];

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  autoCaptureCurrentTab();
  fetchResources();
  setupEventListeners();
});

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

  // Suggest Description button
  document.getElementById('suggestDescBtn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        autoSuggestDescription(tabs[0].id);
      }
    });
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

  // If YouTube timestamp provided, convert to &t=1m24s format
  if (timestamp && (url.includes('youtube.com') || url.includes('youtu.be'))) {
    const formattedTs = convertTimestampToSeconds(timestamp);
    if (formattedTs) {
      const joinChar = url.includes('?') ? '&' : '?';
      url = `${url}${joinChar}t=${formattedTs}`;
    }
  }

  const payload = {
    title,
    url,
    category,
    status,
    description
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(API_URL);
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

// Auto-suggest description from page meta tags
function autoSuggestDescription(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: () => {
      // Try meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && metaDesc.content) return metaDesc.content.trim();

      // Try og:description  
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc && ogDesc.content) return ogDesc.content.trim();

      // For YouTube, try the video description snippet
      const ytDesc = document.querySelector('#description-inline-expander yt-attributed-string, #description yt-attributed-string, meta[name="description"]');
      if (ytDesc && ytDesc.textContent) return ytDesc.textContent.trim().slice(0, 200);

      // Fallback: grab first paragraph text
      const firstP = document.querySelector('article p, main p, .content p, p');
      if (firstP && firstP.textContent) return firstP.textContent.trim().slice(0, 200);

      return null;
    }
  }, (results) => {
    const descField = document.getElementById('resDescription');
    if (results && results[0] && results[0].result) {
      const suggestion = results[0].result.slice(0, 200);
      descField.value = suggestion;
      descField.placeholder = suggestion;
      showToast('Description suggested from page!');
    } else {
      showToast('Could not extract description from this page', true);
    }
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

  listContainer.innerHTML = filtered.map(item => `
    <div class="resource-card" data-id="${item._id}">
      <div class="resource-top">
        <a href="${item.url}" target="_blank" class="resource-title">${escapeHtml(item.title)}</a>
        <span class="platform-badge ${(item.platform || 'other').toLowerCase()}">${item.platform || 'Web'}</span>
      </div>
      
      ${item.description ? `<p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 6px;">${escapeHtml(item.description)}</p>` : ''}

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
  `).join('');

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
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`${API_URL}/${id}`, {
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
