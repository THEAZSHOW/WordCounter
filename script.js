document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTION ---
    const textInput = document.getElementById('text-input');
    const wordCountEl = document.getElementById('word-count');
    const charCountEl = document.getElementById('char-count');
    const detailsWordsEl = document.getElementById('details-words');
    const detailsCharsEl = document.getElementById('details-chars');
    const detailsSentencesEl = document.getElementById('details-sentences');
    const detailsParagraphsEl = document.getElementById('details-paragraphs');
    const detailsReadingTimeEl = document.getElementById('details-reading-time');
    const detailsSpeakingTimeEl = document.getElementById('details-speaking-time');
    const densityListEl = document.getElementById('density-list');
    const densityTabsContainer = document.querySelector('.density-tabs');

    // New font/color controls
    const fontFamilySelect = document.getElementById('font-family-select');
    const fontSizeSelect = document.getElementById('font-size-select');
    const fontColorPicker = document.getElementById('font-color-picker');
    const highlightColorPicker = document.getElementById('highlight-color-picker');
    
    let currentNgramSize = 2;
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

    // --- CORE LOGIC ---
    const analyzeText = () => {
        const text = textInput.innerText;
        const htmlContent = textInput.innerHTML;

        // Update Details Panel
        const words = text.trim().split(/\s+/).filter(Boolean);
        const wordCount = text.trim() === '' ? 0 : words.length;
        const charCount = text.length;
        const paragraphCount = htmlContent.split(/<(p|div|br)[^>]*>/gi).filter(s => s.trim().length > 0 && s.trim() !== ' ').length || (text.trim() ? 1 : 0);
        const sentenceCount = (text.match(/[.!?]+|\n+/g) || []).length || (text.trim() ? 1 : 0);
        
        wordCountEl.textContent = wordCount;
        charCountEl.textContent = charCount;
        detailsWordsEl.textContent = wordCount;
        detailsCharsEl.textContent = charCount;
        detailsSentencesEl.textContent = sentenceCount;
        detailsParagraphsEl.textContent = paragraphCount;
        detailsReadingTimeEl.textContent = formatTime((wordCount / 270) * 60);
        detailsSpeakingTimeEl.textContent = formatTime((wordCount / 180) * 60);

        // Update Keyword Density
        updateDensity(words);

        // Save to localStorage
        localStorage.setItem('savedText', htmlContent);
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
            .filter(([phrase, count]) => count > (currentNgramSize > 1 ? 1 : 0))
            .sort((a, b) => b[1] - a[1]);

        sortedNgrams.forEach(([phrase, count]) => {
            const item = document.createElement('div');
            item.className = 'density-item';
            if (phrase === currentHighlightedPhrase) {
                item.classList.add('active-highlight');
            }
            item.innerHTML = `<span class="phrase">${phrase}</span><span class="count">${count}</span>`;
            item.addEventListener('click', () => toggleDensityHighlight(phrase));
            densityListEl.appendChild(item);
        });
    };
    
    // --- HIGHLIGHTING LOGIC FOR DENSITY ---
    const clearDensityHighlights = () => {
        const highlights = textInput.querySelectorAll('span.density-highlight');
        highlights.forEach(span => {
            span.replaceWith(document.createTextNode(span.textContent));
        });
        // Normalize the text nodes to merge adjacent ones
        textInput.normalize();
    };

    const applyDensityHighlight = (phrase) => {
        clearDensityHighlights();
        const regex = new RegExp(escapeRegExp(phrase), 'gi');
        const walker = document.createTreeWalker(textInput, NodeFilter.SHOW_TEXT);
        let node;
        const nodesToProcess = [];
        
        while (node = walker.nextNode()) {
            if (node.textContent.match(regex)) {
                nodesToProcess.push(node);
            }
        }
        
        nodesToProcess.forEach(node => {
            const newNodes = [];
            let lastIndex = 0;
            node.textContent.replace(regex, (match, offset) => {
                const textBefore = node.textContent.slice(lastIndex, offset);
                if (textBefore) newNodes.push(document.createTextNode(textBefore));
                
                const highlightSpan = document.createElement('span');
                highlightSpan.className = 'density-highlight';
                highlightSpan.textContent = match;
                newNodes.push(highlightSpan);
                
                lastIndex = offset + match.length;
            });
            const textAfter = node.textContent.slice(lastIndex);
            if (textAfter) newNodes.push(document.createTextNode(textAfter));
            
            node.replaceWith(...newNodes);
        });
    };

    const toggleDensityHighlight = (phrase) => {
        if (currentHighlightedPhrase === phrase) {
            currentHighlightedPhrase = null;
            clearDensityHighlights();
        } else {
            currentHighlightedPhrase = phrase;
            applyDensityHighlight(phrase);
        }
        analyzeText(); // Re-run analysis to update the list styles
    };

    // --- RIBBON FUNCTIONALITY ---
    const formatDoc = (command, value = null) => {
        textInput.focus();
        document.execCommand(command, false, value);
    };

    const ribbonButtons = [
        { id: 'btn-undo', command: 'undo' }, { id: 'btn-redo', command: 'redo' },
        { id: 'btn-bold', command: 'bold' }, { id: 'btn-italic', command: 'italic' },
        { id: 'btn-underline', command: 'underline' }, { id: 'btn-strikethrough', command: 'strikethrough' },
        { id: 'btn-align-left', command: 'justifyLeft' }, { id: 'btn-align-center', command: 'justifyCenter' },
        { id: 'btn-align-right', command: 'justifyRight' }, { id: 'btn-align-justify', command: 'justifyFull' },
        { id: 'btn-ordered-list', command: 'insertOrderedList' }, { id: 'btn-unordered-list', command: 'insertUnorderedList' },
    ];
    ribbonButtons.forEach(btnConfig => {
        const button = document.getElementById(btnConfig.id);
        if (button) button.addEventListener('click', () => formatDoc(btnConfig.command));
    });

    fontFamilySelect.addEventListener('change', () => formatDoc('fontName', fontFamilySelect.value));
    fontSizeSelect.addEventListener('change', () => formatDoc('fontSize', fontSizeSelect.value));
    fontColorPicker.addEventListener('input', () => formatDoc('foreColor', fontColorPicker.value));
    highlightColorPicker.addEventListener('input', () => formatDoc('hiliteColor', highlightColorPicker.value));

    const updateButtonStates = () => {
        const toggleCommands = ['bold', 'italic', 'underline', 'strikethrough'];
        toggleCommands.forEach(command => {
            const button = document.getElementById(`btn-${command}`);
            if (button) {
                button.classList.toggle('is-active', document.queryCommandState(command));
            }
        });
        // Update font and size selects based on cursor position
        const fontName = document.queryCommandValue('fontName').replace(/['"]/g, '');
        const fontSize = document.queryCommandValue('fontSize');
        if (fontName) fontFamilySelect.value = Array.from(fontFamilySelect.options).find(o => o.value.includes(fontName))?.value || '';
        if (fontSize) fontSizeSelect.value = fontSize;
    };

    // --- EVENT LISTENERS ---
    textInput.addEventListener('input', () => {
        clearDensityHighlights(); // Clear highlights when user types
        currentHighlightedPhrase = null;
        analyzeText();
    });
    textInput.addEventListener('keyup', updateButtonStates);
    textInput.addEventListener('mouseup', updateButtonStates);

    densityTabsContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            densityTabsContainer.querySelector('.active').classList.remove('active');
e.target.classList.add('active');
            currentNgramSize = parseInt(e.target.dataset.ngram, 10);
            clearDensityHighlights();
            currentHighlightedPhrase = null;
            analyzeText();
        }
    });

    // --- INITIALIZATION ---
    const savedText = localStorage.getItem('savedText');
    if (savedText) {
        textInput.innerHTML = savedText;
    } else {
        textInput.innerHTML = '<h2>Welcome to Your Rich Text Editor!</h2><p>Start typing here. Use the new controls above to change fonts, sizes, and <b>colors</b>!</p>';
    }
    analyzeText();
    updateButtonStates();
});
