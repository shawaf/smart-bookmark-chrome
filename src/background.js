const SMART_ROOT_TITLE = 'Smart Bookmarks';
const DEFAULT_TOPIC = 'Unsorted';
const TOPIC_PROFILES = [
  {
    name: 'Software Engineering',
    keywords: [
      'developer',
      'software',
      'programming',
      'code',
      'api',
      'framework',
      'cloud',
      'engineering',
      'systems',
      'devops'
    ],
    strongKeywords: ['javascript', 'python', 'java', 'kubernetes', 'k8s', 'docker', 'ci/cd', 'deployment', 'interview', 'system design'],
    domainKeywords: ['dev', 'github', 'gitlab', 'stack', 'tech']
  },
  {
    name: 'Technology',
    keywords: ['tech', 'hardware', 'device', 'gadget', 'electronics', 'api', 'framework', 'ai'],
    strongKeywords: ['laptop', 'chip', 'smartphone', 'headphones', 'wearable'],
    domainKeywords: ['dev', 'github', 'gitlab', 'stack', 'tech']
  },
  {
    name: 'Finance & Banking',
    keywords: ['finance', 'bank', 'banking', 'fintech', 'money', 'credit', 'loan', 'payment', 'interest', 'account'],
    strongKeywords: ['investment', 'stocks', 'trading', 'crypto', 'forex', 'card'],
    domainKeywords: ['bank', 'pay', 'finance', 'money', 'visa', 'mastercard']
  },
  {
    name: 'Business & Work',
    keywords: ['business', 'startup', 'marketing', 'sales', 'product', 'growth', 'work', 'management', 'leadership'],
    strongKeywords: ['strategy', 'revenue', 'profit', 'staff', 'team', 'org'],
    domainKeywords: ['business', 'corp', 'company']
  },
  {
    name: 'Education & Learning',
    keywords: ['course', 'tutorial', 'learn', 'university', 'school', 'research', 'study', 'lesson', 'guide'],
    strongKeywords: ['how to', 'introduction', 'handbook', 'syllabus'],
    domainKeywords: ['academy', 'edu', 'school', 'learn']
  },
  {
    name: 'Entertainment & Media',
    keywords: ['movie', 'music', 'game', 'tv', 'show', 'podcast', 'film', 'trailer', 'celebrity', 'youtube'],
    strongKeywords: ['review', 'episode', 'season', 'playlist'],
    domainKeywords: ['youtube', 'spotify', 'netflix', 'hulu']
  },
  {
    name: 'News & Politics',
    keywords: ['news', 'breaking', 'politics', 'world', 'local', 'report', 'journal', 'article'],
    strongKeywords: ['election', 'policy', 'government'],
    domainKeywords: ['news', 'times', 'daily']
  },
  {
    name: 'Design & Creative',
    keywords: ['design', 'ux', 'ui', 'graphic', 'illustration', 'typography', 'layout', 'branding'],
    strongKeywords: ['figma', 'sketch', 'adobe'],
    domainKeywords: ['design', 'dribbble', 'behance']
  },
  {
    name: 'Science & Health',
    keywords: ['science', 'biology', 'chemistry', 'physics', 'space', 'nature', 'health', 'medical'],
    strongKeywords: ['research', 'study', 'clinic', 'disease', 'wellness'],
    domainKeywords: ['med', 'sci', 'health']
  },
  {
    name: 'Shopping & Reviews',
    keywords: ['shop', 'store', 'deal', 'review', 'price', 'ecommerce', 'sale', 'cart', 'buy'],
    strongKeywords: ['best', 'vs', 'comparison'],
    domainKeywords: ['shop', 'store', 'amazon', 'ebay']
  },
  {
    name: 'Travel & Places',
    keywords: ['travel', 'trip', 'hotel', 'flight', 'tour', 'destination', 'guide', 'itinerary'],
    strongKeywords: ['visa', 'airport', 'airline', 'booking'],
    domainKeywords: ['travel', 'air', 'hotel']
  },
  {
    name: 'Sports & Fitness',
    keywords: ['sport', 'game', 'team', 'match', 'league', 'tournament', 'score', 'fitness', 'workout'],
    strongKeywords: ['championship', 'cup', 'season'],
    domainKeywords: ['sports', 'espn', 'nba', 'fifa']
  },
  {
    name: 'Faith & Spirituality',
    keywords: ['faith', 'religion', 'spiritual', 'prayer', 'worship', 'bible', 'church', 'quran', 'dua', 'azkar', 'اذكار', 'أذكار', 'اسلام', 'إسلام', 'مسجد'],
    strongKeywords: ['sermon', 'verses', 'psalm', 'hadith'],
    domainKeywords: ['church', 'mosque', 'islam', 'bible', 'quran']
  }
];

const SMART_ROOT_ID_KEY = 'smartRootId';
const TAG_HINTS = {
  kubernetes: ['kubernetes', 'k8s'],
  docker: ['docker', 'container'],
  deployment: ['deploy', 'deployment', 'release'],
  interview: ['interview', 'interviews'],
  podcast: ['podcast'],
  youtube: ['youtube'],
  cloud: ['cloud', 'aws', 'gcp', 'azure'],
  devops: ['devops', 'ci/cd', 'pipeline'],
  banking: ['bank', 'banking', 'finance', 'fintech'],
  faith: ['quran', 'bible', 'prayer', 'dua', 'اذكار', 'أذكار', 'إسلام', 'islam'],
  entertainment: ['music', 'movie', 'film', 'tv', 'show', 'playlist'],
  research: ['research', 'study'],
  travel: ['travel', 'trip', 'flight', 'hotel']
};

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

  if (request.type === 'UPDATE_BOOKMARK' && request.bookmarkId) {
    updateBookmark(request.bookmarkId, request.updates)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (request.type === 'DELETE_NODE' && request.nodeId) {
    deleteNode(request.nodeId)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (request.type === 'MOVE_BOOKMARK' && request.bookmarkId && request.destinationFolderId) {
    moveBookmark(request.bookmarkId, request.destinationFolderId)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
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
  const tags = deriveTags(pageMetadata, tab, topic);
  const rootId = await ensureRootFolder();
  const topicFolderId = await ensureTopicFolder(topic, rootId);

  const existingId = await findExistingBookmark(tab.url, topicFolderId);
  const bookmarkId = existingId || (await createBookmark(tab, topicFolderId));

  await storeMetadata(bookmarkId, topic, pageMetadata, tab.url, tab.title, tags);

  return { topic, bookmarkId, tags };
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
  const url = new URL(tab.url);
  const domain = url.hostname.replace(/www\./, '').toLowerCase();
  const pathText = url.pathname.replace(/[^a-z0-9]+/gi, ' ').toLowerCase();
  const baseSignals = {
    keywords: (pageMetadata.keywords || '').toLowerCase(),
    description: (pageMetadata.description || '').toLowerCase(),
    ogTitle: (pageMetadata.ogTitle || '').toLowerCase(),
    snippet: (pageMetadata.snippet || '').toLowerCase(),
    title: (tab.title || '').toLowerCase(),
    path: pathText,
    domain
  };

  const scored = TOPIC_PROFILES.map((profile) => {
    const score =
      scoreText(baseSignals.keywords, profile, 4) +
      scoreText(baseSignals.description, profile, 3) +
      scoreText(baseSignals.ogTitle, profile, 3) +
      scoreText(baseSignals.snippet, profile, 2) +
      scoreText(baseSignals.path, profile, 2) +
      scoreText(baseSignals.title, profile, 1) +
      scoreDomain(baseSignals.domain, profile);

    return { topic: profile.name, score };
  });

  const best = scored.sort((a, b) => b.score - a.score)[0];
  if (!best || best.score === 0) {
    return DEFAULT_TOPIC;
  }

  return best.topic;
}

function scoreText(text, profile, weight) {
  if (!text) return 0;
  return (
    countHits(text, profile.keywords, weight) +
    countHits(text, profile.strongKeywords || [], weight * 2)
  );
}

function scoreDomain(domain, profile) {
  if (!domain || !profile.domainKeywords) return 0;
  // Keep a lower weighting on domain hits so metadata drives the topic choice.
  return countHits(domain, profile.domainKeywords, 0.8);
}

function countHits(text, keywords, weight = 1) {
  if (!keywords || keywords.length === 0 || !text) return 0;
  return keywords.reduce((count, keyword) => (text.includes(keyword) ? count + weight : count), 0);
}

function deriveTags(pageMetadata, tab, topic) {
  const collectedText = `${tab.title} ${tab.url} ${pageMetadata.description} ${pageMetadata.keywords} ${pageMetadata.ogTitle} ${pageMetadata.snippet}`
    .toLowerCase();

  const tags = new Set();

  Object.entries(TAG_HINTS).forEach(([tag, keywords]) => {
    const matched = keywords.some((keyword) => collectedText.includes(keyword.toLowerCase()));
    if (matched) {
      tags.add(tag);
    }
  });

  if (topic && topic !== DEFAULT_TOPIC) {
    tags.add(topic.toLowerCase());
  }

  return Array.from(tags);
}

async function ensureRootFolder() {
  const cached = await chrome.storage.local.get(SMART_ROOT_ID_KEY);
  if (cached[SMART_ROOT_ID_KEY]) {
    try {
      const [existing] = await chrome.bookmarks.get(cached[SMART_ROOT_ID_KEY]);
      if (existing) {
        return existing.id;
      }
    } catch (error) {
      await chrome.storage.local.remove(SMART_ROOT_ID_KEY);
    }
  }

  const matches = await chrome.bookmarks.search({ title: SMART_ROOT_TITLE });
  const folders = matches.filter((item) => item.title === SMART_ROOT_TITLE && !item.url);

  if (folders.length > 0) {
    const withCounts = await Promise.all(
      folders.map(async (folder) => ({
        folder,
        childCount: (await chrome.bookmarks.getChildren(folder.id)).length
      }))
    );

    const best = withCounts.sort((a, b) => b.childCount - a.childCount)[0].folder;
    await chrome.storage.local.set({ [SMART_ROOT_ID_KEY]: best.id });
    return best.id;
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

async function storeMetadata(bookmarkId, topic, pageMetadata, url, title, tags = []) {
  const existing = await chrome.storage.local.get('smartMetadata');
  const allMetadata = existing.smartMetadata || {};
  const previous = allMetadata[bookmarkId] || {};

  const metadata = {
    id: bookmarkId,
    topic,
    url,
    title,
    description: pageMetadata.description || pageMetadata.snippet,
    snippet: pageMetadata.snippet,
    keywords: pageMetadata.keywords,
    savedAt: previous.savedAt || new Date().toISOString(),
    domain: new URL(url).hostname,
    notes: previous.notes || '',
    tags: tags.length > 0 ? tags : previous.tags || []
  };

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

function enrichTree(node, metadataMap, parentId = null) {
  const item = {
    id: node.id,
    title: node.title,
    url: node.url,
    parentId,
    children: [],
    metadata: metadataMap[node.id] || null
  };

  if (node.children) {
    item.children = node.children.map((child) => enrichTree(child, metadataMap, node.id));
  }

  return item;
}

async function updateBookmark(bookmarkId, updates = {}) {
  const metadataMap = await chrome.storage.local.get('smartMetadata');
  const stored = metadataMap.smartMetadata || {};
  const [bookmarkNode] = await chrome.bookmarks.get(bookmarkId);

  if (updates.title || updates.url) {
    await chrome.bookmarks.update(bookmarkId, {
      title: updates.title,
      url: updates.url
    });
  }

  if (!stored[bookmarkId]) {
    stored[bookmarkId] = {
      id: bookmarkId,
      topic: DEFAULT_TOPIC,
      url: bookmarkNode.url,
      title: bookmarkNode.title,
      description: '',
      snippet: '',
      keywords: '',
      savedAt: new Date().toISOString(),
      domain: bookmarkNode.url ? new URL(bookmarkNode.url).hostname : '',
      notes: '',
      tags: []
    };
  }

  stored[bookmarkId] = {
    ...stored[bookmarkId],
    ...('notes' in updates ? { notes: updates.notes } : {}),
    ...('tags' in updates ? { tags: updates.tags } : {}),
    ...('description' in updates ? { description: updates.description } : {}),
    ...('title' in updates ? { title: updates.title } : {})
  };
  await chrome.storage.local.set({ smartMetadata: stored });

  return { ok: true };
}

async function moveBookmark(bookmarkId, destinationFolderId) {
  const [destination] = await chrome.bookmarks.get(destinationFolderId);
  if (!destination || destination.url) {
    throw new Error('Destination must be a folder');
  }

  const [bookmark] = await chrome.bookmarks.get(bookmarkId);
  if (!bookmark || bookmark.url === undefined) {
    throw new Error('Only bookmarks can be moved');
  }

  await chrome.bookmarks.move(bookmarkId, { parentId: destinationFolderId });

  const metadataMap = await chrome.storage.local.get('smartMetadata');
  const stored = metadataMap.smartMetadata || {};
  if (stored[bookmarkId]) {
    stored[bookmarkId].topic = destination.title || stored[bookmarkId].topic || DEFAULT_TOPIC;
    await chrome.storage.local.set({ smartMetadata: stored });
  }

  return { ok: true };
}

async function deleteNode(nodeId) {
  const rootId = await ensureRootFolder();
  if (nodeId === rootId) {
    throw new Error('Cannot delete the smart bookmarks root folder');
  }

  const metadataMap = await chrome.storage.local.get('smartMetadata');
  const stored = metadataMap.smartMetadata || {};

  const [target] = await chrome.bookmarks.getSubTree(nodeId);

  if (target.children && target.children.length > 0) {
    await chrome.bookmarks.removeTree(nodeId);
    removeMetadataForBranch(target, stored);
  } else {
    await chrome.bookmarks.remove(nodeId);
    delete stored[nodeId];
  }

  await chrome.storage.local.set({ smartMetadata: stored });
  return { ok: true };
}

function removeMetadataForBranch(node, metadataMap) {
  delete metadataMap[node.id];
  if (!node.children) return;
  node.children.forEach((child) => removeMetadataForBranch(child, metadataMap));
}
