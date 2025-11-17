const saveButton = document.getElementById('save-button');
const statusEl = document.getElementById('status');
const folderList = document.getElementById('folder-list');
const refreshButton = document.getElementById('refresh-tree');
const seeAllButton = document.getElementById('see-all');

const metadataCard = document.getElementById('metadata-card');
const metadataTopic = document.getElementById('metadata-topic');
const metadataTitle = document.getElementById('metadata-title');
const metadataDomain = document.getElementById('metadata-domain');
const metadataDate = document.getElementById('metadata-date');
const metadataDescription = document.getElementById('metadata-description');
const metadataSnippet = document.getElementById('metadata-snippet');
const metadataTags = document.getElementById('metadata-tags');
const folderEditor = document.getElementById('folder-editor');
const folderSelect = document.getElementById('folder-select');
const moveFolderButton = document.getElementById('move-folder');

let latestTree = null;
let lastSavedBookmarkId = null;
let lastSavedTopic = null;

saveButton.addEventListener('click', async () => {
  toggleLoading(true);
  setStatus('Categorizing tab and saving bookmark…', '');

  const response = await chrome.runtime.sendMessage({ type: 'SMART_BOOKMARK' });

  if (response?.error) {
    setStatus(response.error, 'error');
  } else {
    lastSavedBookmarkId = response.bookmarkId;
    lastSavedTopic = response.topic;
    const metadata = await chrome.runtime.sendMessage({ type: 'GET_METADATA', bookmarkId: response.bookmarkId });
    displayMetadata(metadata);
    setStatus(`Saved to ${response.topic}`, 'success');
    const tree = await renderTree();
    setupFolderEditor(tree, response.topic);
  }

  toggleLoading(false);
});

refreshButton.addEventListener('click', () => renderTree());
seeAllButton.addEventListener('click', () => openManager());
moveFolderButton.addEventListener('click', () => handleMove());

renderTree();

function toggleLoading(isLoading) {
  saveButton.disabled = isLoading;
  if (isLoading) {
    saveButton.textContent = 'Working…';
  } else {
    saveButton.textContent = 'Smart bookmark this tab';
  }
}

function setStatus(message, tone = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${tone}`.trim();
}

function displayMetadata(metadata) {
  if (!metadata) {
    metadataCard.classList.add('hidden');
    folderEditor.classList.add('hidden');
    return;
  }

  metadataCard.classList.remove('hidden');
  metadataTopic.textContent = metadata.topic;
  metadataTitle.textContent = metadata.title;
  metadataDomain.textContent = metadata.domain;
  metadataDate.textContent = new Date(metadata.savedAt).toLocaleString();
  metadataDescription.textContent = metadata.description || 'No description found';
  metadataSnippet.textContent = metadata.snippet || '';
  renderTags(metadata.tags || []);
}

function renderTags(tags) {
  if (!tags || tags.length === 0) {
    metadataTags.classList.add('hidden');
    metadataTags.innerHTML = '';
    return;
  }

  metadataTags.classList.remove('hidden');
  metadataTags.innerHTML = '';
  tags.slice(0, 12).forEach((tag) => {
    const chip = document.createElement('span');
    chip.className = 'tag';
    chip.textContent = tag;
    metadataTags.appendChild(chip);
  });
}

async function renderTree() {
  folderList.innerHTML = '<li class="muted">Loading tree…</li>';

  try {
    const tree = await chrome.runtime.sendMessage({ type: 'GET_TREE' });
    if (!tree || tree.error) {
      throw new Error(tree?.error || 'Unknown error loading bookmarks');
    }

    if (!tree.children || tree.children.length === 0) {
      folderList.innerHTML = '<li class="muted">No smart bookmarks yet.</li>';
      latestTree = tree;
      return;
    }

    folderList.innerHTML = '';
    tree.children.forEach((folder) => folderList.appendChild(renderFolder(folder)));
    latestTree = tree;
    return tree;
  } catch (error) {
    console.error('Failed to render tree', error);
    folderList.innerHTML = `<li class="muted">${error.message}</li>`;
    latestTree = null;
  }
}

function renderFolder(folder) {
  const li = document.createElement('li');
  li.className = 'folder';

  const heading = document.createElement('h3');
  heading.textContent = folder.title;
  li.appendChild(heading);

  const links = document.createElement('ul');
  if (!folder.children || folder.children.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'Empty folder';
    empty.className = 'muted';
    links.appendChild(empty);
  } else {
    folder.children.forEach((child) => {
      if (child.url) {
        const item = document.createElement('li');
        item.textContent = child.title || child.url;
        item.addEventListener('click', () => openUrl(child.url));
        links.appendChild(item);
      }
    });
  }

  li.appendChild(links);
  return li;
}

function setupFolderEditor(tree, selectedTopic) {
  if (!tree || !tree.children || tree.children.length === 0 || !lastSavedBookmarkId) {
    folderEditor.classList.add('hidden');
    return;
  }

  folderSelect.innerHTML = '';
  tree.children.forEach((folder) => {
    const option = document.createElement('option');
    option.value = folder.id;
    option.textContent = folder.title;
    if (folder.title === selectedTopic) {
      option.selected = true;
    }
    folderSelect.appendChild(option);
  });

  folderEditor.classList.remove('hidden');
}

async function handleMove() {
  if (!lastSavedBookmarkId || !folderSelect.value) {
    return;
  }

  toggleLoading(true);
  const destinationFolderId = folderSelect.value;
  const selectedTopic = folderSelect.options[folderSelect.selectedIndex]?.textContent || '';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'MOVE_BOOKMARK',
      bookmarkId: lastSavedBookmarkId,
      destinationFolderId
    });

    if (response?.error) {
      setStatus(response.error, 'error');
      return;
    }

    lastSavedTopic = selectedTopic;
    setStatus(`Moved to ${selectedTopic}`, 'success');
    metadataTopic.textContent = selectedTopic;
    const tree = await renderTree();
    setupFolderEditor(tree, selectedTopic);
    const metadata = await chrome.runtime.sendMessage({ type: 'GET_METADATA', bookmarkId: lastSavedBookmarkId });
    displayMetadata(metadata);
  } catch (error) {
    console.error('Failed to move bookmark', error);
    setStatus('Unable to move the bookmark', 'error');
  } finally {
    toggleLoading(false);
  }
}

function openUrl(url) {
  chrome.tabs.create({ url });
}

function openManager() {
  const url = chrome.runtime.getURL('src/manage.html');
  chrome.tabs.create({ url });
}
