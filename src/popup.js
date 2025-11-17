const saveButton = document.getElementById('save-button');
const statusEl = document.getElementById('status');
const folderList = document.getElementById('folder-list');
const refreshButton = document.getElementById('refresh-tree');

const metadataCard = document.getElementById('metadata-card');
const metadataTopic = document.getElementById('metadata-topic');
const metadataTitle = document.getElementById('metadata-title');
const metadataDomain = document.getElementById('metadata-domain');
const metadataDate = document.getElementById('metadata-date');
const metadataDescription = document.getElementById('metadata-description');
const metadataSnippet = document.getElementById('metadata-snippet');

saveButton.addEventListener('click', async () => {
  toggleLoading(true);
  setStatus('Categorizing tab and saving bookmark…', '');

  const response = await chrome.runtime.sendMessage({ type: 'SMART_BOOKMARK' });

  if (response?.error) {
    setStatus(response.error, 'error');
  } else {
    const metadata = await chrome.runtime.sendMessage({ type: 'GET_METADATA', bookmarkId: response.bookmarkId });
    displayMetadata(metadata);
    setStatus(`Saved to ${response.topic}`, 'success');
    renderTree();
  }

  toggleLoading(false);
});

refreshButton.addEventListener('click', () => renderTree());

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
    return;
  }

  metadataCard.classList.remove('hidden');
  metadataTopic.textContent = metadata.topic;
  metadataTitle.textContent = metadata.title;
  metadataDomain.textContent = metadata.domain;
  metadataDate.textContent = new Date(metadata.savedAt).toLocaleString();
  metadataDescription.textContent = metadata.description || 'No description found';
  metadataSnippet.textContent = metadata.snippet || '';
}

async function renderTree() {
  folderList.innerHTML = '<li class="muted">Loading tree…</li>';
  const tree = await chrome.runtime.sendMessage({ type: 'GET_TREE' });
  if (!tree || tree.children.length === 0) {
    folderList.innerHTML = '<li class="muted">No smart bookmarks yet.</li>';
    return;
  }

  folderList.innerHTML = '';
  tree.children.forEach((folder) => folderList.appendChild(renderFolder(folder)));
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

function openUrl(url) {
  chrome.tabs.create({ url });
}
