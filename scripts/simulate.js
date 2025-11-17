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

function storeMetadata(bookmarkId, topic, pageMetadata, url, title, metadataMap) {
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

  metadataMap[bookmarkId] = metadata;
  return metadata;
}

function simulateSmartBookmarkRun(tabs) {
  const root = { title: SMART_ROOT_TITLE, children: [] };
  const metadataMap = {};
  let idCounter = 1;

  const topicFolders = new Map();

  for (const tab of tabs) {
    const topic = chooseTopic(tab.pageMetadata, tab);
    const existingFolder = topicFolders.get(topic);
    const folder = existingFolder || { title: topic, children: [] };
    if (!existingFolder) {
      topicFolders.set(topic, folder);
      root.children.push(folder);
    }

    const bookmarkId = `b${idCounter++}`;
    folder.children.push({ id: bookmarkId, title: tab.title, url: tab.url });
    const metadata = storeMetadata(bookmarkId, topic, tab.pageMetadata, tab.url, tab.title, metadataMap);

    console.log(`Saved "${tab.title}" to topic "${topic}" with metadata:`, metadata);
  }

  console.log('\nSmart folder tree preview:\n');
  printTree(root, 0, metadataMap);
}

function printTree(node, depth, metadataMap) {
  const indent = '  '.repeat(depth);
  if (node.url) {
    console.log(`${indent}- ${node.title} (${node.url})`);
    const meta = metadataMap[node.id];
    if (meta) {
      console.log(`${indent}  ↳ ${meta.description || 'No description'}`);
    }
    return;
  }

  console.log(`${indent}${node.title}/`);
  for (const child of node.children || []) {
    printTree(child, depth + 1, metadataMap);
  }
}

const sampleTabs = [
  {
    title: 'Understanding Async/Await in JavaScript',
    url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises',
    pageMetadata: {
      description: 'Learn how to work with promises and async/await in modern JavaScript.',
      keywords: 'javascript, async, await, promise, tutorial',
      ogTitle: 'Async JavaScript Guide',
      snippet: 'Promises and async functions make asynchronous code easier to read.'
    }
  },
  {
    title: 'Travel guide: 48 hours in Tokyo',
    url: 'https://example.com/travel/tokyo-guide',
    pageMetadata: {
      description: 'Top attractions, hotels, and food spots for a weekend trip to Tokyo.',
      keywords: 'travel, tokyo, hotel, food, trip',
      ogTitle: 'Tokyo travel guide',
      snippet: 'From Shibuya crossings to sushi bars, plan your weekend efficiently.'
    }
  },
  {
    title: 'Q3 revenue beats expectations as sales grow 12%',
    url: 'https://news.example.com/business/revenue-beats',
    pageMetadata: {
      description: 'Earnings report highlights product growth and strong marketing results.',
      keywords: 'business, revenue, sales, growth',
      ogTitle: 'Quarterly earnings report',
      snippet: 'The company reported strong sales and marketing momentum this quarter.'
    }
  },
  {
    title: 'How to choose the right running shoes',
    url: 'https://shopping.example.com/reviews/running-shoes',
    pageMetadata: {
      description: 'Review of top running shoes with cushioning and price comparisons.',
      keywords: 'review, price, running, shoes, sport',
      ogTitle: 'Running shoes comparison',
      snippet: 'Find the best shoes for marathons, sprints, and daily training.'
    }
  }
];

if (require.main === module) {
  console.log('Simulating smart bookmark run...\n');
  simulateSmartBookmarkRun(sampleTabs);
}
