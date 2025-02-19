document.addEventListener('DOMContentLoaded', () => {
    const modeSelector = document.getElementById('mode-selector');
    const pdfSection = document.getElementById('pdf-section');
    const urlSection = document.getElementById('url-section');
    const fileUpload = document.getElementById('pdf-upload');
    const uploadLabel = document.querySelector('.upload-label');
    const loadingOverlay = document.querySelector('.loading-overlay');

    
    modeSelector.addEventListener('change', () => {
        pdfSection.style.display = modeSelector.value === 'pdf' ? 'block' : 'none';
        urlSection.style.display = modeSelector.value === 'url' ? 'block' : 'none';
    });

    
    const uploadArea = document.querySelector('.file-upload');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border)';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border)';
        const files = e.dataTransfer.files;
        if (files[0]) handleFileUpload(files[0]);
    });

    
    fileUpload.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFileUpload(e.target.files[0]);
    });

    async function handleFileUpload(file) {
        showLoading('Processing PDF...');
        uploadLabel.innerHTML = `
            <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing ${file.name}...</span>
        `;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');
            
            uploadLabel.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>${file.name} processed successfully!</span>
            `;
            
            addFileChip(file.name);
            hideLoading();
        } catch (error) {
            showToast(`Upload failed: ${error.message}`, true);
            hideLoading();
        }
    }

    function addFileChip(filename) {
        const chip = document.createElement('div');
        chip.className = 'file-chip';
        chip.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            ${filename}
        `;
        document.querySelector('.uploaded-files').appendChild(chip);
    }

    
    function showLoading(message) {
        loadingOverlay.style.display = 'flex';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="animate-pulse mb-4">
                    <div class="h-12 w-12 mx-auto bg-primary/20 rounded-full"></div>
                </div>
                <p class="text-gray-600">${message}</p>
                <div class="progress-bar mt-4">
                    <div class="progress-fill"></div>
                </div>
            </div>
        `;
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    
    function showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
});
