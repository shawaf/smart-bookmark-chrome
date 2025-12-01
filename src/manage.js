const statusEl = document.getElementById('status');
const foldersContainer = document.getElementById('folders');
const refreshButton = document.getElementById('refresh');
const backToPopup = null; // Removed
const testNotificationBtn = null; // Removed
const clearAllBtn = document.getElementById('clear-all-bookmarks');
const folderFilter = document.getElementById('folder-filter');
const searchInput = document.getElementById('search-input');
const dateFilter = document.getElementById('date-filter');
const themeToggle = document.getElementById('theme-toggle');
const viewListBtn = document.getElementById('view-list');
const viewMindmapBtn = document.getElementById('view-mindmap');
const foldersSection = document.getElementById('folders');
const mindmapSection = document.getElementById('mindmap');
const mindmapSvg = document.getElementById('mindmap-svg');
const mlToggle = null; // Removed, always on
const dragNote = document.getElementById('drag-note');
const THEME_KEY = 'smartBookmarkTheme';
let folderOptions = [];
let currentTree = null;
let currentFilterKey = 'all';
let currentSearch = '';
let currentDateFilter = '';
let currentTheme = 'light';
let reminderPrepared = false;

const FOLDER_FILTERS = [
  { key: 'all', label: 'All folders', matcher: () => true },
  {
    key: 'software',
    label: 'Software & Engineering',
    matcher: (title) =>
      /engineer|frontend|backend|react|devops|api|code|software|interview|pipeline|microservice/.test(title)
  },
  {
    key: 'education',
    label: 'Learning & Education',
    matcher: (title) => /education|learning|language|lms|course|tutorial|lesson|school|university/.test(title)
  },
  {
    key: 'business',
    label: 'Business & Marketing',
    matcher: (title) => /business|startup|marketing|sales|product|growth|management|leadership/.test(title)
  },
  {
    key: 'finance',
    label: 'Finance & Banking',
    matcher: (title) => /finance|bank|fintech|money|investment|trading|crypto/.test(title)
  },
  {
    key: 'media',
    label: 'Entertainment & Media',
    matcher: (title) => /entertainment|media|podcast|music|film|youtube|game|show/.test(title)
  },
  {
    key: 'lifestyle',
    label: 'Lifestyle & Travel',
    matcher: (title) => /travel|fitness|sport|shopping|health|science|design|faith/.test(title)
  }
];

function initFilters() {
  if (!folderFilter) return;
  folderFilter.innerHTML = '';
  FOLDER_FILTERS.forEach((filter) => {
    const option = document.createElement('option');
    option.value = filter.key;
    option.textContent = filter.label;
    folderFilter.appendChild(option);
  });
}

refreshButton.addEventListener('click', loadTree);


if (testNotificationBtn) {
  testNotificationBtn.addEventListener('click', async () => {
    try {
      const allowed = await ensureNotificationPermission();
      if (!allowed) {
        setStatus('Notifications not allowed.', 'error');
        return;
      }
      await chrome.runtime.sendMessage({ type: 'TEST_NOTIFICATION' });
      setStatus('Test notification sent.', 'success');
    } catch (error) {
      console.error('Test notification failed', error);
      setStatus('Test notification failed.', 'error');
    }
  });
}

if (clearAllBtn) {
  clearAllBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete ALL smart bookmarks? This cannot be undone.')) {
      try {
        await chrome.runtime.sendMessage({ type: 'DELETE_ALL' });
        loadTree();
        setStatus('All bookmarks cleared.', 'success');
      } catch (error) {
        console.error('Failed to clear bookmarks', error);
        setStatus('Failed to clear bookmarks.', 'error');
      }
    }
  });
}

// ML Classification Toggle

initThemeToggle();

if (!chrome?.runtime?.sendMessage) {
  setStatus('Chrome extension APIs are unavailable in this preview. Load the extension to manage bookmarks.', 'error');
  refreshButton.disabled = true;
} else {
  initFilters();
  prepareReminderSupport();
  folderFilter.addEventListener('change', () => {
    currentFilterKey = folderFilter.value;
    renderFoldersFromState();
  });
  searchInput.addEventListener('input', debounce(async (event) => {
    const query = event.target.value.trim();

    if (!query) {
      hideSearchResults();
      showFolderView();
      return;
    }

    // Show loading state if needed

    const startTime = performance.now();

    // Collect all bookmarks
    const allBookmarks = collectAllBookmarks(currentTree);

    // Search using TF-IDF (from text-similarity.js)
    // Note: searchBookmarks is globally available from text-similarity.js
    const results = searchBookmarks(query, allBookmarks);

    const endTime = performance.now();
    const searchTime = (endTime - startTime).toFixed(0);

    // Display results
    displaySearchResults(results, query, searchTime);
  }, 300));
  dateFilter.addEventListener('change', (event) => {
    currentDateFilter = event.target.value;
    renderFoldersFromState();
  });
  loadTree();
  initViewToggles();
}

function initThemeToggle() {
  if (!themeToggle) return;
  const stored = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  currentTheme = stored === 'dark' || stored === 'light' ? stored : prefersDark ? 'dark' : 'light';
  applyTheme(currentTheme);

  themeToggle.addEventListener('click', () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
  });

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      const userChoice = localStorage.getItem(THEME_KEY);
      if (userChoice === 'dark' || userChoice === 'light') return;
      applyTheme(event.matches ? 'dark' : 'light');
    });
  }
}

async function prepareReminderSupport() {
  if (reminderPrepared) return;
  reminderPrepared = true;
  try {
    await ensureNotificationPermission();
    await chrome.runtime.sendMessage({ type: 'ENSURE_REMINDERS_READY' });
  } catch (error) {
    console.warn('Unable to prepare reminders in manager', error);
  }
}

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.classList.toggle('theme-dark', theme === 'dark');
  document.documentElement.classList.toggle('theme-light', theme !== 'dark');
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', theme === 'dark');
    themeToggle.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

async function loadTree() {
  setStatus('Loading folders…', '');

  try {
    const tree = await chrome.runtime.sendMessage({ type: 'GET_TREE' });
    if (!tree || tree.error) {
      throw new Error(tree?.error || 'Unknown error loading bookmarks');
    }

    if (!tree.children || tree.children.length === 0) {
      setStatus('No smart bookmarks yet. Save a tab to get started.', '');
      foldersContainer.innerHTML = '';
      return;
    }

    currentTree = tree;
    folderOptions = flattenFolders(tree.children || []);
    renderFoldersFromState();

    // Refresh mindmap if it's visible
    if (!mindmapSection.classList.contains('hidden')) {
      renderMindmap();
    }
  } catch (error) {
    console.error('Failed to load smart bookmarks', error);
    setStatus(`Could not load bookmarks: ${error.message}`, 'error');
    foldersContainer.innerHTML = '';
  }
}

function renderFoldersFromState() {
  if (!currentTree) return;

  const total = currentTree.children?.length || 0;
  const filtered = (currentTree.children || []).filter(
    (folder) =>
      matchesFilter(folder.title, currentFilterKey) &&
      matchesSearch(folder, currentSearch) &&
      matchesDate(folder, currentDateFilter)
  );

  if (filtered.length === 0) {
    setStatus('No folders match this filter yet. Try another filter or clear the search.', '');
    foldersContainer.innerHTML = '';
    return;
  }

  setStatus(
    `Showing ${filtered.length} of ${total} folders. Drag a bookmark card onto any folder to move it.`,
    'success'
  );
  foldersContainer.innerHTML = '';
  filtered.forEach((folder) =>
    foldersContainer.appendChild(renderFolder(folder, folderOptions, currentSearch, currentDateFilter))
  );
}

function matchesFilter(title, filterKey) {
  const normalized = (title || '').toLowerCase();
  const filter = FOLDER_FILTERS.find((item) => item.key === filterKey);
  if (!filter) return true;
  return filter.matcher(normalized);
}

function matchesSearch(folder, term = '') {
  if (!term) return true;

  const normalized = term.toLowerCase();
  const folderTitle = (folder.title || '').toLowerCase();
  if (folderTitle.includes(normalized)) return true;

  const children = folder.children || [];
  return children.some((child) => bookmarkMatchesSearch(child, normalized));
}

function matchesDate(folder, dateString = '') {
  if (!dateString) return true;
  const children = folder.children || [];
  return children.some((child) => bookmarkMatchesDate(child, dateString));
}

function bookmarkMatchesSearch(node, term) {
  if (!node.url) return false;
  const metadata = node.metadata || {};
  const haystack = [
    node.title,
    node.url,
    metadata.description,
    metadata.snippet,
    metadata.keywords,
    metadata.notes,
    metadata.domain,
    metadata.reminder,
    metadata.savedAt,
    (metadata.tags || []).join(' ')
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(term);
}

function bookmarkMatchesDate(node, dateString = '') {
  if (!dateString || !node.url) return false;
  const metadata = node.metadata || {};
  if (!metadata.savedAt) return false;
  try {
    const savedDate = new Date(metadata.savedAt);
    if (Number.isNaN(savedDate.getTime())) return false;
    const isoDay = savedDate.toISOString().slice(0, 10);
    return isoDay === dateString;
  } catch (error) {
    return false;
  }
}

function setStatus(message, tone = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${tone}`.trim();
}

function renderFolder(folder, allFolders, searchTerm = '', dateFilter = '') {
  const template = document.getElementById('folder-template');
  const clone = template.content.cloneNode(true);
  const card = clone.querySelector('.folder-card');
  const titleEl = clone.querySelector('.folder-title');
  const countEl = clone.querySelector('.folder-count');
  const bookmarksContainer = clone.querySelector('.bookmarks');
  const deleteBtn = clone.querySelector('.delete-folder');
  const colorSwatch = clone.querySelector('.folder-color');

  const palette = folder.color || {};
  card.style.setProperty('--folder-accent', palette.primary || '#6366f1');
  card.style.setProperty('--folder-surface', palette.surface || '#ffffff');
  card.style.setProperty('--folder-border', palette.border || '#e2e8f0');
  card.style.setProperty('--folder-text', palette.text || '#0f172a');
  if (colorSwatch) {
    colorSwatch.style.backgroundColor = palette.primary || '#6366f1';
  }

  card.dataset.folderId = folder.id;
  titleEl.textContent = folder.title;
  const children = folder.children || [];
  const normalizedSearch = searchTerm.toLowerCase();
  const onlyLinks = children.filter((child) => child.url);
  const visibleLinks = onlyLinks.filter(
    (child) => bookmarkMatchesSearch(child, normalizedSearch) && bookmarkMatchesDate(child, dateFilter)
  );

  const countLabel = dateFilter || normalizedSearch ? visibleLinks.length : onlyLinks.length;
  countEl.textContent = `${countLabel} saved tab${countLabel === 1 ? '' : 's'}`;

  attachDropTarget(card, folder.id);
  deleteBtn.addEventListener('click', async () => {
    if (confirm(`Delete the folder "${folder.title}" and all its bookmarks?`)) {
      await chrome.runtime.sendMessage({ type: 'DELETE_NODE', nodeId: folder.id });
      loadTree();
    }
  });

  const linksToRender = dateFilter || normalizedSearch ? visibleLinks : onlyLinks;

  if (linksToRender.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = dateFilter || normalizedSearch
      ? 'No bookmarks match this search yet.'
      : 'No bookmarks in this folder yet.';
    empty.className = 'empty';
    bookmarksContainer.appendChild(empty);
  } else {
    linksToRender.forEach((child) =>
      bookmarksContainer.appendChild(renderBookmark(child, folder.title, allFolders))
    );
  }

  return clone;
}

function renderBookmark(node, topic, allFolders) {
  const template = document.getElementById('bookmark-template');
  const clone = template.content.cloneNode(true);
  const card = clone.querySelector('.bookmark');
  const titleEl = clone.querySelector('.title');
  const domainEl = clone.querySelector('.domain');
  const descriptionEl = clone.querySelector('.description');
  const savedTimeEl = clone.querySelector('.saved-time');
  const reminderEl = clone.querySelector('.reminder');
  const topicEl = clone.querySelector('.topic');
  const notesEl = clone.querySelector('.notes');
  const tagsEl = clone.querySelector('.tags');
  const menuToggle = clone.querySelector('.menu-toggle');
  const actionMenu = clone.querySelector('.action-menu');
  const openBtn = clone.querySelector('.open');
  const editBtn = clone.querySelector('.edit');
  const deleteBtn = clone.querySelector('.delete');
  const form = clone.querySelector('.edit-form');
  const cancelBtn = clone.querySelector('.cancel');
  const folderSelect = form.querySelector('select[name="folder"]');
  const reminderInput = form.querySelector('input[name="reminder"]');

  const metadata = node.metadata || {};
  const tags = (metadata.tags || []).filter(Boolean);

  card.dataset.bookmarkId = node.id;
  card.dataset.folderId = node.parentId || '';
  card.setAttribute('draggable', 'true');
  let isDragging = false;

  // Add icon if available
  if (metadata.iconUrl) {
    const icon = document.createElement('img');
    icon.src = metadata.iconUrl;
    icon.className = 'site-icon';
    icon.alt = '';
    // Insert before title or inside a header wrapper if one existed, 
    // but here we'll prepend to the card or wrap title/domain.
    // Let's insert it at the beginning of the card content
    card.insertBefore(icon, card.firstChild);
  }

  titleEl.textContent = node.title || node.url;
  domainEl.textContent = metadata.domain || new URL(node.url).hostname;
  descriptionEl.textContent = metadata.description || 'No description saved';
  savedTimeEl.textContent = metadata.savedAt
    ? `Saved ${new Date(metadata.savedAt).toLocaleString()}`
    : 'Saved date unavailable';
  reminderEl.textContent = metadata.reminder
    ? `Reminder: ${new Date(metadata.reminder).toLocaleString()}`
    : 'No reminder set';
  topicEl.textContent = topic;
  notesEl.textContent = metadata.notes ? `Notes: ${metadata.notes}` : '';
  tagsEl.textContent = tags.length > 0 ? tags.join(', ') : '';

  card.addEventListener('click', (event) => {
    if (isDragging) return;
    const interactiveSelector = 'button, input, textarea, select, option, label, a, .action-menu, form';
    if (event.target.closest(interactiveSelector)) return;
    chrome.tabs.create({ url: node.url });
  });

  const closeMenu = () => {
    actionMenu.classList.add('hidden');
    menuToggle.setAttribute('aria-expanded', 'false');
  };

  const openMenu = () => {
    actionMenu.classList.remove('hidden');
    menuToggle.setAttribute('aria-expanded', 'true');
  };

  const handleOutsideClick = (event) => {
    if (!actionMenu.contains(event.target) && event.target !== menuToggle) {
      closeMenu();
      document.removeEventListener('click', handleOutsideClick);
    }
  };

  menuToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = !actionMenu.classList.contains('hidden');
    if (isOpen) {
      closeMenu();
      document.removeEventListener('click', handleOutsideClick);
    } else {
      openMenu();
      document.addEventListener('click', handleOutsideClick);
    }
  });

  openBtn.addEventListener('click', () => {
    closeMenu();
    chrome.tabs.create({ url: node.url });
  });
  deleteBtn.addEventListener('click', async () => {
    closeMenu();
    if (confirm('Delete this bookmark?')) {
      await chrome.runtime.sendMessage({ type: 'DELETE_NODE', nodeId: node.id });
      loadTree();
    }
  });

  editBtn.addEventListener('click', () => {
    closeMenu();
    populateForm(form, node, metadata, allFolders);
    form.classList.remove('hidden');
  });

  cancelBtn.addEventListener('click', () => {
    form.reset();
    form.classList.add('hidden');
  });

  card.addEventListener('dragstart', (event) => {
    isDragging = true;
    card.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({ bookmarkId: node.id, fromFolderId: node.parentId })
    );
  });

  card.addEventListener('dragend', () => {
    isDragging = false;
    card.classList.remove('dragging');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const destinationFolderId = formData.get('folder');
    const reminderValue = formData.get('reminder') || '';

    if (reminderValue) {
      const allowed = await ensureNotificationPermission();
      if (!allowed) {
        setStatus('Enable notifications to use reminders.', 'error');
        return;
      }
    }

    const updates = {
      title: formData.get('title') || node.title,
      notes: formData.get('notes') || '',
      tags: (formData.get('tags') || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      reminder: reminderValue
    };

    if (destinationFolderId && destinationFolderId !== node.parentId) {
      await chrome.runtime.sendMessage({
        type: 'MOVE_BOOKMARK',
        bookmarkId: node.id,
        destinationFolderId
      });
    }

    await chrome.runtime.sendMessage({ type: 'UPDATE_BOOKMARK', bookmarkId: node.id, updates });
    form.classList.add('hidden');
    loadTree();
  });

  return clone;
}

async function ensureNotificationPermission() {
  if (typeof Notification === 'undefined' || Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (error) {
    console.warn('Notification permission request failed', error);
    return false;
  }
}

function populateForm(form, node, metadata, allFolders) {
  const titleInput = form.querySelector('input[name="title"]');
  const notesInput = form.querySelector('textarea[name="notes"]');
  const tagsInput = form.querySelector('input[name="tags"]');
  const folderSelect = form.querySelector('select[name="folder"]');
  const reminderInput = form.querySelector('input[name="reminder"]');

  titleInput.value = node.title || node.url;
  notesInput.value = metadata.notes || '';
  tagsInput.value = (metadata.tags || []).join(', ');
  reminderInput.value = metadata.reminder ? formatDateTimeInput(metadata.reminder) : '';
  populateFolderSelect(folderSelect, allFolders, node.parentId);
}

function populateFolderSelect(select, folders, currentFolderId) {
  select.innerHTML = '';
  folders.forEach((folder) => {
    const option = document.createElement('option');
    option.value = folder.id;
    option.textContent = folder.title;
    if (folder.color?.surface) {
      option.style.backgroundColor = folder.color.surface;
    }
    if (folder.color?.text) {
      option.style.color = folder.color.text;
    }
    if (folder.id === currentFolderId) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function formatDateTimeInput(dateString) {
  try {
    const date = new Date(dateString);
    const pad = (num) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  } catch (error) {
    return '';
  }
}

function flattenFolders(nodes, acc = []) {
  nodes.forEach((node) => {
    if (!node.url) {
      acc.push({ id: node.id, title: node.title, color: node.color || null });
      if (node.children && node.children.length > 0) {
        flattenFolders(node.children, acc);
      }
    }
  });
  return acc;
}

function attachDropTarget(card, folderId) {
  card.addEventListener('dragover', (event) => {
    event.preventDefault();
    card.classList.add('drop-ready');
  });

  card.addEventListener('dragleave', () => {
    card.classList.remove('drop-ready');
  });

  card.addEventListener('drop', async (event) => {
    event.preventDefault();
    card.classList.remove('drop-ready');
    const payload = event.dataTransfer.getData('application/json');
    if (!payload) return;

    try {
      const { bookmarkId, fromFolderId } = JSON.parse(payload);
      if (!bookmarkId || folderId === fromFolderId) return;

      await chrome.runtime.sendMessage({
        type: 'MOVE_BOOKMARK',
        bookmarkId,
        destinationFolderId: folderId
      });
      loadTree();
    } catch (error) {
      console.error('Failed to move bookmark', error);
      setStatus(`Could not move bookmark: ${error.message}`, 'error');
    }
  });
}

/* Mindmap Implementation */

function initViewToggles() {
  if (!viewListBtn || !viewMindmapBtn) return;

  viewListBtn.addEventListener('click', () => switchView('list'));
  viewMindmapBtn.addEventListener('click', () => switchView('mindmap'));
}

function switchView(view) {
  if (view === 'list') {
    viewListBtn.classList.add('active');
    viewListBtn.classList.remove('ghost');
    viewListBtn.setAttribute('aria-pressed', 'true');
    viewMindmapBtn.classList.remove('active');
    viewMindmapBtn.classList.add('ghost');
    viewMindmapBtn.setAttribute('aria-pressed', 'false');

    foldersSection.classList.remove('hidden');
    mindmapSection.classList.add('hidden');

    // Update status message for list view
    renderFoldersFromState();
  } else {
    viewMindmapBtn.classList.add('active');
    viewMindmapBtn.classList.remove('ghost');
    viewMindmapBtn.setAttribute('aria-pressed', 'true');
    viewListBtn.classList.remove('active');
    viewListBtn.classList.add('ghost');
    viewListBtn.setAttribute('aria-pressed', 'false');

    foldersSection.classList.add('hidden');
    mindmapSection.classList.remove('hidden');

    // Update status message for mindmap view
    const total = currentTree?.children?.length || 0;
    setStatus(`Mindmap view: ${total} folder${total === 1 ? '' : 's'}. Drag nodes to reposition. Double-click bookmarks to open.`, 'success');

    renderMindmap();
  }
}

let simulation = null;

function renderMindmap() {
  if (!currentTree || !mindmapSvg) return;

  // Stop previous simulation if running
  if (simulation) {
    simulation.stop();
  }

  mindmapSvg.innerHTML = '';

  const width = mindmapSection.clientWidth;
  const height = mindmapSection.clientHeight;

  if (width === 0 || height === 0) {
    setTimeout(renderMindmap, 50);
    return;
  }

  const centerX = width / 2;
  const centerY = height / 2;

  // Prepare nodes and links
  const nodes = [];
  const links = [];
  const allBookmarks = []; // Track all bookmarks for ML similarity

  // Root
  const rootNode = { id: 'root', x: centerX, y: centerY, vx: 0, vy: 0, type: 'root', title: 'All Bookmarks', r: 30 };
  nodes.push(rootNode);

  const folders = currentTree.children || [];
  folders.forEach((folder, i) => {
    const folderNode = {
      id: folder.id,
      x: centerX + (Math.random() - 0.5) * 50,
      y: centerY + (Math.random() - 0.5) * 50,
      vx: 0,
      vy: 0,
      type: 'folder',
      title: folder.title,
      r: 20
    };
    nodes.push(folderNode);
    links.push({ source: rootNode, target: folderNode, distance: 150, type: 'hierarchy' });

    const bookmarks = (folder.children || []).filter((c) => c.url).slice(0, 5);
    bookmarks.forEach((bm) => {
      const bmNode = {
        id: bm.id,
        x: folderNode.x + (Math.random() - 0.5) * 20,
        y: folderNode.y + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        type: 'bookmark',
        title: bm.title,
        url: bm.url,
        metadata: bm.metadata,
        r: 6
      };
      nodes.push(bmNode);
      links.push({ source: folderNode, target: bmNode, distance: 80, type: 'hierarchy' });

      // Track bookmark for ML similarity
      allBookmarks.push({
        node: bmNode,
        nodeIndex: nodes.length - 1,
        title: bm.title,
        metadata: bm.metadata || {}
      });
    });
  });

  // Add ML-based similarity links if enabled
  addSimilarityLinks(allBookmarks, nodes, links).then(() => {
    // Continue with rendering after similarity links are added
    renderMindmapWithLinks(nodes, links, centerX, centerY, width, height);
  }).catch(error => {
    console.warn('Failed to add similarity links, rendering without them:', error);
    renderMindmapWithLinks(nodes, links, centerX, centerY, width, height);
  });
}

// Add similarity-based links between related bookmarks
async function addSimilarityLinks(allBookmarks, nodes, links) {
  if (allBookmarks.length < 2) return; // Need at least 2 bookmarks

  try {
    console.log('Calculating bookmark similarities using TF-IDF...');

    // Calculate similarity matrix using text-based approach
    const similarityMatrix = calculateTextSimilarity(allBookmarks);

    // Add links between similar bookmarks (threshold: 0.3 for text similarity)
    const threshold = 0.3;
    let similarityLinksAdded = 0;

    for (let i = 0; i < allBookmarks.length; i++) {
      const related = getRelatedBookmarks(i, similarityMatrix, threshold);

      related.forEach(j => {
        if (i < j) { // Avoid duplicate links
          const sourceNode = nodes[allBookmarks[i].nodeIndex];
          const targetNode = nodes[allBookmarks[j].nodeIndex];

          links.push({
            source: sourceNode,
            target: targetNode,
            distance: 60,
            type: 'similarity',
            strength: similarityMatrix[i][j]
          });

          similarityLinksAdded++;
        }
      });
    }

    console.log(`Added ${similarityLinksAdded} similarity links`);
  } catch (error) {
    console.error('Error adding similarity links:', error);
    throw error;
  }
}

// Render mindmap with the prepared nodes and links
function renderMindmapWithLinks(nodes, links, centerX, centerY, width, height) {
  // Create SVG elements
  const mapGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  mindmapSvg.appendChild(mapGroup);

  // Draw links first
  const linkElements = links.map(link => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', `mindmap-edge ${link.target.type === 'bookmark' ? 'bookmark-edge' : ''}`);
    mapGroup.appendChild(path);
    return { el: path, link };
  });

  // Draw nodes
  const nodeElements = nodes.map(node => {
    const group = createMindmapNodeGroup(node);
    mapGroup.appendChild(group);

    // Drag behavior
    group.addEventListener('mousedown', (e) => startDrag(e, node));

    return { el: group, node };
  });

  // Physics Simulation Loop
  let animationFrameId;
  const alphaDecay = 0.02;
  let alpha = 1;

  function tick() {
    if (alpha <= 0.01) {
      // Stop loop but keep drag active
      return;
    }

    alpha -= alphaDecay * 0.1; // Slow decay

    // 1. Repulsion (Charge)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distSq = dx * dx + dy * dy || 1;
        const force = (5000 * alpha) / distSq;
        const fx = (dx / Math.sqrt(distSq)) * force;
        const fy = (dy / Math.sqrt(distSq)) * force;

        if (!nodes[i].fx) { nodes[i].vx += fx; nodes[i].vy += fy; }
        if (!nodes[j].fx) { nodes[j].vx -= fx; nodes[j].vy -= fy; }
      }
    }

    // 2. Spring Force (Links)
    links.forEach(link => {
      const dx = link.target.x - link.source.x;
      const dy = link.target.y - link.source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - link.distance) * 0.05 * alpha;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (!link.source.fx) { link.source.vx += fx; link.source.vy += fy; }
      if (!link.target.fx) { link.target.vx -= fx; link.target.vy -= fy; }
    });

    // 3. Center Gravity
    nodes.forEach(node => {
      if (node.fx) return;
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      node.vx += dx * 0.01 * alpha;
      node.vy += dy * 0.01 * alpha;

      // Update Position
      node.vx *= 0.9; // Friction
      node.vy *= 0.9;
      node.x += node.vx;
      node.y += node.vy;
    });

    // Update SVG
    updateVisuals(nodeElements, linkElements);

    animationFrameId = requestAnimationFrame(tick);
  }

  // Start simulation
  tick();

  simulation = {
    stop: () => cancelAnimationFrame(animationFrameId),
    restart: () => { alpha = 1; tick(); }
  };

  // Drag Handlers
  let draggedNode = null;

  function startDrag(e, node) {
    e.preventDefault();
    draggedNode = node;
    node.fx = node.x; // Fix position
    node.fy = node.y;
    simulation.restart(); // Wake up simulation

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
  }

  function onDrag(e) {
    if (!draggedNode) return;
    const rect = mindmapSvg.getBoundingClientRect();
    draggedNode.fx = e.clientX - rect.left;
    draggedNode.fy = e.clientY - rect.top;
    draggedNode.x = draggedNode.fx;
    draggedNode.y = draggedNode.fy;
  }

  function endDrag() {
    if (!draggedNode) return;
    draggedNode.fx = null;
    draggedNode.fy = null;
    draggedNode = null;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
  }
}

function updateVisuals(nodeElements, linkElements) {
  nodeElements.forEach(({ el, node }) => {
    el.setAttribute('transform', `translate(${node.x}, ${node.y})`);
  });

  linkElements.forEach(({ el, link }) => {
    // Style based on link type
    if (link.type === 'similarity') {
      el.setAttribute('class', 'mindmap-edge similarity-edge');
    } else {
      el.setAttribute('class', 'mindmap-edge hierarchy-edge');
    }

    // Curved path for better visualization
    const mx = (link.source.x + link.target.x) / 2;
    const my = (link.source.y + link.target.y) / 2;
    el.setAttribute('d', `M${link.source.x},${link.source.y} L${link.target.x},${link.target.y}`);
  });
}

function createMindmapNodeGroup(node) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', `mindmap-node ${node.type}`);

  if (node.url) {
    group.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      chrome.tabs.create({ url: node.url });
    });
  }

  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('r', node.r);
  group.appendChild(circle);

  if (node.type !== 'bookmark') {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.textContent = node.title.length > 15 ? node.title.substring(0, 12) + '...' : node.title;
    label.setAttribute('dy', node.r + 15);
    label.setAttribute('text-anchor', 'middle');
    group.appendChild(label);
  } else {
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = node.title;
    group.appendChild(title);
  }

  return group;
}

// --- Search Engine Functions ---

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function collectAllBookmarks(tree) {
  const bookmarks = [];
  if (!tree) return bookmarks;

  function traverse(node, folderTitle = 'Uncategorized', folderId = '') {
    if (node.url) {
      bookmarks.push({
        ...node,
        folderTitle: folderTitle,
        folderId: folderId
      });
    }

    if (node.children) {
      // Use current node title as folder title for children, unless it's the root
      const nextTitle = node.id === '0' || node.id === 'root' ? folderTitle : node.title;
      const nextId = node.id;

      node.children.forEach(child => traverse(child, nextTitle, nextId));
    }
  }

  // Handle array or single node
  if (Array.isArray(tree)) {
    tree.forEach(node => traverse(node));
  } else if (tree.children) {
    tree.children.forEach(child => traverse(child));
  } else {
    traverse(tree);
  }

  return bookmarks;
}

function hideSearchResults() {
  const resultsContainer = document.getElementById('search-results');
  const foldersSection = document.getElementById('folders');
  const mindmapSection = document.getElementById('mindmap');

  if (resultsContainer) resultsContainer.classList.add('hidden');

  // Restore previous view
  if (mindmapSection && !mindmapSection.classList.contains('hidden')) {
    // Keep mindmap visible
  } else {
    if (foldersSection) foldersSection.classList.remove('hidden');
  }
}

function showFolderView() {
  const foldersSection = document.getElementById('folders');
  const mindmapSection = document.getElementById('mindmap');

  // Only show folders if mindmap is not active
  if (mindmapSection.classList.contains('hidden')) {
    foldersSection.classList.remove('hidden');
  }
}

function displaySearchResults(results, query, timeMs) {
  const resultsContainer = document.getElementById('search-results');
  const resultsList = document.getElementById('results-list');
  const resultCount = document.getElementById('result-count');
  const searchTime = document.getElementById('search-time');
  const noResults = document.getElementById('no-results');
  const foldersSection = document.getElementById('folders');
  const mindmapSection = document.getElementById('mindmap');

  // Hide other views
  if (foldersSection) foldersSection.classList.add('hidden');
  if (mindmapSection) mindmapSection.classList.add('hidden');

  // Show results container
  resultsContainer.classList.remove('hidden');

  // Update meta info
  resultCount.textContent = `Found ${results.length} result${results.length !== 1 ? 's' : ''}`;
  searchTime.textContent = `(${timeMs} ms)`;

  // Clear previous results
  resultsList.innerHTML = '';

  if (results.length === 0) {
    noResults.classList.remove('hidden');
    return;
  }

  noResults.classList.add('hidden');

  // Render results
  results.forEach(item => {
    const bm = item.bookmark;
    const score = Math.round(item.score * 100);

    const resultEl = document.createElement('div');
    resultEl.className = 'search-result';
    resultEl.addEventListener('click', () => {
      chrome.tabs.create({ url: bm.url });
    });

    // Generate snippet
    const snippetText = bm.metadata?.description || bm.metadata?.snippet || bm.url;
    const snippet = generateSnippet(snippetText, tokenize(query));
    const highlightedSnippet = highlightTerms(snippet, tokenize(query));
    const highlightedTitle = highlightTerms(bm.title, tokenize(query));

    resultEl.innerHTML = `
      <div class="result-header">
        <div class="result-title-row">
          <img src="${getFaviconUrl(bm.url)}" class="result-favicon" onerror="this.src='icons/icon16.png'">
          <div class="result-title">${highlightedTitle}</div>
        </div>
        <div class="result-meta">
          <span class="relevance-score" title="Relevance Score">${score}% Match</span>
          <span class="result-folder">${bm.folderTitle || 'Uncategorized'}</span>
        </div>
      </div>
      <div class="result-url">${bm.url}</div>
      <div class="result-snippet">${highlightedSnippet}</div>
    `;

    resultsList.appendChild(resultEl);
  });
}

function getFaviconUrl(u) {
  try {
    const urlObj = new URL(u);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
  } catch (e) {
    return 'icons/icon16.png';
  }
}
