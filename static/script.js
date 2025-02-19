document.addEventListener("DOMContentLoaded", function () {
    
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    darkModeToggle.addEventListener("click", function () {
        document.documentElement.classList.toggle("dark");
    });

    // Elements
    const modeSelector = document.getElementById("mode-selector");
    const pdfSection = document.getElementById("pdf-section");
    const urlSection = document.getElementById("url-section");
    const dropZone = document.querySelector(".border-dashed");
    const pdfUpload = document.getElementById("pdf-upload");
    const uploadBtn = document.getElementById("upload-btn");
    const urlInput = document.getElementById("url-input");
    const processUrlBtn = document.getElementById("process-url-btn");
    const urlList = document.getElementById("url-list");
    const queryInput = document.getElementById("query-input");
    const queryBtn = document.getElementById("query-btn");
    const responseArea = document.getElementById("response-area");
    
    // Meeting Elements
    const scheduleMeetingBtn = document.getElementById("schedule-meeting-btn");
    const meetingTitle = document.getElementById("meeting-title");
    const meetingTime = document.getElementById("meeting-time");

    // Create PDF preview area
    const previewArea = document.createElement("div");
    previewArea.id = "pdf-preview";
    previewArea.className = "mt-4";
    pdfSection.appendChild(previewArea);

    // Mode Selection Handler
    modeSelector.addEventListener("change", function () {
        if (this.value === "pdf") {
            pdfSection.classList.remove("hidden");
            urlSection.classList.add("hidden");
        } else {
            pdfSection.classList.add("hidden");
            urlSection.classList.remove("hidden");
        }
    });

    // PDF Upload Handlers
    pdfUpload.addEventListener("change", handleFileSelect);

    dropZone.addEventListener("click", () => {
        pdfUpload.click();
    });

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("border-blue-500");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("border-blue-500");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("border-blue-500");
        
        if (e.dataTransfer.files.length) {
            pdfUpload.files = e.dataTransfer.files;
            handleFileSelect({ target: pdfUpload });
        }
    });

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            dropZone.querySelector("p").textContent = `Selected: ${file.name}`;
            
            const objectUrl = URL.createObjectURL(file);
            previewArea.innerHTML = "";
            
            const embed = document.createElement("embed");
            embed.src = objectUrl;
            embed.type = "application/pdf";
            embed.className = "w-full h-[600px] border rounded";
            
            previewArea.appendChild(embed);
            uploadBtn.disabled = false;
        } else {
            alert("Please select a valid PDF file.");
            dropZone.querySelector("p").textContent = "Drag & Drop your PDF here or Browse";
            previewArea.innerHTML = "";
            uploadBtn.disabled = true;
        }
    }

    // PDF Upload Submit Handler
    uploadBtn.addEventListener("click", function () {
        if (!pdfUpload.files.length) {
            alert("Please select a PDF file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("file", pdfUpload.files[0]);

        uploadBtn.textContent = "Uploading...";
        uploadBtn.disabled = true;

        fetch("http://localhost:8000/upload", {
            method: "POST",
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            return response.json();
        })
        .then(data => {
            alert("PDF uploaded and processed successfully!");
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Upload failed. Please try again.");
        })
        .finally(() => {
            uploadBtn.textContent = "Upload";
            uploadBtn.disabled = false;
        });
    });

    // URL Processing Handler
    processUrlBtn.addEventListener("click", function () {
        const url = urlInput.value.trim();
        if (!url) {
            alert("Please enter a URL.");
            return;
        }

        processUrlBtn.textContent = "Processing...";
        processUrlBtn.disabled = true;

        fetch("http://localhost:8000/process-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('URL processing failed');
            }
            return response.json();
        })
        .then(data => {
            const p = document.createElement("p");
            p.className = "mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded";
            p.textContent = `Processed URL: ${url}`;
            urlList.insertBefore(p, urlList.firstChild);
            urlInput.value = "";
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Failed to process URL. Please try again.");
        })
        .finally(() => {
            processUrlBtn.textContent = "Process";
            processUrlBtn.disabled = false;
        });
    });

    // Query Handler
    queryBtn.addEventListener("click", function () {
        const query = queryInput.value.trim();
        if (!query) {
            alert("Please enter a question.");
            return;
        }

        queryBtn.textContent = "Asking...";
        queryBtn.disabled = true;
        responseArea.textContent = "Thinking...";

        const endpoint = modeSelector.value === "pdf" ? "/query-pdf" : "/query-url";
        
        fetch(`http://localhost:8000${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Query failed');
            }
            return response.json();
        })
        .then(data => {
            responseArea.textContent = data.response || "No answer available.";
            queryInput.value = "";
        })
        .catch(error => {
            console.error("Error:", error);
            responseArea.textContent = "Failed to get answer. Please try again.";
        })
        .finally(() => {
            queryBtn.textContent = "Ask";
            queryBtn.disabled = false;
        });
    });

    // Meeting Scheduling Handler
    scheduleMeetingBtn.addEventListener("click", function() {
        if (!meetingTitle.value.trim() || !meetingTime.value) {
            alert("Please fill in both meeting title and time.");
            return;
        }

        scheduleMeetingBtn.textContent = "Scheduling...";
        scheduleMeetingBtn.disabled = true;

        fetch("http://localhost:8000/schedule-meeting", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: meetingTitle.value.trim(),
                datetime: meetingTime.value
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Meeting scheduling failed');
            }
            return response.json();
        })
        .then(data => {
            alert("Meeting scheduled successfully!");
            meetingTitle.value = "";
            meetingTime.value = "";
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Failed to schedule meeting. Please try again.");
        })
        .finally(() => {
            scheduleMeetingBtn.textContent = "Schedule";
            scheduleMeetingBtn.disabled = false;
        });
    });
});
