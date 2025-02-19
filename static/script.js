// Store processed URLs
let processedUrls = JSON.parse(localStorage.getItem('processedUrls') || '[]');

// DOM Elements
const modeSelector = document.getElementById('mode-selector');
const pdfSection = document.getElementById('pdf-section');
const urlSection = document.getElementById('url-section');
const pdfUpload = document.getElementById('pdf-upload');
const uploadBtn = document.getElementById('upload-btn');
const urlInput = document.getElementById('url-input');
const processUrlBtn = document.getElementById('process-url-btn');
const queryInput = document.getElementById('query-input');
const queryBtn = document.getElementById('query-btn');
const responseArea = document.getElementById('response-area');
const urlList = document.getElementById('url-list');

// UI Feedback Functions
function showLoading(message = 'Processing...') {
    console.log(`Loading started: ${message}`);
    document.getElementById('loading-overlay').style.display = 'block';
    document.getElementById('status-message').textContent = message;
    document.getElementById('progress-bar-fill').style.width = '0%';
}

function updateProgress(percent, message) {
    console.log(`Progress: ${percent}% - ${message}`);
    document.getElementById('progress-bar-fill').style.width = `${percent}%`;
    document.getElementById('status-message').textContent = message;
}

function hideLoading() {
    console.log('Loading completed');
    document.getElementById('loading-overlay').style.display = 'none';
}

function showToast(message, duration = 3000) {
    console.log(`Toast message: ${message}`);
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, duration);
}

// URL List Management
function updateUrlList() {
    urlList.innerHTML = processedUrls.map(url => 
        `<div class="url-item">${url}</div>`
    ).join('');
    localStorage.setItem('processedUrls', JSON.stringify(processedUrls));
}
updateUrlList();

// Mode Switching
modeSelector.addEventListener('change', () => {
    if (modeSelector.value === 'pdf') {
        pdfSection.style.display = 'block';
        urlSection.style.display = 'none';
        console.log('Switched to PDF mode');
    } else {
        pdfSection.style.display = 'none';
        urlSection.style.display = 'block';
        console.log('Switched to URL mode');
    }
});

// PDF Upload Handler
uploadBtn.addEventListener('click', async () => {
    const file = pdfUpload.files[0];
    if (!file) {
        showToast('Please select a PDF file');
        return;
    }

    console.log(`Starting PDF upload: ${file.name}`);
    showLoading('Uploading PDF...');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress <= 90) {
                updateProgress(progress, `Processing PDF... ${progress}%`);
            }
        }, 500);

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        clearInterval(progressInterval);
        
        if (response.ok) {
            updateProgress(100, 'PDF processed successfully!');
            setTimeout(() => {
                hideLoading();
                showToast('PDF uploaded and processed successfully');
            }, 500);
        } else {
            hideLoading();
            showToast(`Error: ${data.detail}`);
        }
    } catch (error) {
        console.error('PDF upload error:', error);
        hideLoading();
        showToast('Error uploading PDF');
    }
});

// URL Processing Handler
processUrlBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) {
        showToast('Please enter a URL');
        return;
    }

    console.log(`Processing URL: ${url}`);
    showLoading('Processing URL...');

    try {
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 15;
            if (progress <= 90) {
                updateProgress(progress, `Analyzing URL content... ${progress}%`);
            }
        }, 700);

        const response = await fetch('/process-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });
        const data = await response.json();

        clearInterval(progressInterval);

        if (response.ok) {
            updateProgress(100, 'URL processed successfully!');
            setTimeout(() => {
                hideLoading();
                if (!processedUrls.includes(url)) {
                    processedUrls.push(url);
                    updateUrlList();
                }
                showToast('URL processed successfully');
                urlInput.value = '';
            }, 500);
        } else {
            hideLoading();
            showToast(`Error: ${data.detail}`);
        }
    } catch (error) {
        console.error('URL processing error:', error);
        hideLoading();
        showToast('Error processing URL');
    }
});

// Query Handler
queryBtn.addEventListener('click', async () => {
    const query = queryInput.value.trim();
    if (!query) {
        showToast('Please enter a question');
        return;
    }

    const mode = modeSelector.value;
    console.log(`Processing ${mode} query: ${query}`);
    showLoading('Processing your question...');

    const endpoint = mode === 'pdf' ? '/query-pdf' : '/query-url';
    
    try {
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 20;
            if (progress <= 90) {
                updateProgress(progress, `Analyzing and generating response... ${progress}%`);
            }
        }, 800);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });
        const data = await response.json();

        clearInterval(progressInterval);

        if (response.ok) {
            updateProgress(100, 'Response generated!');
            setTimeout(() => {
                hideLoading();
                responseArea.textContent = data.response;
                showToast('Response generated successfully');
            }, 500);
        } else {
            hideLoading();
            responseArea.textContent = `Error: ${data.detail}`;
            showToast('Error generating response');
        }
    } catch (error) {
        console.error('Query processing error:', error);
        hideLoading();
        responseArea.textContent = 'Error processing query';
        showToast('Error processing query');
    }
});

// Initialize application
console.log('Document AI Assistant initialized and ready');
showToast('Application ready', 2000);