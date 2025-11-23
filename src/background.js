const SMART_ROOT_TITLE = 'Smart Bookmarks';
const DEFAULT_TOPIC = 'Unsorted';
const ICON_DATA_PATH = 'src/icon-base64.json';
const ICON_SIZES = [16, 48, 128];
const TOPIC_PROFILES = [
  {
    name: 'Data Structures & Algorithms',
    keywords: [
      'data structure',
      'data structures',
      'algorithm',
      'algorithms',
      'complexity',
      'dynamic programming',
      'graph',
      'tree',
      'sorting',
      'searching',
      'heap',
      'stack',
      'queue'
    ],
    strongKeywords: [
      'dsa',
      'leetcode',
      'binary tree',
      'trie',
      'bfs',
      'dfs',
      'backtracking',
      'time complexity',
      'space complexity',
      'big o'
    ],
    domainKeywords: ['leetcode', 'geeksforgeeks', 'hackerrank', 'codeforces', 'topcoder', 'codechef']
  },
  {
    name: 'Software Architecture & Design',
    keywords: [
      'architecture',
      'architect',
      'design pattern',
      'patterns',
      'system design',
      'microservices',
      'event driven',
      'domain driven',
      'ddd',
      'clean architecture',
      'scalability',
      'performance'
    ],
    strongKeywords: ['cqrs', 'event sourcing', 'hexagonal', 'onion architecture', 'saga', 'orchestration', 'choreography'],
    domainKeywords: ['martinfowler', 'infoq', 'microservices', 'architecture']
  },
  {
    name: 'Engineering Management & Leadership',
    keywords: [
      'engineering management',
      'tech lead',
      'leadership',
      'staff engineer',
      'principal engineer',
      'team lead',
      'org design',
      'career ladder',
      'mentoring',
      'people management'
    ],
    strongKeywords: ['performance review', 'one-on-one', 'stakeholder', 'roadmap', 'strategy', 'execution'],
    domainKeywords: ['leaddev', 'cto', 'vp engineering']
  },
  {
    name: 'React & Frontend Engineering',
    keywords: ['frontend', 'front-end', 'ui', 'component', 'spa', 'web app', 'client', 'hooks'],
    strongKeywords: [
      'react',
      'nextjs',
      'next.js',
      'jsx',
      'redux',
      'tailwind',
      'vite',
      'webpack',
      'storybook',
      'router'
    ],
    domainKeywords: ['reactjs', 'nextjs', 'vercel', 'vitejs', 'tailwindcss']
  },
  {
    name: 'Backend & APIs',
    keywords: ['backend', 'server', 'api', 'graphql', 'rest', 'microservice', 'crud', 'auth', 'database', 'sql', 'queue'],
    strongKeywords: [
      'express',
      'nestjs',
      'fastapi',
      'django',
      'flask',
      'spring',
      'rails',
      'laravel',
      'kafka',
      'rabbitmq',
      'postgres',
      'mysql',
      'redis',
      'serverless',
      'lambda'
    ],
    domainKeywords: ['api', 'backend', 'server', 'postgres', 'mysql', 'supabase', 'railway', 'render', 'heroku']
  },
  {
    name: 'Software Engineering Interviews',
    keywords: ['interview', 'system design', 'coding challenge', 'behavioral', 'leetcode', 'faang', 'dsa', 'algorithm'],
    strongKeywords: ['mock interview', 'whiteboard', 'big o', 'data structures', 'interviewer'],
    domainKeywords: ['leetcode', 'pramp', 'interviewing', 'glassdoor']
  },
  {
    name: 'DevOps & Delivery',
    keywords: ['devops', 'ci', 'cd', 'pipeline', 'deployment', 'release', 'automation', 'infrastructure', 'observability', 'monitoring'],
    strongKeywords: [
      'kubernetes',
      'k8s',
      'docker',
      'terraform',
      'ansible',
      'helm',
      'argo',
      'github actions',
      'jenkins',
      'circleci',
      'prometheus',
      'grafana',
      'sre'
    ],
    domainKeywords: ['kubernetes', 'docker', 'terraform', 'jenkins', 'argo', 'prometheus', 'grafana', 'circleci']
  },
  {
    name: 'Software Engineering (General)',
    keywords: ['developer', 'software', 'programming', 'code', 'cloud', 'engineering', 'systems', 'refactor', 'debug'],
    strongKeywords: ['javascript', 'python', 'java', 'architecture'],
    domainKeywords: ['dev', 'github', 'gitlab', 'stack', 'tech']
  },
  {
    name: 'Education: Language Learning',
    keywords: [
      'language learning',
      'learn english',
      'vocabulary',
      'grammar',
      'pronunciation',
      'listening practice',
      'spanish',
      'arabic',
      'french',
      'german',
      'japanese',
      'korean'
    ],
    strongKeywords: ['ielts', 'toefl', 'duolingo english', 'flashcards', 'anki'],
    domainKeywords: ['duolingo', 'babbel', 'memrise']
  },
  {
    name: 'Education: Instructional Design & LMS',
    keywords: [
      'instructional design',
      'curriculum',
      'syllabus',
      'lesson plan',
      'assessment',
      'grading',
      'learning management',
      'lms',
      'course design',
      'rubric',
      'pedagogy'
    ],
    strongKeywords: ['scorm', 'canvas lms', 'moodle', 'blackboard', 'brightspace'],
    domainKeywords: ['canvas', 'moodle', 'udemy', 'coursera']
  },
  {
    name: 'Education: Business & Marketing Learning',
    keywords: [
      'marketing course',
      'growth marketing',
      'seo training',
      'ads tutorial',
      'copywriting course',
      'digital marketing',
      'campaign management',
      'content strategy'
    ],
    strongKeywords: ['meta ads', 'google ads', 'hubspot academy', 'ahrefs', 'semrush'],
    domainKeywords: ['hubspot', 'ahrefs', 'semrush', 'udemy', 'coursera']
  },
  {
    name: 'Education & Learning',
    keywords: ['course', 'tutorial', 'learn', 'university', 'school', 'research', 'study', 'lesson', 'guide'],
    strongKeywords: ['how to', 'introduction', 'handbook', 'syllabus'],
    domainKeywords: ['academy', 'edu', 'school', 'learn']
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
    name: 'Entertainment & Media',
    keywords: ['movie', 'music', 'game', 'tv', 'show', 'podcast', 'film', 'trailer', 'celebrity', 'youtube'],
    strongKeywords: ['review', 'episode', 'season', 'playlist', 'livestream'],
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
  architecture: ['architecture', 'system design', 'microservices', 'design pattern', 'ddd', 'cqrs', 'event sourcing'],
  react: ['react', 'jsx', 'hooks', 'redux'],
  nextjs: ['nextjs', 'next.js', 'vercel'],
  frontend: ['frontend', 'ui', 'component', 'tailwind', 'spa'],
  backend: ['backend', 'server', 'api', 'graphql', 'rest'],
  testing: ['testing', 'qa', 'unit test', 'integration test', 'e2e', 'jest', 'cypress', 'playwright'],
  leadership: ['leadership', 'management', 'strategy', 'staff engineer', 'principal engineer', 'roadmap'],
  microservices: ['microservice', 'microservices'],
  database: ['postgres', 'mysql', 'redis', 'database', 'sql', 'mongodb'],
  kubernetes: ['kubernetes', 'k8s'],
  docker: ['docker', 'container'],
  deployment: ['deploy', 'deployment', 'release'],
  cicd: ['ci/cd', 'pipeline', 'github actions', 'jenkins', 'circleci'],
  interview: ['interview', 'interviews', 'leetcode', 'system design', 'mock interview'],
  podcast: ['podcast'],
  youtube: ['youtube'],
  cloud: ['cloud', 'aws', 'gcp', 'azure'],
  devops: ['devops', 'sre'],
  banking: ['bank', 'banking', 'finance', 'fintech'],
  faith: ['quran', 'bible', 'prayer', 'dua', 'اذكار', 'أذكار', 'إسلام', 'islam'],
  entertainment: ['music', 'movie', 'film', 'tv', 'show', 'playlist'],
  research: ['research', 'study'],
  travel: ['travel', 'trip', 'flight', 'hotel'],
  language: ['vocabulary', 'grammar', 'learn english', 'ielts', 'toefl'],
  marketing: ['marketing', 'seo', 'growth', 'ads'],
  lms: ['lms', 'canvas', 'moodle', 'course design'],
  dsa: ['data structure', 'algorithm', 'leetcode', 'graph', 'tree', 'sorting', 'searching'],
  course: ['udemy', 'coursera', 'almentor', 'edx', 'udacity', 'skillshare', 'pluralsight', 'linkedin learning'],
  tutorial: ['playlist', 'tutorial', 'walkthrough', 'crash course', 'how to', 'guide'],
  interview_prep: ['interview prep', 'mock interview', 'behavioral', 'system design']
};

let iconDataCache = null;

scheduleDynamicIconRefresh();

if (chrome.runtime?.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    scheduleDynamicIconRefresh();
  });
}

chrome.runtime.onInstalled.addListener(() => {
  scheduleDynamicIconRefresh();
  ensureRootFolder();
});

function scheduleDynamicIconRefresh() {
  const maybePromise = applyDynamicActionIcon();
  if (maybePromise && typeof maybePromise.catch === 'function') {
    maybePromise.catch((error) => console.warn('Failed to prepare action icon', error));
  }
}

async function applyDynamicActionIcon() {
  if (!chrome?.action?.setIcon) {
    return null;
  }

  const imageDataMap = {};
  const base64Map = await loadIconData();

  for (const size of ICON_SIZES) {
    let imageData = null;
    if (base64Map && base64Map[String(size)]) {
      imageData = await decodeBase64Icon(base64Map[String(size)], size);
    }

    if (!imageData) {
      imageData = createFallbackIconImageData(size);
    }

    if (imageData) {
      imageDataMap[size] = imageData;
    }
  }

  if (!Object.keys(imageDataMap).length) {
    return null;
  }

  const setIconResult = chrome.action.setIcon({ imageData: imageDataMap });
  if (setIconResult && typeof setIconResult.catch === 'function') {
    return setIconResult.catch((error) => console.warn('Unable to set action icon', error));
  }

  return null;
}

async function loadIconData() {
  if (iconDataCache) {
    return iconDataCache;
  }

  if (!chrome?.runtime?.getURL || typeof fetch === 'undefined') {
    return null;
  }

  try {
    const response = await fetch(chrome.runtime.getURL(ICON_DATA_PATH));
    if (!response.ok) {
      throw new Error(`Icon data request failed (${response.status})`);
    }
    iconDataCache = await response.json();
    return iconDataCache;
  } catch (error) {
    console.warn('Failed to load icon base64 map', error);
    iconDataCache = null;
    return null;
  }
}

async function decodeBase64Icon(base64, size) {
  if (
    typeof atob !== 'function' ||
    typeof Blob === 'undefined' ||
    typeof OffscreenCanvas === 'undefined' ||
    typeof createImageBitmap === 'undefined'
  ) {
    return null;
  }

  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/png' });
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(size, size);
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, size, size);
    context.drawImage(bitmap, 0, 0, size, size);
    return context.getImageData(0, 0, size, size);
  } catch (error) {
    console.warn('Unable to decode icon image data', error);
    return null;
  }
}

function createFallbackIconImageData(size) {
  if (typeof ImageData === 'undefined') {
    return null;
  }

  const data = new Uint8ClampedArray(size * size * 4);
  const topColor = [37, 99, 235];
  const bottomColor = [147, 51, 234];
  const accentColor = [255, 214, 102];
  const bookmarkWidth = Math.round(size * 0.55);
  const bookmarkStartX = Math.floor((size - bookmarkWidth) / 2);
  const bookmarkTop = Math.round(size * 0.18);
  const bookmarkBottom = Math.round(size * 0.78);
  const tipHeight = Math.max(1, Math.round(size * 0.12));

  for (let y = 0; y < size; y += 1) {
    const t = size > 1 ? y / (size - 1) : 0;
    const gradientColor = [
      Math.round(topColor[0] + (bottomColor[0] - topColor[0]) * t),
      Math.round(topColor[1] + (bottomColor[1] - topColor[1]) * t),
      Math.round(topColor[2] + (bottomColor[2] - topColor[2]) * t)
    ];

    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      let pixel = gradientColor;

      if (x >= bookmarkStartX && x < bookmarkStartX + bookmarkWidth && y >= bookmarkTop && y <= bookmarkBottom) {
        pixel = accentColor;
      }

      if (y > bookmarkBottom && y <= bookmarkBottom + tipHeight) {
        const relativeY = y - bookmarkBottom;
        const shrink = Math.round((relativeY / tipHeight) * (bookmarkWidth / 2));
        const tipStart = bookmarkStartX + shrink;
        const tipEnd = bookmarkStartX + bookmarkWidth - shrink;
        if (x >= tipStart && x < tipEnd) {
          pixel = accentColor;
        }
      }

      data[index] = pixel[0];
      data[index + 1] = pixel[1];
      data[index + 2] = pixel[2];
      data[index + 3] = 255;
    }
  }

  return new ImageData(data, size, size);
}

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

  if (request.type === 'CREATE_FOLDER' && request.title) {
    createCustomFolder(request.title)
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

  try {
    const url = new URL(tab.url);
    const domain = url.hostname.replace(/www\./, '').toLowerCase();
    const path = url.pathname.toLowerCase();
    const isCourseDomain =
      domain.includes('udemy') ||
      domain.includes('coursera') ||
      domain.includes('edx') ||
      domain.includes('udacity') ||
      domain.includes('almentor') ||
      domain.includes('skillshare') ||
      domain.includes('pluralsight') ||
      domain.includes('linkedin') ||
      domain.includes('classroom');

    if (isCourseDomain || collectedText.includes('course') || collectedText.includes('curriculum')) {
      tags.add('course');
    }

    const isPlaylist = path.includes('playlist') || url.searchParams?.has('list');
    if (isPlaylist || collectedText.includes('tutorial') || collectedText.includes('walkthrough')) {
      tags.add('tutorial');
    }
  } catch (error) {
    // Best-effort tagging; ignore URL parsing errors.
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

async function createCustomFolder(title) {
  const safeTitle = title.trim() || DEFAULT_TOPIC;
  const rootId = await ensureRootFolder();
  const children = await chrome.bookmarks.getChildren(rootId);
  const existing = children.find((child) => child.title.toLowerCase() === safeTitle.toLowerCase() && !child.url);
  if (existing) {
    return { folderId: existing.id, existed: true };
  }

  const created = await chrome.bookmarks.create({ parentId: rootId, title: safeTitle });
  return { folderId: created.id, existed: false };
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
    tags: tags.length > 0 ? tags : previous.tags || [],
    reminder: previous.reminder || ''
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
      tags: [],
      reminder: ''
    };
  }

  stored[bookmarkId] = {
    ...stored[bookmarkId],
    ...('notes' in updates ? { notes: updates.notes } : {}),
    ...('tags' in updates ? { tags: updates.tags } : {}),
    ...('description' in updates ? { description: updates.description } : {}),
    ...('title' in updates ? { title: updates.title } : {}),
    ...('reminder' in updates ? { reminder: updates.reminder || '' } : {})
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
