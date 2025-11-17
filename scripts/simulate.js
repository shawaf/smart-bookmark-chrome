const SMART_ROOT_TITLE = 'Smart Bookmarks';
const DEFAULT_TOPIC = 'Unsorted';
const TOPIC_PROFILES = [
  {
    name: 'Technology',
    keywords: ['tech', 'developer', 'software', 'programming', 'code', 'api', 'framework', 'cloud', 'ai', 'engineering'],
    strongKeywords: ['javascript', 'python', 'hardware', 'device', 'laptop', 'chip'],
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

function chooseTopic(pageMetadata, tab) {
  const text = `${tab.title} ${tab.url} ${pageMetadata.description} ${pageMetadata.keywords} ${pageMetadata.ogTitle} ${pageMetadata.snippet}`.toLowerCase();
  const domain = new URL(tab.url).hostname.replace(/www\./, '').toLowerCase();

  const scored = TOPIC_PROFILES.map((profile) => {
    const baseHits = countHits(text, profile.keywords);
    const strongHits = countHits(text, profile.strongKeywords || [], 2);
    const domainHits = countHits(domain, profile.domainKeywords || [], 3);
    const titleHits = countHits((tab.title || '').toLowerCase(), profile.strongKeywords || [], 2);

    return {
      topic: profile.name,
      score: baseHits + strongHits + domainHits + titleHits
    };
  });

  const best = scored.sort((a, b) => b.score - a.score)[0];
  if (!best || best.score === 0) {
    return DEFAULT_TOPIC;
  }

  return best.topic;
}

function countHits(text, keywords, weight = 1) {
  if (!keywords || keywords.length === 0) return 0;
  return keywords.reduce((count, keyword) => (text.includes(keyword) ? count + weight : count), 0);
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
  },
  {
    title: 'How to open a bank account online',
    url: 'https://www.examplebank.com/personal/banking/new-account',
    pageMetadata: {
      description: 'Set up checking and savings accounts with digital onboarding.',
      keywords: 'banking, account, online banking, payments',
      ogTitle: 'Open an account',
      snippet: 'Apply for a new checking account, manage payments, and connect your debit card.'
    }
  },
  {
    title: 'أذكار-المساء',
    url: 'https://example.org/اذكار-المساء',
    pageMetadata: {
      description: 'أذكار المساء اليومية بصوت واضح ونص عربي كامل.',
      keywords: 'اذكار, دعاء, ذكر, اسلام',
      ogTitle: 'أذكار المساء',
      snippet: 'أذكار المساء اليومية للمسلمين مع أدعية قصيرة.'
    }
  }
];

if (require.main === module) {
  console.log('Simulating smart bookmark run...\n');
  simulateSmartBookmarkRun(sampleTabs);
}
