const statusEl = document.getElementById('status');
const foldersContainer = document.getElementById('folders');
const refreshButton = document.getElementById('refresh');
const backToPopup = document.getElementById('back-to-popup');
const folderFilter = document.getElementById('folder-filter');
const folderSearch = document.getElementById('folder-search');
let folderOptions = [];
let currentTree = null;
let currentFilterKey = 'all';
let currentSearch = '';

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
  loadTree();
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
  const filtered = (currentTree.children || []).filter((folder) =>
    matchesFilter(folder.title, currentFilterKey) && matchesSearch(folder.title, currentSearch)
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
  filtered.forEach((folder) => foldersContainer.appendChild(renderFolder(folder, folderOptions)));
}

function matchesFilter(title, filterKey) {
  const normalized = (title || '').toLowerCase();
  const filter = FOLDER_FILTERS.find((item) => item.key === filterKey);
  if (!filter) return true;
  return filter.matcher(normalized);
}

function matchesSearch(title, term) {
  if (!term) return true;
  return (title || '').toLowerCase().includes(term);
}

function setStatus(message, tone = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${tone}`.trim();
}

function renderFolder(folder, allFolders) {
  const template = document.getElementById('folder-template');
  const clone = template.content.cloneNode(true);
  const card = clone.querySelector('.folder-card');
  const titleEl = clone.querySelector('.folder-title');
  const countEl = clone.querySelector('.folder-count');
  const bookmarksContainer = clone.querySelector('.bookmarks');
  const deleteBtn = clone.querySelector('.delete-folder');

  card.dataset.folderId = folder.id;
  titleEl.textContent = folder.title;
  const children = folder.children || [];
  const onlyLinks = children.filter((child) => child.url);
  countEl.textContent = `${onlyLinks.length} saved tab${onlyLinks.length === 1 ? '' : 's'}`;

  attachDropTarget(card, folder.id);
  deleteBtn.addEventListener('click', async () => {
    if (confirm(`Delete the folder "${folder.title}" and all its bookmarks?`)) {
      await chrome.runtime.sendMessage({ type: 'DELETE_NODE', nodeId: folder.id });
      loadTree();
    }
  });

  if (onlyLinks.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No bookmarks in this folder yet.';
    empty.className = 'empty';
    bookmarksContainer.appendChild(empty);
  } else {
    onlyLinks.forEach((child) => bookmarksContainer.appendChild(renderBookmark(child, folder.title, allFolders)));
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

  const metadata = node.metadata || {};
  const tags = (metadata.tags || []).filter(Boolean);

  card.dataset.bookmarkId = node.id;
  card.dataset.folderId = node.parentId || '';
  card.setAttribute('draggable', 'true');

  titleEl.textContent = node.title || node.url;
  domainEl.textContent = metadata.domain || new URL(node.url).hostname;
  descriptionEl.textContent = metadata.description || 'No description saved';
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
        .filter(Boolean)
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

  titleInput.value = node.title || node.url;
  notesInput.value = metadata.notes || '';
  tagsInput.value = (metadata.tags || []).join(', ');
  populateFolderSelect(folderSelect, allFolders, node.parentId);
}

function populateFolderSelect(select, folders, currentFolderId) {
  select.innerHTML = '';
  folders.forEach((folder) => {
    const option = document.createElement('option');
    option.value = folder.id;
    option.textContent = folder.title;
    if (folder.id === currentFolderId) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function flattenFolders(nodes, acc = []) {
  nodes.forEach((node) => {
    if (!node.url) {
      acc.push({ id: node.id, title: node.title });
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
