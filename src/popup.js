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
const metadataIcon = document.getElementById('metadata-icon');
const mlBadge = document.getElementById('ml-badge');
const folderEditor = document.getElementById('folder-editor');
const folderSelect = document.getElementById('folder-select');
const moveFolderButton = document.getElementById('move-folder');
const newFolderInput = document.getElementById('new-folder-name');
const newFolderColor = document.getElementById('new-folder-color');
const createFolderButton = document.getElementById('create-folder');
const reminderInput = document.getElementById('reminder-input');
const reminderText = document.getElementById('metadata-reminder');
const saveReminderButton = document.getElementById('save-reminder');

let latestTree = null;
let lastSavedBookmarkId = null;
let lastSavedTopic = null;
let manualFolderColor = false;
newFolderColor.value = suggestColorFromSeed('Smart Bookmark');

// Request notification permission early so reminders can schedule without missing alarms.
primeReminderSupport();

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
newFolderInput.addEventListener('input', () => {
  if (manualFolderColor) return;
  newFolderColor.value = suggestColorFromSeed(newFolderInput.value || 'Smart Bookmark');
});
newFolderColor.addEventListener('input', () => {
  manualFolderColor = true;
});

getTree();

function toggleLoading(isLoading) {
  saveButton.disabled = isLoading;
  if (isLoading) {
    saveButton.textContent = 'Working…';
  } else {
    saveButton.textContent = 'Smart bookmark this tab';
  }
}

async function primeReminderSupport() {
  try {
    await ensureNotificationPermission();
    await chrome.runtime.sendMessage({ type: 'ENSURE_REMINDERS_READY' });
  } catch (error) {
    console.warn('Unable to prepare reminder support', error);
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

  // Show ML badge if ML was used
  if (metadata.mlUsed && mlBadge) {
    mlBadge.classList.remove('hidden');
    mlBadge.title = `Classified using Machine Learning (${Math.round(metadata.mlConfidence * 100)}% confidence)`;
  } else if (mlBadge) {
    mlBadge.classList.add('hidden');
  }

  metadataTitle.textContent = metadata.title;
  metadataDomain.textContent = metadata.domain;

  if (metadata.iconUrl) {
    metadataIcon.src = metadata.iconUrl;
    metadataIcon.classList.remove('hidden');
  } else {
    metadataIcon.classList.add('hidden');
  }

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

  manualFolderColor = false;
  newFolderColor.value = suggestColorFromSeed(selectedTopic || 'Smart Bookmark');

  folderSelect.innerHTML = '';
  tree.children.forEach((folder) => {
    const option = document.createElement('option');
    option.value = folder.id;
    option.textContent = folder.title;
    if (folder.color?.surface) {
      option.style.backgroundColor = folder.color.surface;
    }
    if (folder.color?.text) {
      option.style.color = folder.color.text;
    }
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
    const preferredColor = manualFolderColor ? newFolderColor.value : '';
    const createResponse = await chrome.runtime.sendMessage({
      type: 'CREATE_FOLDER',
      title: name,
      color: preferredColor
    });
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
    newFolderInput.value = '';
    manualFolderColor = false;
    newFolderColor.value = suggestColorFromSeed(lastSavedTopic || 'Smart Bookmark');
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

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) {
    setStatus('Enable notifications to receive reminders.', 'error');
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

function suggestColorFromSeed(seed) {
  const hash = hashString(seed || 'smart-folder');
  const hue = (hash * 137.508) % 360;
  const saturation = 62 + (hash % 18);
  const lightness = 58 - (hash % 12);
  return hslToHex(hue, saturation, lightness);
}

function hashString(input) {
  return input
    .split('')
    .reduce((hash, char) => (Math.imul(31, hash) + char.charCodeAt(0)) >>> 0, 0);
}

function hslToHex(h, s, l) {
  const normalizedS = Math.max(0, Math.min(100, s)) / 100;
  const normalizedL = Math.max(0, Math.min(100, l)) / 100;
  const a = normalizedS * Math.min(normalizedL, 1 - normalizedL);

  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = normalizedL - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}
