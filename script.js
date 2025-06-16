document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTION ---
    const textInput = document.getElementById('text-input');

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

    let currentNgramSize = 2;

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

    // --- CORE LOGIC ---
    const analyzeText = () => {
        const text = textInput.innerText; // Use innerText for plain text content
        const htmlContent = textInput.innerHTML;

        // 1. Update Details Panel
        const words = text.trim().split(/\s+/).filter(Boolean);
        const wordCount = text.trim() === '' ? 0 : words.length;
        const charCount = text.length;
        const paragraphCount = htmlContent.split(/<(p|div|br)[^>]*>/gi).filter(s => s.trim().length > 0).length || (text.trim() ? 1 : 0);
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

        // 3. Save to localStorage
        localStorage.setItem('savedText', htmlContent); // Save the HTML to preserve formatting
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
            .filter(([phrase, count]) => count > (currentNgramSize > 1 ? 1 : 0) )
            .sort((a, b) => b[1] - a[1]);

        sortedNgrams.forEach(([phrase, count]) => {
            const item = document.createElement('div');
            item.className = 'density-item';
            item.innerHTML = `<span class="phrase">${phrase}</span><span class="count">${count}</span>`;
            item.addEventListener('click', () => {
                // Highlighting is more complex with contenteditable, so we'll skip direct highlighting for now to focus on editing.
                console.log(`Highlighting for "${phrase}" can be implemented later.`);
            });
            densityListEl.appendChild(item);
        });
    };
    
    // --- RIBBON FUNCTIONALITY ---
    const formatDoc = (command, value = null) => {
        textInput.focus();
        document.execCommand(command, false, value);
    };

    const ribbonButtons = [
        { id: 'btn-undo', command: 'undo' },
        { id: 'btn-redo', command: 'redo' },
        { id: 'btn-bold', command: 'bold' },
        { id: 'btn-italic', command: 'italic' },
        { id: 'btn-underline', command: 'underline' },
        { id: 'btn-strikethrough', command: 'strikethrough' },
        { id: 'btn-align-left', command: 'justifyLeft' },
        { id: 'btn-align-center', command: 'justifyCenter' },
        { id: 'btn-align-right', command: 'justifyRight' },
        { id: 'btn-align-justify', command: 'justifyFull' },
        { id: 'btn-ordered-list', command: 'insertOrderedList' },
        { id: 'btn-unordered-list', command: 'insertUnorderedList' },
    ];

    ribbonButtons.forEach(btnConfig => {
        const button = document.getElementById(btnConfig.id);
        if (button) {
            button.addEventListener('click', () => formatDoc(btnConfig.command));
        }
    });

    // Update button states (e.g., bold button should look active if text is bold)
    const updateButtonStates = () => {
        const toggleCommands = ['bold', 'italic', 'underline', 'strikethrough'];
        toggleCommands.forEach(command => {
            const button = document.getElementById(`btn-${command}`);
            if (button) {
                if (document.queryCommandState(command)) {
                    button.classList.add('is-active');
                } else {
                    button.classList.remove('is-active');
                }
            }
        });
    };


    // --- EVENT LISTENERS ---
    textInput.addEventListener('input', analyzeText);
    textInput.addEventListener('keyup', updateButtonStates);
    textInput.addEventListener('mouseup', updateButtonStates);

    densityTabsContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            densityTabsContainer.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            currentNgramSize = parseInt(e.target.dataset.ngram, 10);
            analyzeText(); // Re-analyze with new N-gram size
        }
    });

    // --- INITIALIZATION ---
    const savedText = localStorage.getItem('savedText');
    if (savedText) {
        textInput.innerHTML = savedText; // Load HTML from storage
    } else {
        // Add some placeholder content
        textInput.innerHTML = '<h2>Welcome to Your New Editor!</h2><p>Start typing here. You can use the buttons above to <b>format</b> your text.</p>';
    }
    
    // Perform initial analysis on page load
    analyzeText();
    updateButtonStates();
});
