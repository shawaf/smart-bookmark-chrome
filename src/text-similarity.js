// Text Similarity Module for Mindmap
// Lightweight alternative to ML-based similarity using TF-IDF

// Calculate TF-IDF similarity between bookmarks
function calculateTextSimilarity(bookmarks) {
    if (bookmarks.length < 2) return [];

    // Extract text from each bookmark
    const documents = bookmarks.map(bm => {
        const parts = [
            bm.title,
            bm.metadata?.description,
            bm.metadata?.keywords,
            bm.metadata?.snippet
        ].filter(Boolean);
        return parts.join(' ').toLowerCase();
    });

    // Tokenize and build vocabulary
    const vocabulary = new Set();
    const tokenizedDocs = documents.map(doc => {
        const tokens = tokenize(doc);
        tokens.forEach(token => vocabulary.add(token));
        return tokens;
    });

    // Calculate TF-IDF vectors
    const tfidfVectors = tokenizedDocs.map(tokens =>
        calculateTFIDF(tokens, tokenizedDocs, Array.from(vocabulary))
    );

    // Calculate similarity matrix
    const similarityMatrix = [];
    for (let i = 0; i < tfidfVectors.length; i++) {
        similarityMatrix[i] = [];
        for (let j = 0; j < tfidfVectors.length; j++) {
            if (i === j) {
                similarityMatrix[i][j] = 1.0;
            } else if (j < i) {
                similarityMatrix[i][j] = similarityMatrix[j][i];
            } else {
                similarityMatrix[i][j] = cosineSimilarity(tfidfVectors[i], tfidfVectors[j]);
            }
        }
    }

    return similarityMatrix;
}

// Detect language from text
function detectLanguage(text) {
    if (!text) return 'en';

    // Check for specific scripts
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

    return 'en'; // Default to English/Latin
}

// Tokenize text into words (language-aware)
function tokenize(text, language = null) {
    if (!text) return [];

    // Auto-detect language if not provided
    if (!language) {
        language = detectLanguage(text);
    }

    // Use appropriate tokenization based on language
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

// Standard word-based tokenization (for Latin, Cyrillic, etc.)
function tokenizeStandard(text, language) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length >= 2)
        .filter(word => !isStopWord(word, language));
}

// CJK (Chinese, Japanese, Korean) tokenization using bigrams
function tokenizeCJK(text, language) {
    // Remove punctuation and whitespace
    const cleaned = text.replace(/[\s\p{P}]/gu, '');
    const chars = Array.from(cleaned);
    const tokens = [];

    // Create bigrams (2-character sequences)
    for (let i = 0; i < chars.length - 1; i++) {
        const bigram = chars[i] + chars[i + 1];
        if (bigram.trim().length === 2) {
            tokens.push(bigram);
        }
    }

    // Also add individual characters for better matching
    chars.forEach(char => {
        if (char.trim().length > 0 && !isStopWord(char, language)) {
            tokens.push(char);
        }
    });

    return tokens;
}

// Arabic tokenization
function tokenizeArabic(text) {
    // Arabic-specific processing
    return text
        .toLowerCase()
        // Remove diacritics (tashkeel)
        .replace(/[\u064B-\u065F]/g, '')
        // Split on whitespace and punctuation
        .replace(/[^\u0600-\u06FF\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length >= 2)
        .filter(word => !isStopWord(word, 'ar'));
}

// Multilingual stop words
const STOP_WORDS = {
    en: new Set([
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
        'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this',
        'it', 'from', 'are', 'was', 'were', 'been', 'be', 'have', 'has',
        'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ]),
    ar: new Set([
        'في', 'من', 'إلى', 'على', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي',
        'أن', 'أو', 'لا', 'ما', 'كان', 'قد', 'لم', 'عن', 'مع', 'هو', 'هي'
    ]),
    es: new Set([
        'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no',
        'haber', 'por', 'con', 'su', 'para', 'como', 'estar', 'tener'
    ]),
    fr: new Set([
        'le', 'la', 'de', 'un', 'une', 'et', 'à', 'être', 'avoir', 'que',
        'pour', 'dans', 'ce', 'il', 'qui', 'ne', 'sur', 'se', 'pas'
    ]),
    de: new Set([
        'der', 'die', 'das', 'und', 'in', 'zu', 'den', 'von', 'mit', 'ist',
        'des', 'sich', 'im', 'nicht', 'ein', 'eine', 'als', 'auch', 'es'
    ]),
    ru: new Set([
        'в', 'и', 'не', 'на', 'я', 'быть', 'он', 'с', 'что', 'а', 'по',
        'это', 'она', 'этот', 'к', 'но', 'они', 'мы', 'как', 'из'
    ]),
    zh: new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '个']),
    ja: new Set(['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある']),
    ko: new Set(['이', '그', '저', '것', '수', '있', '하', '되', '않', '등', '들', '및'])
};

function isStopWord(word, language = 'en') {
    const stopWords = STOP_WORDS[language] || STOP_WORDS.en;
    return stopWords.has(word.toLowerCase());
}

// Calculate TF-IDF vector for a document
function calculateTFIDF(tokens, allTokenizedDocs, vocabulary) {
    const vector = {};
    const docLength = tokens.length;
    const numDocs = allTokenizedDocs.length;

    // Calculate term frequency (TF)
    const termFreq = {};
    tokens.forEach(token => {
        termFreq[token] = (termFreq[token] || 0) + 1;
    });

    // Calculate TF-IDF for each term in vocabulary
    vocabulary.forEach(term => {
        const tf = (termFreq[term] || 0) / docLength;

        // Calculate document frequency (DF)
        const df = allTokenizedDocs.filter(doc => doc.includes(term)).length;

        // Calculate IDF
        const idf = Math.log(numDocs / (df + 1)); // +1 to avoid division by zero

        vector[term] = tf * idf;
    });

    return vector;
}

// Calculate cosine similarity between two TF-IDF vectors
function cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    // Get all unique terms
    const allTerms = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

    allTerms.forEach(term => {
        const v1 = vec1[term] || 0;
        const v2 = vec2[term] || 0;

        dotProduct += v1 * v2;
        norm1 += v1 * v1;
        norm2 += v2 * v2;
    });

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

// Get indices of related bookmarks based on similarity threshold
function getRelatedBookmarks(bookmarkIndex, similarityMatrix, threshold = 0.3) {
    const related = [];
    const similarities = similarityMatrix[bookmarkIndex];

    for (let i = 0; i < similarities.length; i++) {
        if (i !== bookmarkIndex && similarities[i] >= threshold) {
            related.push(i);
        }
    }

    return related;
}

// Search bookmarks using TF-IDF and return ranked results
function searchBookmarks(query, bookmarks) {
    if (!query || bookmarks.length === 0) return [];

    // Tokenize query
    let queryTokens = tokenize(query);

    // Smart Query Expansion
    queryTokens = expandQuery(queryTokens);

    if (queryTokens.length === 0) return [];

    // Create documents from bookmarks
    const documents = bookmarks.map(bm => {
        const parts = [
            bm.title,
            bm.folderTitle, // Include folder/topic name
            bm.metadata?.description,
            bm.metadata?.keywords,
            bm.metadata?.snippet,
            bm.metadata?.notes
        ].filter(Boolean);
        return parts.join(' ').toLowerCase();
    });

    // Tokenize all documents
    const tokenizedDocs = documents.map(doc => tokenize(doc));

    // Build vocabulary
    const vocabulary = new Set([...queryTokens]);
    tokenizedDocs.forEach(tokens => {
        tokens.forEach(token => vocabulary.add(token));
    });

    // Calculate TF-IDF for query
    const queryTFIDF = calculateTFIDF(queryTokens, tokenizedDocs, Array.from(vocabulary));
    // console.log('Search Debug: Query TF-IDF:', queryTFIDF);

    // Calculate TF-IDF for each document and compute similarity
    const results = [];
    tokenizedDocs.forEach((tokens, index) => {
        const docTFIDF = calculateTFIDF(tokens, tokenizedDocs, Array.from(vocabulary));
        const similarity = cosineSimilarity(queryTFIDF, docTFIDF);

        // Debug log for potential matches (low threshold)
        if (similarity > 0) {
            // console.log(`Search Debug: Doc ${index} similarity: ${similarity}`);
        }

        // Only include results with meaningful similarity
        if (similarity > 0.05) {
            results.push({
                bookmark: bookmarks[index],
                score: similarity,
                index: index
            });
        }
    });

    // Sort by relevance score (descending)
    results.sort((a, b) => b.score - a.score);

    return results;
}

// Generate snippet with highlighted query terms
function generateSnippet(text, queryTerms, maxLength = 200) {
    if (!text) return '';

    const lowerText = text.toLowerCase();
    const lowerTerms = queryTerms.map(t => t.toLowerCase());

    // Find the first occurrence of any query term
    let bestIndex = -1;
    let bestTerm = '';

    for (const term of lowerTerms) {
        const index = lowerText.indexOf(term);
        if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
            bestIndex = index;
            bestTerm = term;
        }
    }

    // If no term found, return beginning of text
    if (bestIndex === -1) {
        const snippet = text.substring(0, maxLength);
        return snippet.length < text.length ? snippet + '...' : snippet;
    }

    // Extract snippet around the matched term
    const start = Math.max(0, bestIndex - maxLength / 2);
    const end = Math.min(text.length, start + maxLength);

    let snippet = text.substring(start, end);

    // Add ellipsis if needed
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
}

// Highlight query terms in text (returns HTML with <mark> tags)
function highlightTerms(text, queryTerms) {
    if (!text || !queryTerms || queryTerms.length === 0) return text;

    let result = text;
    const lowerTerms = queryTerms.map(t => t.toLowerCase());

    // Sort terms by length (longest first) to avoid partial matches
    const sortedTerms = [...new Set(lowerTerms)].sort((a, b) => b.length - a.length);

    sortedTerms.forEach(term => {
        // Use regex to match whole words (case insensitive)
        const regex = new RegExp(`\\b(${escapeRegex(term)})\\b`, 'gi');
        result = result.replace(regex, '<mark>$1</mark>');
    });

    return result;
}

// Escape special regex characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- Smart Search Expansion ---

const RELATED_TERMS = {
    'software': ['development', 'engineering', 'programming', 'coding', 'backend', 'frontend', 'fullstack', 'app', 'tech'],
    'backend': ['server', 'database', 'api', 'node', 'python', 'java', 'sql', 'system', 'software', 'infrastructure'],
    'frontend': ['ui', 'ux', 'design', 'react', 'css', 'html', 'web', 'client', 'interface'],
    'web': ['internet', 'site', 'page', 'browser', 'frontend', 'html', 'css', 'www'],
    'learning': ['education', 'study', 'course', 'tutorial', 'guide', 'school', 'learn'],
    'tech': ['technology', 'software', 'hardware', 'digital', 'computer', 'it', 'science'],
    'shop': ['store', 'buy', 'commerce', 'retail', 'sale', 'price', 'deal'],
    'money': ['finance', 'investment', 'bank', 'crypto', 'economy', 'wealth', 'market'],
    'design': ['ui', 'ux', 'art', 'creative', 'style', 'frontend', 'graphic'],
    'security': ['hack', 'cyber', 'protect', 'privacy', 'auth', 'encryption'],
    'data': ['analytics', 'statistics', 'db', 'sql', 'science', 'big data']
};

function expandQuery(tokens) {
    const expanded = new Set(tokens);

    tokens.forEach(token => {
        // Direct match
        const related = RELATED_TERMS[token.toLowerCase()];
        if (related) {
            related.forEach(term => expanded.add(term));
        }

        // Check for partial matches or variations if needed
        // For now, keep it simple with direct dictionary lookup
    });

    return Array.from(expanded);
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateTextSimilarity,
        getRelatedBookmarks,
        searchBookmarks,
        generateSnippet,
        highlightTerms
    };
}
