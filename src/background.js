const SMART_ROOT_TITLE = 'Smart Bookmarks';
const DEFAULT_TOPIC = 'Unsorted';
const TOPIC_KEYWORDS = {
  Technology: ['tech', 'developer', 'software', 'ai', 'cloud', 'programming', 'code', 'api', 'framework'],
  Business: ['business', 'finance', 'startup', 'marketing', 'sales', 'economy', 'invest', 'product', 'growth'],
  Education: ['course', 'tutorial', 'learn', 'university', 'school', 'research', 'study', 'lesson'],
  Entertainment: ['movie', 'music', 'game', 'tv', 'show', 'podcast', 'film', 'trailer', 'celebrity'],
  News: ['news', 'breaking', 'politics', 'world', 'local', 'report', 'journal', 'article'],
  Design: ['design', 'ux', 'ui', 'graphic', 'illustration', 'typography', 'layout'],
  Science: ['science', 'biology', 'chemistry', 'physics', 'space', 'nature', 'health', 'medical'],
  Shopping: ['shop', 'store', 'deal', 'review', 'price', 'ecommerce', 'sale', 'cart'],
  Travel: ['travel', 'trip', 'hotel', 'flight', 'tour', 'destination', 'guide'],
  Sports: ['sport', 'game', 'team', 'match', 'league', 'tournament', 'score']
};

const SMART_ROOT_ID_KEY = 'smartRootId';

chrome.runtime.onInstalled.addListener(() => {
  ensureRootFolder();
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'SMART_BOOKMARK') {
    handleSmartBookmark().then(sendResponse).catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (request.type === 'GET_TREE') {
    getSmartTree().then(sendResponse).catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (request.type === 'GET_METADATA' && request.bookmarkId) {
    getStoredMetadata(request.bookmarkId).then(sendResponse).catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  return false;
});

async function handleSmartBookmark() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    throw new Error('No active tab to bookmark');
  }

  const pageMetadata = await collectPageMetadata(tab.id);
  const topic = chooseTopic(pageMetadata, tab);
  const rootId = await ensureRootFolder();
  const topicFolderId = await ensureTopicFolder(topic, rootId);

  const existingId = await findExistingBookmark(tab.url, topicFolderId);
  const bookmarkId = existingId || (await createBookmark(tab, topicFolderId));

  await storeMetadata(bookmarkId, topic, pageMetadata, tab.url, tab.title);

  return { topic, bookmarkId };
}

async function collectPageMetadata(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    func: () => {
      const description = document.querySelector('meta[name="description"]')?.content || '';
      const keywords = document.querySelector('meta[name="keywords"]')?.content || '';
      const ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
      const ogDescription = document.querySelector('meta[property="og:description"]')?.content || '';
      const bodyText = document.body?.innerText || '';
      const cleanedBody = bodyText.replace(/\s+/g, ' ').trim();
      const snippet = cleanedBody.slice(0, 260);

      return {
        description: ogDescription || description,
        keywords,
        ogTitle,
        snippet
      };
    }
  });

  return result.result;
}

function chooseTopic(pageMetadata, tab) {
  const text = `${tab.title} ${tab.url} ${pageMetadata.description} ${pageMetadata.keywords} ${pageMetadata.ogTitle} ${pageMetadata.snippet}`.toLowerCase();
  const scores = Object.entries(TOPIC_KEYWORDS).map(([topic, keywords]) => {
    const hits = keywords.reduce((count, keyword) => (text.includes(keyword) ? count + 1 : count), 0);
    return { topic, score: hits };
  });

  const best = scores.sort((a, b) => b.score - a.score)[0];
  if (!best || best.score === 0) {
    return DEFAULT_TOPIC;
  }

  return best.topic;
}

async function ensureRootFolder() {
  const cached = await chrome.storage.local.get(SMART_ROOT_ID_KEY);
  if (cached[SMART_ROOT_ID_KEY]) {
    return cached[SMART_ROOT_ID_KEY];
  }

  const matches = await chrome.bookmarks.search({ title: SMART_ROOT_TITLE });
  const existing = matches.find((item) => item.title === SMART_ROOT_TITLE && !item.url);
  if (existing) {
    await chrome.storage.local.set({ [SMART_ROOT_ID_KEY]: existing.id });
    return existing.id;
  }

  const created = await chrome.bookmarks.create({ title: SMART_ROOT_TITLE });
  await chrome.storage.local.set({ [SMART_ROOT_ID_KEY]: created.id });
  return created.id;
}

async function ensureTopicFolder(topic, rootId) {
  const children = await chrome.bookmarks.getChildren(rootId);
  const existing = children.find((child) => child.title === topic && !child.url);
  if (existing) {
    return existing.id;
  }

  const created = await chrome.bookmarks.create({ parentId: rootId, title: topic });
  return created.id;
}

async function findExistingBookmark(url, parentId) {
  const children = await chrome.bookmarks.getChildren(parentId);
  const match = children.find((child) => child.url === url);
  return match?.id || null;
}

async function createBookmark(tab, parentId) {
  const bookmark = await chrome.bookmarks.create({
    parentId,
    title: tab.title || tab.url,
    url: tab.url
  });
  return bookmark.id;
}

async function storeMetadata(bookmarkId, topic, pageMetadata, url, title) {
  const metadata = {
    id: bookmarkId,
    topic,
    url,
    title,
    description: pageMetadata.description || pageMetadata.snippet,
    snippet: pageMetadata.snippet,
    keywords: pageMetadata.keywords,
    savedAt: new Date().toISOString(),
    domain: new URL(url).hostname
  };

  const existing = await chrome.storage.local.get('smartMetadata');
  const allMetadata = existing.smartMetadata || {};
  allMetadata[bookmarkId] = metadata;
  await chrome.storage.local.set({ smartMetadata: allMetadata });
}

async function getStoredMetadata(bookmarkId) {
  const stored = await chrome.storage.local.get('smartMetadata');
  return (stored.smartMetadata || {})[bookmarkId] || null;
}

async function getSmartTree() {
  const rootId = await ensureRootFolder();
  const tree = await chrome.bookmarks.getSubTree(rootId);
  const stored = await chrome.storage.local.get('smartMetadata');
  const metadataMap = stored.smartMetadata || {};

  const enriched = enrichTree(tree[0], metadataMap);
  return enriched;
}

function enrichTree(node, metadataMap) {
  const item = {
    id: node.id,
    title: node.title,
    url: node.url,
    children: [],
    metadata: metadataMap[node.id] || null
  };

  if (node.children) {
    item.children = node.children.map((child) => enrichTree(child, metadataMap));
  }

  return item;
}
