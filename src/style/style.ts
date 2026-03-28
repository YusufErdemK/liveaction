/**
 * LiveAction TypeScript Utilities
 * Types, interfaces, ve helper functions
 */

// ============================================
// Types & Interfaces
// ============================================

export interface MediaFile {
    id: string;
    name: string;
    filename: string;
    size: number;
    type: 'video' | 'audio' | 'image';
    ext: string;
    path: string;
}

export interface MediaCollection {
    videos: MediaFile[];
    audios: MediaFile[];
    images: MediaFile[];
    total: number;
}

export interface PlaybackState {
    currentFile: MediaFile | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
}

export type MediaType = 'video' | 'audio' | 'image';
export type SectionType = 'all' | 'videos' | 'audios' | 'images';

// ============================================
// API Client
// ============================================

export class MediaAPI {
    private baseUrl: string = '';

    async getMedia(): Promise<MediaCollection> {
        try {
            const response = await fetch(`${this.baseUrl}/api/media`);
            if (!response.ok) throw new Error('Failed to fetch media');
            return response.json();
        } catch (error) {
            console.error('Error fetching media:', error);
            throw error;
        }
    }

    async getFiles(): Promise<MediaFile[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/files`);
            if (!response.ok) throw new Error('Failed to fetch files');
            return response.json();
        } catch (error) {
            console.error('Error fetching files:', error);
            throw error;
        }
    }

    getStreamUrl(fileId: string): string {
        return `${this.baseUrl}/stream/${fileId}`;
    }
}

// ============================================
// UI Manager
// ============================================

export class UIManager {
    private activeSection: SectionType = 'all';
    private currentFile: MediaFile | null = null;

    constructor() {
        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        // Navigation buttons
        document.querySelectorAll('.nav-item').forEach((button) => {
            button.addEventListener('click', (e) => {
                const section = (e.currentTarget as HTMLElement).dataset.section as SectionType;
                this.switchSection(section);
            });
        });

        // Modal close on outside click
        const modal = document.getElementById('player-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closePlayer();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePlayer();
            }
        });
    }

    switchSection(section: SectionType): void {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach((item) => {
            item.classList.toggle(
                'active',
                item.dataset.section === section
            );
        });

        this.activeSection = section;

        // Show/hide sections
        document.querySelectorAll('.media-section').forEach((el) => {
            const sectionType = el.dataset.type;
            if (section === 'all' || section === sectionType) {
                el.style.display = 'block';
            } else {
                el.style.display = 'none';
            }
        });

        // Update hero section
        this.updateHero(section);
    }

    private updateHero(section: SectionType): void {
        const heroTitle = document.getElementById('hero-title');
        const heroSubtitle = document.getElementById('hero-subtitle');

        if (!heroTitle || !heroSubtitle) return;

        const titles: Record<SectionType, { title: string; subtitle: string }> = {
            all: { title: 'Hoş geldiniz', subtitle: 'Tüm medyanız burada' },
            videos: { title: 'Videolar', subtitle: 'Film ve dizileriniz' },
            audios: { title: 'Müzik', subtitle: 'Müzik koleksiyonunuz' },
            images: { title: 'Resimler', subtitle: 'Görüntü galeriniz' }
        };

        const { title, subtitle } = titles[section];
        heroTitle.textContent = title;
        heroSubtitle.textContent = subtitle;
    }

    renderCarousel(type: MediaType, files: MediaFile[]): void {
        const track = document.getElementById(`${type}s-track`);
        const count = document.getElementById(`${type}s-count`);

        if (!track) return;

        if (files.length === 0) {
            track.innerHTML = '<p style="color: var(--text-secondary);">Dosya bulunamadı</p>';
            if (count) count.textContent = '0 item';
            return;
        }

        const icons: Record<MediaType, string> = {
            video: '🎬',
            audio: '🎵',
            image: '🖼️'
        };

        track.innerHTML = files
            .map(
                (file) => `
            <div class="carousel-item" onclick="playMedia('${file.id}', '${type}')">
                <div class="carousel-item-icon">${icons[type]}</div>
                <div class="carousel-item-title" title="${file.name}">
                    ${file.name}
                </div>
            </div>
        `
            )
            .join('');

        if (count) {
            count.textContent = `${files.length} ${files.length === 1 ? 'item' : 'item'}`;
        }
    }

    openPlayer(file: MediaFile): void {
        const modal = document.getElementById('player-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }

        const title = document.getElementById('player-title');
        const subtitle = document.getElementById('player-subtitle');

        if (title) title.textContent = file.name;
        if (subtitle) subtitle.textContent = file.ext.toUpperCase().replace('.', '');

        this.currentFile = file;
    }

    closePlayer(): void {
        const modal = document.getElementById('player-modal');
        if (modal) {
            modal.classList.add('hidden');
        }

        const videoPlayer = document.getElementById('video-player') as HTMLVideoElement;
        const audioPlayer = document.getElementById('audio-player') as HTMLAudioElement;

        if (videoPlayer) {
            videoPlayer.pause();
            videoPlayer.src = '';
        }
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.src = '';
        }

        this.currentFile = null;
    }

    playMedia(fileId: string, type: MediaType): void {
        const api = new MediaAPI();
        const streamUrl = api.getStreamUrl(fileId);

        const videoPlayer = document.getElementById('video-player') as HTMLVideoElement;
        const audioPlayer = document.getElementById('audio-player') as HTMLAudioElement;

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
    }

    showLoading(show: boolean): void {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.classList.toggle('hidden', !show);
        }
    }
}

// ============================================
// Utility Functions
// ============================================

export function formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function getDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}