document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text-input');

    // Restore saved text
    textInput.value = localStorage.getItem('savedText') || '';

    // Save on input
    textInput.addEventListener('input', () => {
        localStorage.setItem('savedText', textInput.value);
    });
});
