const statusEl = document.getElementById('status');
const foldersContainer = document.getElementById('folders');
const refreshButton = document.getElementById('refresh');
const backToPopup = document.getElementById('back-to-popup');
const folderFilter = document.getElementById('folder-filter');
const folderSearch = document.getElementById('folder-search');
const dateFilter = document.getElementById('date-filter');
const themeToggle = document.getElementById('theme-toggle');
const THEME_KEY = 'smartBookmarkTheme';
let folderOptions = [];
let currentTree = null;
let currentFilterKey = 'all';
let currentSearch = '';
let currentDateFilter = '';
let currentTheme = 'light';

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
backToPopup.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/popup.html') });
});

initThemeToggle();

if (!chrome?.runtime?.sendMessage) {
  setStatus('Chrome extension APIs are unavailable in this preview. Load the extension to manage bookmarks.', 'error');
  refreshButton.disabled = true;
} else {
  initFilters();
  folderFilter.addEventListener('change', () => {
    currentFilterKey = folderFilter.value;
    renderFoldersFromState();
  });
  folderSearch.addEventListener('input', (event) => {
    currentSearch = event.target.value.toLowerCase();
    renderFoldersFromState();
  });
  dateFilter.addEventListener('change', (event) => {
    currentDateFilter = event.target.value;
    renderFoldersFromState();
  });
  loadTree();
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
    card.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({ bookmarkId: node.id, fromFolderId: node.parentId })
    );
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const destinationFolderId = formData.get('folder');
    const updates = {
      title: formData.get('title') || node.title,
      notes: formData.get('notes') || '',
      tags: (formData.get('tags') || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      reminder: formData.get('reminder') || ''
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
