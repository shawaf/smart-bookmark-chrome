const SMART_ROOT_TITLE = 'Smart Bookmarks';
const DEFAULT_TOPIC = 'Unsorted';
const TOPIC_PROFILES = [
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
    keywords: ['developer', 'software', 'programming', 'code', 'cloud', 'engineering', 'systems'],
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

const TAG_HINTS = {
  react: ['react', 'jsx', 'hooks', 'redux'],
  nextjs: ['nextjs', 'next.js', 'vercel'],
  frontend: ['frontend', 'ui', 'component', 'tailwind', 'spa'],
  backend: ['backend', 'server', 'api', 'graphql', 'rest'],
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
  lms: ['lms', 'canvas', 'moodle', 'course design']
};

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
  return countHits(text, profile.keywords, weight) + countHits(text, profile.strongKeywords || [], weight * 2);
}

function scoreDomain(domain, profile) {
  if (!domain || !profile.domainKeywords) return 0;
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

function storeMetadata(bookmarkId, topic, pageMetadata, url, title, metadataMap, tags = []) {
  const metadata = {
    id: bookmarkId,
    topic,
    url,
    title,
    description: pageMetadata.description || pageMetadata.snippet,
    snippet: pageMetadata.snippet,
    keywords: pageMetadata.keywords,
    savedAt: new Date().toISOString(),
    domain: new URL(url).hostname,
    tags
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
    const tags = deriveTags(tab.pageMetadata, tab, topic);
    const existingFolder = topicFolders.get(topic);
    const folder = existingFolder || { title: topic, children: [] };
    if (!existingFolder) {
      topicFolders.set(topic, folder);
      root.children.push(folder);
    }

    const bookmarkId = `b${idCounter++}`;
    folder.children.push({ id: bookmarkId, title: tab.title, url: tab.url });
    const metadata = storeMetadata(bookmarkId, topic, tab.pageMetadata, tab.url, tab.title, metadataMap, tags);

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
    title: 'YouTube Home',
    url: 'https://www.youtube.com',
    pageMetadata: {
      description: 'YouTube lets you explore the world through popular music, game streams, and movie trailers.',
      keywords: 'video, music, entertainment, playlist',
      ogTitle: 'YouTube',
      snippet: 'Browse trending music, movie trailers, and entertainment from your favorite creators.'
    }
  },
  {
    title: 'Hello Interview - System Design Deep Dives',
    url: 'https://www.youtube.com/@hello_interview/videos',
    pageMetadata: {
      description: 'System design mock interviews, FAANG interview prep, backend scaling, and load balancer explainers.',
      keywords: 'software engineering, interview, system design, backend',
      ogTitle: 'Hello Interview channel',
      snippet: 'Watch engineering interview prep playlists and mock interview breakdowns.'
    }
  },
  {
    title: 'Deployment Stages with Kubernetes - Podcast',
    url: 'https://www.youtube.com/watch?v=-KkMu1U__UM',
    pageMetadata: {
      description: 'Podcast episode discussing blue-green deployments, Kubernetes rollout strategies, and Docker images.',
      keywords: 'kubernetes, docker, deployment, podcast, devops',
      ogTitle: 'Deployment stages with Kubernetes',
      snippet: 'Hosts unpack production rollouts, CI/CD pipelines, and canary releases.'
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
