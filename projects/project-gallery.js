// Функция для дебаунса
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Настройки по умолчанию
const defaultConfig = {
    galleryItemsQuery: '.gallery-item img, .youtube-container iframe, .vimeo-container iframe',
    fullscreenViewClass: 'fullscreen-view',
    fullscreenContentClass: 'fullscreen-content',
    fullscreenMediaClass: 'fullscreen-media',
    fullscreenActiveClass: 'active',
    closeButtonClass: 'close-fullscreen',
    prevButtonClass: 'prev-button',
    nextButtonClass: 'next-button',
    videoContainerClass: 'video-container',
    fullscreenIframeClass: 'fullscreen-iframe',
    backButtonClass: 'back-button'
};

class ProjectGallery {
    constructor(config = {}) {
        try {
            // Объединяем настройки по умолчанию с пользовательскими
            this.config = { ...defaultConfig, ...config };
            
            // Инициализация свойств
            this.currentMediaIndex = 0;
            this.touchStartX = 0;
            this.touchEndX = 0;

            // Получаем все элементы галереи
            this.mediaElements = Array.from(document.querySelectorAll(this.config.galleryItemsQuery));
            
            if (this.mediaElements.length === 0) {
                throw new Error('No gallery items found');
            }

            // Получаем элементы управления
            this.fullscreenView = document.querySelector(`.${this.config.fullscreenViewClass}`);
            if (!this.fullscreenView) {
                throw new Error('Fullscreen view element not found');
            }

            this.fullscreenMediaContainer = this.fullscreenView.querySelector(`.${this.config.fullscreenMediaClass}`);
            if (!this.fullscreenMediaContainer) {
                throw new Error('Fullscreen media container not found');
            }

            this.closeFullscreenBtn = document.querySelector(`.${this.config.closeButtonClass}`);
            this.prevButton = document.querySelector(`.${this.config.prevButtonClass}`);
            this.nextButton = document.querySelector(`.${this.config.nextButtonClass}`);
            this.backButton = document.querySelector(`.${this.config.backButtonClass}`);

            // Инициализация
            this.init();
        } catch (error) {
            console.error('Error initializing ProjectGallery:', error);
        }
    }

    init() {
        try {
            // Добавляем обработчики для каждого элемента галереи
            this.mediaElements.forEach((mediaElement, index) => {
                const clickableElement = mediaElement.tagName === 'IMG' ? 
                    mediaElement : 
                    mediaElement.closest('.youtube-container, .vimeo-container');

                if (clickableElement) {
                    clickableElement.style.cursor = 'pointer';
                    clickableElement.addEventListener('click', (e) => {
                        if (mediaElement.tagName === 'IFRAME' && e.target === mediaElement) {
                            return;
                        }
                        this.currentMediaIndex = index;
                        this.showMedia(this.currentMediaIndex);
                        this.openFullscreen();
                    });
                }

                // Обработка открытия видео в полноэкранном режиме
                if (mediaElement.tagName.toLowerCase() === 'video') {
                    this.handleVideoFullscreen(mediaElement);
                }
            });

            // Добавляем обработчики для кнопок
            if (this.closeFullscreenBtn) {
                this.closeFullscreenBtn.addEventListener('click', () => this.closeFullscreen());
            }
            if (this.prevButton) {
                this.prevButton.addEventListener('click', () => this.showPrevMedia());
            }
            if (this.nextButton) {
                this.nextButton.addEventListener('click', () => this.showNextMedia());
            }
            if (this.backButton) {
                this.backButton.addEventListener('click', () => {
                    const currentPath = window.location.pathname;
                    
                    // Всегда возвращаемся назад по истории
                    history.back();
                });
            }

            // Добавляем обработчик клавиш
            document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        } catch (error) {
            console.error('Error in ProjectGallery.init:', error);
        }
    }

    showMedia(index) {
        try {
            if (index < 0) {
                index = this.mediaElements.length - 1;
            } else if (index >= this.mediaElements.length) {
                index = 0;
            }
            this.currentMediaIndex = index;
            const currentElement = this.mediaElements[this.currentMediaIndex];

            if (!currentElement) {
                throw new Error('Current media element not found');
            }

            this.fullscreenMediaContainer.innerHTML = '';

            if (currentElement.tagName === 'IMG') {
                const img = document.createElement('img');
                img.src = currentElement.src;
                img.alt = currentElement.alt || '';
                
                // Добавляем обработку ошибок загрузки
                img.onerror = () => {
                    console.error('Error loading image:', currentElement.src);
                    img.src = 'path/to/fallback-image.jpg'; // Путь к запасному изображению
                };
                
                // Добавляем индикатор загрузки
                img.style.opacity = '0';
                img.onload = () => {
                    img.style.transition = 'opacity 0.3s ease';
                    img.style.opacity = '1';
                };
                
                this.fullscreenMediaContainer.appendChild(img);
            } else if (currentElement.tagName === 'IFRAME') {
                const container = document.createElement('div');
                container.className = this.config.videoContainerClass;
                const clone = currentElement.cloneNode(true);
                clone.classList.add(this.config.fullscreenIframeClass);
                container.appendChild(clone);
                this.fullscreenMediaContainer.appendChild(container);
            }
        } catch (error) {
            console.error('Error in ProjectGallery.showMedia:', error);
        }
    }

    openFullscreen() {
        try {
            this.fullscreenView.classList.add(this.config.fullscreenActiveClass);
            document.body.style.overflow = 'hidden';
            this.addSwipeListeners();
        } catch (error) {
            console.error('Error in ProjectGallery.openFullscreen:', error);
        }
    }

    closeFullscreen() {
        try {
            this.fullscreenView.classList.remove(this.config.fullscreenActiveClass);
            document.body.style.overflow = '';
            this.removeSwipeListeners();
        } catch (error) {
            console.error('Error in ProjectGallery.closeFullscreen:', error);
        }
    }

    showPrevMedia() {
        this.currentMediaIndex--;
        this.showMedia(this.currentMediaIndex);
    }

    showNextMedia() {
        this.currentMediaIndex++;
        this.showMedia(this.currentMediaIndex);
    }

    handleKeyPress(e) {
        if (!this.fullscreenView.classList.contains(this.config.fullscreenActiveClass)) return;

        if (e.key === 'Escape') {
            this.closeFullscreen();
        } else if (e.key === 'ArrowLeft') {
            this.showPrevMedia();
        } else if (e.key === 'ArrowRight') {
            this.showNextMedia();
        }
    }

    // Обработчики свайпов с дебаунсом
    handleTouchStart = (e) => {
        this.touchStartX = e.touches[0].clientX;
    }

    handleTouchMove = debounce((e) => {
        this.touchEndX = e.touches[0].clientX;
    }, 16);

    handleTouchEnd = () => {
        const swipeDistance = this.touchEndX - this.touchStartX;
        const minSwipeDistance = 50;

        if (Math.abs(swipeDistance) > minSwipeDistance) {
            if (swipeDistance > 0) {
                this.showPrevMedia();
            } else {
                this.showNextMedia();
            }
        }
    }

    addSwipeListeners() {
        try {
            this.fullscreenView.addEventListener('touchstart', this.handleTouchStart);
            this.fullscreenView.addEventListener('touchmove', this.handleTouchMove);
            this.fullscreenView.addEventListener('touchend', this.handleTouchEnd);
        } catch (error) {
            console.error('Error in ProjectGallery.addSwipeListeners:', error);
        }
    }

    removeSwipeListeners() {
        try {
            this.fullscreenView.removeEventListener('touchstart', this.handleTouchStart);
            this.fullscreenView.removeEventListener('touchmove', this.handleTouchMove);
            this.fullscreenView.removeEventListener('touchend', this.handleTouchEnd);
        } catch (error) {
            console.error('Error in ProjectGallery.removeSwipeListeners:', error);
        }
    }

    // Обработка открытия видео в полноэкранном режиме
    handleVideoFullscreen(video) {
        const fullscreenMedia = document.querySelector('.fullscreen-media');
        const clonedVideo = video.cloneNode(true);
        
        // Сохраняем текущие атрибуты
        clonedVideo.autoplay = true;
        clonedVideo.loop = true;
        clonedVideo.muted = true;
        clonedVideo.playsinline = true;
        
        fullscreenMedia.innerHTML = '';
        fullscreenMedia.appendChild(clonedVideo);
        
        // Автовоспроизведение при открытии
        clonedVideo.play().catch(function(error) {
            console.log("Autoplay prevented:", error);
        });
    }
}

// Автоматическая инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    try {
        new ProjectGallery();
        
        // Показываем логотип
        const logoText = document.querySelector('.logo-text');
        if (logoText) {
            setTimeout(() => {
                logoText.classList.add('visible');
            }, 100);
        }
    } catch (error) {
        console.error('Error initializing ProjectGallery on DOMContentLoaded:', error);
    }
}); 