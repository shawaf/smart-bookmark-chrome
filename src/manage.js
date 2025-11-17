const statusEl = document.getElementById('status');
const foldersContainer = document.getElementById('folders');
const refreshButton = document.getElementById('refresh');
const backToPopup = document.getElementById('back-to-popup');

refreshButton.addEventListener('click', loadTree);
backToPopup.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/popup.html') });
});

if (!chrome?.runtime?.sendMessage) {
  setStatus('Chrome extension APIs are unavailable in this preview. Load the extension to manage bookmarks.', 'error');
  refreshButton.disabled = true;
  return;
}

loadTree();

async function loadTree() {
  setStatus('Loading folders…', '');
  const tree = await chrome.runtime.sendMessage({ type: 'GET_TREE' });
  if (!tree || !tree.children || tree.children.length === 0) {
    setStatus('No smart bookmarks yet. Save a tab to get started.', '');
    foldersContainer.innerHTML = '';
    return;
  }

  setStatus(`Found ${tree.children.length} folders`, 'success');
  foldersContainer.innerHTML = '';

  tree.children.forEach((folder) => foldersContainer.appendChild(renderFolder(folder)));
}

function setStatus(message, tone = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${tone}`.trim();
}

function renderFolder(folder) {
  const template = document.getElementById('folder-template');
  const clone = template.content.cloneNode(true);
  const titleEl = clone.querySelector('.folder-title');
  const bookmarksContainer = clone.querySelector('.bookmarks');
  const deleteBtn = clone.querySelector('.delete-folder');

  titleEl.textContent = folder.title;
  deleteBtn.addEventListener('click', async () => {
    if (confirm(`Delete the folder "${folder.title}" and all its bookmarks?`)) {
      await chrome.runtime.sendMessage({ type: 'DELETE_NODE', nodeId: folder.id });
      loadTree();
    }
  });

  const children = folder.children || [];
  const onlyLinks = children.filter((child) => child.url);
  if (onlyLinks.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No bookmarks in this folder yet.';
    empty.className = 'empty';
    bookmarksContainer.appendChild(empty);
  } else {
    onlyLinks.forEach((child) => bookmarksContainer.appendChild(renderBookmark(child, folder.title)));
  }

  return clone;
}

function renderBookmark(node, topic) {
  const template = document.getElementById('bookmark-template');
  const clone = template.content.cloneNode(true);
  const titleEl = clone.querySelector('.title');
  const domainEl = clone.querySelector('.domain');
  const descriptionEl = clone.querySelector('.description');
  const topicEl = clone.querySelector('.topic');
  const notesEl = clone.querySelector('.notes');
  const tagsEl = clone.querySelector('.tags');
  const openBtn = clone.querySelector('.open');
  const editBtn = clone.querySelector('.edit');
  const deleteBtn = clone.querySelector('.delete');
  const form = clone.querySelector('.edit-form');
  const cancelBtn = clone.querySelector('.cancel');

  const metadata = node.metadata || {};
  const tags = (metadata.tags || []).filter(Boolean);

  titleEl.textContent = node.title || node.url;
  domainEl.textContent = metadata.domain || new URL(node.url).hostname;
  descriptionEl.textContent = metadata.description || 'No description saved';
  topicEl.textContent = topic;
  notesEl.textContent = metadata.notes ? `Notes: ${metadata.notes}` : '';
  tagsEl.textContent = tags.length > 0 ? tags.join(', ') : '';

  openBtn.addEventListener('click', () => chrome.tabs.create({ url: node.url }));
  deleteBtn.addEventListener('click', async () => {
    if (confirm('Delete this bookmark?')) {
      await chrome.runtime.sendMessage({ type: 'DELETE_NODE', nodeId: node.id });
      loadTree();
    }
  });

  editBtn.addEventListener('click', () => {
    populateForm(form, node, metadata);
    form.classList.remove('hidden');
  });

  cancelBtn.addEventListener('click', () => {
    form.reset();
    form.classList.add('hidden');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const updates = {
      title: formData.get('title') || node.title,
      notes: formData.get('notes') || '',
      tags: (formData.get('tags') || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    };

    await chrome.runtime.sendMessage({ type: 'UPDATE_BOOKMARK', bookmarkId: node.id, updates });
    form.classList.add('hidden');
    loadTree();
  });

  return clone;
}

function populateForm(form, node, metadata) {
  const titleInput = form.querySelector('input[name="title"]');
  const notesInput = form.querySelector('textarea[name="notes"]');
  const tagsInput = form.querySelector('input[name="tags"]');

  titleInput.value = node.title || node.url;
  notesInput.value = metadata.notes || '';
  tagsInput.value = (metadata.tags || []).join(', ');
}
