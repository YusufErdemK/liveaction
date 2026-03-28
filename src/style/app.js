/**
 * LiveAction - Apple TV Style Media Server
 * Vanilla JS implementation
 */

// ============================================
// Global State
// ============================================

let mediaData = null;
let currentFile = null;

// ============================================
// API Functions
// ============================================

async function fetchMedia() {
    try {
        const response = await fetch('/api/media');
        if (!response.ok) throw new Error('Failed to fetch media');
        return await response.json();
    } catch (error) {
        console.error('Error fetching media:', error);
        return null;
    }
}

function getStreamUrl(fileId) {
    return `/stream/${fileId}`;
}

// ============================================
// UI Rendering
// ============================================

function renderCarousel(type, files) {
    const trackId = `${type}s-track`;
    const countId = `${type}s-count`;
    const track = document.getElementById(trackId);
    const countEl = document.getElementById(countId);

    if (!track) return;

    if (!files || files.length === 0) {
        track.innerHTML = '<p style="color: var(--text-secondary); padding: var(--spacing-lg);">Dosya bulunamadı</p>';
        if (countEl) countEl.textContent = '0 item';
        return;
    }

    const icons = {
        video: '🎬',
        audio: '🎵',
        image: '🖼️'
    };

    track.innerHTML = files
        .map(
            (file) => `
            <div class="carousel-item" onclick="playMedia('${file.id}', '${type}')">
                <div class="carousel-item-icon">${icons[type] || '📄'}</div>
                <div class="carousel-item-title" title="${file.name}">
                    ${file.name}
                </div>
            </div>
        `
        )
        .join('');

    if (countEl) {
        countEl.textContent = `${files.length} item`;
    }
}

async function loadAndRender() {
    showLoading(true);

    mediaData = await fetchMedia();

    if (!mediaData) {
        showLoading(false);
        return;
    }

    // Render carousels
    renderCarousel('video', mediaData.videos);
    renderCarousel('audio', mediaData.audios);
    renderCarousel('image', mediaData.images);

    showLoading(false);
}

// ============================================
// Navigation
// ============================================

function initNavigation() {
    document.querySelectorAll('.nav-item').forEach((button) => {
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            switchSection(section);
        });
    });
}

function switchSection(section) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach((item) => {
        if (item.dataset.section === section) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Show/hide sections
    document.querySelectorAll('.media-section').forEach((el) => {
        const sectionType = el.dataset.type;
        if (section === 'all' || section === sectionType) {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    });

    // Update hero
    updateHero(section);
}

function updateHero(section) {
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');

    if (!heroTitle || !heroSubtitle) return;

    const titles = {
        all: { title: 'Hoş geldiniz', subtitle: 'Tüm medyanız burada' },
        videos: { title: 'Videolar', subtitle: 'Film ve dizileriniz' },
        audios: { title: 'Müzik', subtitle: 'Müzik koleksiyonunuz' },
        images: { title: 'Resimler', subtitle: 'Görüntü galeriniz' }
    };

    const { title, subtitle } = titles[section];
    heroTitle.textContent = title;
    heroSubtitle.textContent = subtitle;
}

// ============================================
// Player Functions
// ============================================

function playMedia(fileId, type) {
    const streamUrl = getStreamUrl(fileId);

    const videoPlayer = document.getElementById('video-player');
    const audioPlayer = document.getElementById('audio-player');
    const playerTitle = document.getElementById('player-title');
    const playerSubtitle = document.getElementById('player-subtitle');

    // Get file info
    let fileInfo = null;
    if (mediaData) {
        const allFiles = [...(mediaData.videos || []), ...(mediaData.audios || []), ...(mediaData.images || [])];
        fileInfo = allFiles.find((f) => f.id === fileId);
    }

    // Update player title
    if (playerTitle && fileInfo) {
        playerTitle.textContent = fileInfo.name;
    }
    if (playerSubtitle && fileInfo) {
        playerSubtitle.textContent = fileInfo.ext.toUpperCase().replace('.', '');
    }

    // Set up player
    if (type === 'video') {
        videoPlayer.style.display = 'block';
        audioPlayer.style.display = 'none';
        videoPlayer.src = streamUrl;
        videoPlayer.load();
        videoPlayer.play();
    } else if (type === 'audio') {
        audioPlayer.style.display = 'block';
        videoPlayer.style.display = 'none';
        audioPlayer.src = streamUrl;
        audioPlayer.load();
        audioPlayer.play();
    }

    // Show player modal
    openPlayer();
}

function openPlayer() {
    const modal = document.getElementById('player-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closePlayer() {
    const modal = document.getElementById('player-modal');
    if (modal) {
        modal.classList.add('hidden');
    }

    const videoPlayer = document.getElementById('video-player');
    const audioPlayer = document.getElementById('audio-player');

    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.src = '';
    }
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = '';
    }
}

// ============================================
// Loading Indicator
// ============================================

function showLoading(show) {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        if (show) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }
}

// ============================================
// Keyboard Shortcuts
// ============================================

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePlayer();
        }
    });
}

// ============================================
// Modal Close on Backdrop Click
// ============================================

function initModalClick() {
    const modal = document.getElementById('player-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePlayer();
            }
        });
    }
}

// ============================================
// Initialize App
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initKeyboardShortcuts();
    initModalClick();
    loadAndRender();
});