// ML Classifier Module (Replaced with Lightweight Text Similarity)
// This module now uses TF-IDF and keyword matching instead of TensorFlow.js
// to avoid CSP issues and reduce extension size.

// --- Text Similarity & Tokenization Logic (Copied from text-similarity.js) ---

// Detect language from text
function detectLanguage(text) {
    if (!text) return 'en';

    const arabicRegex = /[\u0600-\u06FF]/;
    const chineseRegex = /[\u4E00-\u9FFF]/;
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
    const koreanRegex = /[\uAC00-\uD7AF]/;
    const cyrillicRegex = /[\u0400-\u04FF]/;

    if (arabicRegex.test(text)) return 'ar';
    if (chineseRegex.test(text)) return 'zh';
    if (japaneseRegex.test(text)) return 'ja';
    if (koreanRegex.test(text)) return 'ko';
    if (cyrillicRegex.test(text)) return 'ru';

    return 'en';
}

// Tokenize text into words (language-aware)
function tokenize(text, language = null) {
    if (!text) return [];
    if (!language) language = detectLanguage(text);

    switch (language) {
        case 'zh':
        case 'ja':
            return tokenizeCJK(text, language);
        case 'ar':
            return tokenizeArabic(text);
        default:
            return tokenizeStandard(text, language);
    }
}

function tokenizeStandard(text, language) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length >= 2)
        .filter(word => !isStopWord(word, language));
}

function tokenizeCJK(text, language) {
    const cleaned = text.replace(/[\s\p{P}]/gu, '');
    const chars = Array.from(cleaned);
    const tokens = [];
    for (let i = 0; i < chars.length - 1; i++) {
        const bigram = chars[i] + chars[i + 1];
        if (bigram.trim().length === 2) tokens.push(bigram);
    }
    chars.forEach(char => {
        if (char.trim().length > 0 && !isStopWord(char, language)) tokens.push(char);
    });
    return tokens;
}

function tokenizeArabic(text) {
    return text
        .toLowerCase()
        .replace(/[\u064B-\u065F]/g, '')
        .replace(/[^\u0600-\u06FF\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length >= 2)
        .filter(word => !isStopWord(word, 'ar'));
}

const STOP_WORDS = {
    en: new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this', 'it', 'from', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']),
    ar: new Set(['في', 'من', 'إلى', 'على', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي', 'أن', 'أو', 'لا', 'ما', 'كان', 'قد', 'لم', 'عن', 'مع', 'هو', 'هي']),
    es: new Set(['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar', 'tener']),
    fr: new Set(['le', 'la', 'de', 'un', 'une', 'et', 'à', 'être', 'avoir', 'que', 'pour', 'dans', 'ce', 'il', 'qui', 'ne', 'sur', 'se', 'pas']),
    de: new Set(['der', 'die', 'das', 'und', 'in', 'zu', 'den', 'von', 'mit', 'ist', 'des', 'sich', 'im', 'nicht', 'ein', 'eine', 'als', 'auch', 'es']),
    ru: new Set(['в', 'и', 'не', 'на', 'я', 'быть', 'он', 'с', 'что', 'а', 'по', 'это', 'она', 'этот', 'к', 'но', 'они', 'мы', 'как', 'из']),
    zh: new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '个']),
    ja: new Set(['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある']),
    ko: new Set(['이', '그', '저', '것', '수', '있', '하', '되', '않', '등', '들', '및'])
};

function isStopWord(word, language = 'en') {
    const stopWords = STOP_WORDS[language] || STOP_WORDS.en;
    return stopWords.has(word.toLowerCase());
}

// --- Classification Logic ---

// Topic definitions with multilingual keywords
const TOPICS = {
    'tech': {
        label: 'Technology',
        keywords: ['programming', 'code', 'developer', 'software', 'api', 'framework', 'react', 'javascript', 'python', 'java', 'css', 'html', 'web', 'app', 'mobile', 'ios', 'android', 'git', 'database', 'sql', 'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'ai', 'ml', 'machine learning', 'data', 'algorithm']
    },
    'news': {
        label: 'News & Reading',
        keywords: ['news', 'article', 'blog', 'post', 'story', 'report', 'journal', 'daily', 'weekly', 'magazine', 'paper', 'times', 'guardian', 'cnn', 'bbc', 'politics', 'world', 'local', 'breaking']
    },
    'shopping': {
        label: 'Shopping',
        keywords: ['shop', 'store', 'buy', 'price', 'sale', 'deal', 'amazon', 'ebay', 'product', 'item', 'cart', 'checkout', 'order', 'shipping', 'delivery', 'gift', 'clothes', 'fashion', 'electronics']
    },
    'entertainment': {
        label: 'Entertainment',
        keywords: ['video', 'movie', 'film', 'music', 'song', 'game', 'gaming', 'play', 'stream', 'youtube', 'netflix', 'spotify', 'twitch', 'podcast', 'show', 'series', 'episode', 'cinema', 'theatre']
    },
    'education': {
        label: 'Education',
        keywords: ['learn', 'course', 'tutorial', 'guide', 'school', 'university', 'college', 'class', 'lesson', 'study', 'student', 'teacher', 'exam', 'test', 'degree', 'certificate', 'research', 'paper', 'academic']
    },
    'finance': {
        label: 'Finance',
        keywords: ['bank', 'money', 'finance', 'invest', 'stock', 'market', 'crypto', 'bitcoin', 'wallet', 'credit', 'card', 'loan', 'tax', 'insurance', 'payment', 'transfer', 'account', 'saving', 'budget']
    },
    'travel': {
        label: 'Travel',
        keywords: ['travel', 'trip', 'flight', 'hotel', 'booking', 'vacation', 'holiday', 'destination', 'tour', 'guide', 'map', 'location', 'place', 'city', 'country', 'visa', 'passport', 'ticket']
    }
};

// Main classification function
async function classifyBookmark(text) {
    // 1. Tokenize the input text
    const tokens = tokenize(text);

    if (tokens.length === 0) {
        return {
            category: 'Uncategorized',
            confidence: 0,
            method: 'fallback'
        };
    }

    // 2. Score each topic based on keyword matches
    const scores = {};
    Object.keys(TOPICS).forEach(key => {
        scores[key] = 0;
        const topic = TOPICS[key];

        // Check for keyword matches
        topic.keywords.forEach(keyword => {
            // Simple inclusion check
            if (text.toLowerCase().includes(keyword.toLowerCase())) {
                scores[key] += 1;
            }

            // Token match check (higher weight)
            if (tokens.includes(keyword.toLowerCase())) {
                scores[key] += 2;
            }
        });
    });

    // 3. Find best match
    let bestTopic = 'Uncategorized';
    let maxScore = 0;

    Object.keys(scores).forEach(key => {
        if (scores[key] > maxScore) {
            maxScore = scores[key];
            bestTopic = TOPICS[key].label;
        }
    });

    // Calculate confidence (simple normalization)
    const confidence = maxScore > 0 ? Math.min(maxScore / 5, 1.0) : 0;

    return {
        category: bestTopic,
        confidence: confidence,
        method: 'keyword-enhanced'
    };
}

// Load model (noop for compatibility)
async function loadModel() {
    return true;
}

// Export for use in background.js and manage.js
if (typeof self !== 'undefined') {
    self.classifyBookmark = classifyBookmark;
    self.loadModel = loadModel;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        classifyBookmark,
        loadModel
    };
}
