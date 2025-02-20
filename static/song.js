let isPlaying = false;
let currentVideoId = '';

const searchInput = document.querySelector('.search-input');
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const input = searchInput.value.trim();
        const videoId = extractVideoId(input);
        if (videoId) {
            loadVideo(videoId);
            searchInput.value = '';
        }
    }
});

function extractVideoId(input) {
    const urlPattern = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const urlMatch = input.match(urlPattern);
    if (urlMatch) return urlMatch[1];
    if (input.length === 11) return input;
    return null;
}

function loadVideo(videoId) {
    currentVideoId = videoId;
    const embedHtml = `
        <iframe 
            id="player"
            src="https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&controls=0"
            allow="autoplay"
            frameborder="0"
        ></iframe>
    `;
    document.getElementById('youtube-embed').innerHTML = embedHtml;
    
    document.querySelector('.song-title').textContent = 'Loading...';
    document.querySelector('.artist').textContent = 'Neuro-Docxs Music Player';
    isPlaying = true;
    updatePlayButton();

    fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
        .then(response => response.json())
        .then(data => {
            document.querySelector('.song-title').textContent = data.title;
        });
}

document.querySelector('.play-btn').addEventListener('click', () => {
    const player = document.querySelector('#player');
    if (!player) return;

    if (isPlaying) {
        player.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    } else {
        player.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    }
    isPlaying = !isPlaying;
    updatePlayButton();
});

function updatePlayButton() {
    const playBtn = document.querySelector('.play-btn');
    playBtn.innerHTML = isPlaying 
        ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>'
        : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
}

setInterval(() => {
    if (isPlaying) {
        const progress = document.querySelector('.progress-bar');
        const currentWidth = parseFloat(progress.style.width) || 0;
        if (currentWidth < 100) {
            progress.style.width = `${currentWidth + 0.1}%`;
        } else {
            progress.style.width = '0%';
        }
    }
}, 100);

document.querySelector('.progress-container').addEventListener('click', (e) => {
    const player = document.querySelector('#player');
    if (!player) return;

    const progressContainer = document.querySelector('.progress-container');
    const clickPosition = (e.pageX - progressContainer.offsetLeft) / progressContainer.offsetWidth;
    const timeToSeek = clickPosition * 100;
    document.querySelector('.progress-bar').style.width = `${timeToSeek}%`;
    
    player.contentWindow.postMessage(`{"event":"command","func":"seekTo","args":[${timeToSeek * 100}, true]}`, '*');
});
