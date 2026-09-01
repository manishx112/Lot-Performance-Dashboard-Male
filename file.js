/**
 * ============================================================================
 * ADVANCED DICTIONARY SYSTEM (Built using ES6 Map & LRU Cache)
 * ============================================================================
 * 
 * Features:
 * 1. O(1) Fast Word Storage & Lookup using JS Map
 * 2. Case-Insensitive Normalized Key Storage
 * 3. Multi-meaning support (Noun, Verb, Adjective) with Synonyms/Antonyms
 * 4. Fast Autocomplete / Prefix Search
 * 5. Integrated LRU Search Cache (Using Map Insertion Order)
 * 6. Word Search Analytics & Top Searched Words
 */

class DictionarySystem {
    constructor(cacheCapacity = 3) {
        // Main Storage: Word Key (lowerCase string) -> Word Details Object
        this.dictionary = new Map();

        // LRU Cache: Query -> Cached Result (Max capacity)
        this.searchCache = new Map();
        this.cacheCapacity = cacheCapacity;

        // Analytics: Word Key -> Search Count
        this.analyticsMap = new Map();
    }

    /**
     * Add or Update a word in the dictionary
     */
    addWord(word, { partOfSpeech = 'general', definitions = [], synonyms = [], antonyms = [], examples = [] }) {
        if (!word || typeof word !== 'string') {
            throw new Error("Invalid word provided.");
        }

        const key = word.trim().toLowerCase();
        const existing = this.dictionary.get(key) || {
            word: word.trim(),
            entries: [],
            createdAt: new Date().toISOString()
        };

        existing.entries.push({
            partOfSpeech,
            definitions: Array.isArray(definitions) ? definitions : [definitions],
            synonyms,
            antonyms,
            examples
        });

        existing.updatedAt = new Date().toISOString();
        this.dictionary.set(key, existing);

        // Clear cache entry if word updated
        this.searchCache.delete(key);
        console.log(`✅ [Added/Updated Word]: "${word.trim()}"`);
    }

    /**
     * Fast Lookup using Map + LRU Cache
     */
    lookup(word) {
        if (!word) return null;
        const key = word.trim().toLowerCase();

        // 1. Check LRU Cache
        if (this.searchCache.has(key)) {
            console.log(`⚡ [Cache Hit] Serving "${word}" from LRU Cache`);
            const cachedVal = this.searchCache.get(key);
            // Refresh LRU order (delete & re-insert)
            this.searchCache.delete(key);
            this.searchCache.set(key, cachedVal);
            return cachedVal;
        }

        // 2. Check Main Dictionary Map
        if (!this.dictionary.has(key)) {
            console.log(`❌ [Not Found] "${word}" does not exist in dictionary.`);
            return null;
        }

        console.log(`🔍 [Dictionary Map Lookup] Fetching "${word}" from main storage`);
        const wordData = this.dictionary.get(key);

        // Update Analytics
        const count = this.analyticsMap.get(key) || 0;
        this.analyticsMap.set(key, count + 1);

        // Store in LRU Cache
        this._updateCache(key, wordData);

        return wordData;
    }

    /**
     * Private Helper: Maintain LRU Cache size limit
     */
    _updateCache(key, value) {
        if (this.searchCache.size >= this.cacheCapacity) {
            const oldestKey = this.searchCache.keys().next().value;
            console.log(`🗑️ [LRU Cache Eviction] Evicting oldest cache key: "${oldestKey}"`);
            this.searchCache.delete(oldestKey);
        }
        this.searchCache.set(key, value);
    }

    /**
     * Autocomplete / Prefix Search
     */
    autocomplete(prefix, limit = 5) {
        if (!prefix) return [];
        const cleanPrefix = prefix.trim().toLowerCase();
        const matches = [];

        for (const [key, data] of this.dictionary.entries()) {
            if (key.startsWith(cleanPrefix)) {
                matches.push({
                    word: data.word,
                    definitions: data.entries.flatMap(e => e.definitions)
                });
                if (matches.length >= limit) break;
            }
        }
        return matches;
    }

    /**
     * Delete a word
     */
    deleteWord(word) {
        const key = word.trim().toLowerCase();
        this.searchCache.delete(key);
        this.analyticsMap.delete(key);
        const deleted = this.dictionary.delete(key);
        if (deleted) console.log(`🗑️ [Deleted Word]: "${word}"`);
        return deleted;
    }

    /**
     * Top Searched Words Analytics
     */
    getTopSearchedWords(topN = 3) {
        return [...this.analyticsMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(([key, count]) => ({ word: this.dictionary.get(key)?.word || key, count }));
    }

    /**
     * Dictionary Stats Summary
     */
    getStats() {
        return {
            totalWords: this.dictionary.size,
            cachedQueries: this.searchCache.size,
            totalSearchesLogged: [...this.analyticsMap.values()].reduce((a, b) => a + b, 0)
        };
    }
}


// ============================================================================
// DEMONSTRATION & TESTING
// ============================================================================

function runDictionaryDemo() {
    console.log("=================================================");
    console.log("📖 INITIALIZING ADVANCED DICTIONARY SYSTEM");
    console.log("=================================================");

    const dict = new DictionarySystem(2); // Cache Capacity = 2 for easy demonstration

    // 1. Adding Words
    dict.addWord("Algorithm", {
        partOfSpeech: "noun",
        definitions: ["A step-by-step procedure or formula for solving a problem."],
        synonyms: ["procedure", "formula", "method"],
        examples: ["Dijkstra's algorithm finds the shortest path."]
    });

    dict.addWord("Async", {
        partOfSpeech: "adjective",
        definitions: ["Not occurring at the same time."],
        synonyms: ["asynchronous", "non-blocking"],
        examples: ["JavaScript uses async programming for I/O operations."]
    });

    dict.addWord("Array", {
        partOfSpeech: "noun",
        definitions: ["An ordered series or arrangement of values."],
        synonyms: ["list", "collection"],
        examples: ["Map function transforms an array."]
    });
    dict.addWord("non algoritham", {
        partOfSpeech: "noun",
        definitions: ["An ordered series or arrangement of values."],
        synonyms: ["list", "collection"],
        examples: ["Map function transforms an array."]
    });

    // 2. Looking Up Words (Triggers Map Lookup & LRU Cache)
    console.log("\n--- 🔍 LOOKUP DEMOS ---");
    dict.lookup("Algorithm"); // Fetch from Dict Map -> Cache algorithm
    dict.lookup("Algorithm"); // Cache Hit!
    dict.lookup("Async");     // Fetch from Dict Map -> Cache async
    dict.lookup("Array");     // Fetch from Dict Map -> Cache array (Evicts oldest: algorithm)
    dict.lookup("Algorithm"); // Fetch from Dict Map again (Since it was evicted)

    // 3. Autocomplete Search
    console.log("\n--- 🔤 AUTOCOMPLETE DEMOS (Prefix: 'a') ---");
    const autoResults = dict.autocomplete("a");
    console.log("Found Matches:", autoResults);

    // 4. Analytics & Stats
    console.log("\n--- 📊 ANALYTICS & STATS ---");
    console.log("Top Searched Words:", dict.getTopSearchedWords());
    console.log("Dictionary Stats:", dict.getStats());
}

runDictionaryDemo();
