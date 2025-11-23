const saveButton = document.getElementById('save-button');
const statusEl = document.getElementById('status');
const dashboardButton = document.getElementById('dashboard');

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
const newFolderInput = document.getElementById('new-folder-name');
const createFolderButton = document.getElementById('create-folder');
const reminderInput = document.getElementById('reminder-input');
const reminderText = document.getElementById('metadata-reminder');
const saveReminderButton = document.getElementById('save-reminder');

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
    const tree = await getTree();
    setupFolderEditor(tree, response.topic);
  }

  toggleLoading(false);
});

dashboardButton.addEventListener('click', () => openManager());
moveFolderButton.addEventListener('click', () => handleMove());
createFolderButton.addEventListener('click', () => handleCreateFolder());
saveReminderButton.addEventListener('click', () => handleSaveReminder());

getTree();

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
  reminderText.textContent = metadata.reminder
    ? `Reminder set for ${new Date(metadata.reminder).toLocaleString()}`
    : 'No reminder set';
  reminderInput.value = metadata.reminder ? formatForInput(metadata.reminder) : '';
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

async function getTree() {
  try {
    const tree = await chrome.runtime.sendMessage({ type: 'GET_TREE' });
    if (!tree || tree.error) {
      throw new Error(tree?.error || 'Unknown error loading bookmarks');
    }

    latestTree = tree;
    return tree;
  } catch (error) {
    console.error('Failed to render tree', error);
    latestTree = null;
    setStatus(error.message, 'error');
  }
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
    const tree = await getTree();
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

function openManager() {
  const url = chrome.runtime.getURL('src/manage.html');
  chrome.tabs.create({ url });
}

async function handleCreateFolder() {
  if (!lastSavedBookmarkId) {
    setStatus('Save a bookmark first to place it in a folder.', 'error');
    return;
  }

  const name = newFolderInput.value.trim();
  if (!name) {
    setStatus('Enter a folder name to create.', 'error');
    return;
  }

  toggleLoading(true);
  try {
    const createResponse = await chrome.runtime.sendMessage({ type: 'CREATE_FOLDER', title: name });
    if (createResponse?.error || !createResponse?.folderId) {
      throw new Error(createResponse?.error || 'Unable to create folder');
    }

    await chrome.runtime.sendMessage({
      type: 'MOVE_BOOKMARK',
      bookmarkId: lastSavedBookmarkId,
      destinationFolderId: createResponse.folderId
    });

    lastSavedTopic = name;
    setStatus(`Moved to ${name}`, 'success');
    const tree = await getTree();
    setupFolderEditor(tree, name);
    const metadata = await chrome.runtime.sendMessage({ type: 'GET_METADATA', bookmarkId: lastSavedBookmarkId });
    displayMetadata(metadata);
  } catch (error) {
    console.error('Failed to create folder', error);
    setStatus(error.message || 'Unable to create folder', 'error');
  } finally {
    toggleLoading(false);
  }
}

async function handleSaveReminder() {
  if (!lastSavedBookmarkId) {
    setStatus('Save a bookmark before adding a reminder.', 'error');
    return;
  }

  const reminder = reminderInput.value;
  toggleLoading(true);
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE_BOOKMARK',
      bookmarkId: lastSavedBookmarkId,
      updates: { reminder }
    });

    if (response?.error) {
      throw new Error(response.error);
    }

    const metadata = await chrome.runtime.sendMessage({ type: 'GET_METADATA', bookmarkId: lastSavedBookmarkId });
    displayMetadata(metadata);
    setStatus(reminder ? 'Reminder saved' : 'Reminder cleared', 'success');
  } catch (error) {
    console.error('Failed to save reminder', error);
    setStatus(error.message || 'Unable to save reminder', 'error');
  } finally {
    toggleLoading(false);
  }
}

function formatForInput(dateString) {
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
