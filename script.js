// --- START OF FILE script.js (CORRECTED & COMPLETE) ---

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTION ---
    const textInput = document.getElementById('text-input');
    const highlighter = document.getElementById('highlighter');

    // Header counters
    const wordCountEl = document.getElementById('word-count');
    const charCountEl = document.getElementById('char-count');

    // Details panel
    const detailsWordsEl = document.getElementById('details-words');
    const detailsCharsEl = document.getElementById('details-chars');
    const detailsSentencesEl = document.getElementById('details-sentences');
    const detailsParagraphsEl = document.getElementById('details-paragraphs');
    const detailsReadingTimeEl = document.getElementById('details-reading-time');
    const detailsSpeakingTimeEl = document.getElementById('details-speaking-time');

    // Density panel
    const densityListEl = document.getElementById('density-list');
    const densityTabsContainer = document.querySelector('.density-tabs');

    let currentNgramSize = 2; // Default to bigrams (x2)
    let currentHighlightedPhrase = null;

    // --- UTILITY FUNCTIONS ---
    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 1) return '0 sec';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        let result = '';
        if (minutes > 0) result += `${minutes} min `;
        if (remainingSeconds > 0 || minutes === 0) result += `${remainingSeconds} sec`;
        return result.trim();
    };

    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const escapeHTML = (str) => {
        return str.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
    };

    // --- CORE LOGIC ---
    const analyzeText = () => {
        const text = textInput.value;
        
        // 1. Update Details Panel
        const words = text.trim().split(/\s+/).filter(Boolean);
        const wordCount = text.trim() === '' ? 0 : words.length;
        const charCount = text.length;
        const paragraphCount = text.split('\n').filter(line => line.trim() !== '').length || (text.trim() ? 1 : 0);
        const sentenceCount = (text.match(/[.!?]+|\n+/g) || []).length || (text.trim() ? 1 : 0);
        
        wordCountEl.textContent = wordCount;
        charCountEl.textContent = charCount;
        detailsWordsEl.textContent = wordCount;
        detailsCharsEl.textContent = charCount;
        detailsSentencesEl.textContent = sentenceCount;
        detailsParagraphsEl.textContent = paragraphCount;
        
        detailsReadingTimeEl.textContent = formatTime((wordCount / 270) * 60);
        detailsSpeakingTimeEl.textContent = formatTime((wordCount / 180) * 60);

        // 2. Update Keyword Density
        updateDensity(words);

        // 3. Update Highlighter
        updateHighlighter();
    };

    const updateDensity = (words) => {
        densityListEl.innerHTML = '';
        if (words.length < currentNgramSize) return;

        const ngrams = new Map();
        const cleanWords = words.map(w => w.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,""));
        
        for (let i = 0; i <= cleanWords.length - currentNgramSize; i++) {
            const ngram = cleanWords.slice(i, i + currentNgramSize).join(' ');
            if (ngram.trim().length > 0) {
               ngrams.set(ngram, (ngrams.get(ngram) || 0) + 1);
            }
        }

        const sortedNgrams = [...ngrams.entries()]
            .filter(([phrase, count]) => count > (currentNgramSize > 1 ? 1 : 0) ) // Only show repeated phrases for x2, x3
            .sort((a, b) => b[1] - a[1]);

        sortedNgrams.forEach(([phrase, count]) => {
            const item = document.createElement('div');
            item.className = 'density-item';
            item.innerHTML = `<span class="phrase">${escapeHTML(phrase)}</span><span class="count">${count}</span>`;
            item.addEventListener('click', () => {
                // If the same phrase is clicked again, un-highlight it
                currentHighlightedPhrase = currentHighlightedPhrase === phrase ? null : phrase;
                updateHighlighter();
            });
            densityListEl.appendChild(item);
        });
    };

    const updateHighlighter = () => {
        const text = textInput.value;
        let highlightedText = escapeHTML(text);

        if (currentHighlightedPhrase) {
            const regex = new RegExp(escapeRegExp(currentHighlightedPhrase), 'gi');
            highlightedText = highlightedText.replace(regex, (match) => `<span class="highlight">${match}</span>`);
        }
        
        highlighter.innerHTML = highlightedText + '\n'; // Add trailing newline for scroll sync
    };

    // --- EVENT LISTENERS ---
    textInput.addEventListener('input', () => {
        analyzeText();
        localStorage.setItem('savedText', textInput.value); // Save text on input
    });
    
    // Sync scrolling
    textInput.addEventListener('scroll', () => {
        highlighter.scrollTop = textInput.scrollTop;
        highlighter.scrollLeft = textInput.scrollLeft;
    });

    // Tab switching for keyword density
    densityTabsContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            densityTabsContainer.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            currentNgramSize = parseInt(e.target.dataset.ngram, 10);
            currentHighlightedPhrase = null; // Clear highlight on tab switch
            analyzeText(); // Re-analyze with new N-gram size
        }
    });

    // --- INITIALIZATION ---
    // Restore saved text from localStorage
    textInput.value = localStorage.getItem('savedText') || '';
    
    // Perform initial analysis on page load for any restored text
    analyzeText();
});
