document.addEventListener('DOMContentLoaded', function() {
    console.log("JavaScript is running!");

    // Определение производительности устройства
    const isLowPerfDevice = () => {
        return window.innerWidth < 768 && !window.matchMedia('(min-resolution: 2dppx)').matches;
    };

    // Адаптация параметров в зависимости от устройства
    var linesX = isLowPerfDevice() ? 10 : 14;
    var linesY = isLowPerfDevice() ? 10 : 14;
    var pointsPerLine = isLowPerfDevice() ? 8 : 10;

    // Функция для загрузки данных проекта
    async function loadProjectData(projectId) {
        try {
            const response = await fetch(`projects/project_${projectId}/meta.json`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error loading project ${projectId} data:`, error);
            return null;
        }
    }

    // Функция для обновления изображений проекта
    async function updateProjectImages() {
        const projectItems = document.querySelectorAll('.project-item');
        
        for (let i = 0; i < projectItems.length; i++) {
            const projectId = i + 1;
            const projectData = await loadProjectData(projectId);
            
            // Устанавливаем изображение обложки
            const img = projectItems[i].querySelector('img');
            if (img) {
                // Используем локальный путь к обложке
                img.src = `projects/project_${projectId}/covers/cover.jpg`;
                img.alt = '';
                console.log(`Setting cover image for project ${projectId}:`, img.src);
                
                // Добавляем обработчик клика для изображения
                img.addEventListener('click', function(e) {
                    // Если клик был по изображению внутри проекта
                    if (this.closest('.project-content')) {
                        e.stopPropagation(); // Предотвращаем всплытие события
                        openFullscreen(this);
                    }
                });
            }

            // Добавляем обработчики для видео, если они есть
            const videos = projectItems[i].querySelectorAll('video');
            videos.forEach(video => {
                video.addEventListener('click', function(e) {
                    if (this.closest('.project-content')) {
                        e.stopPropagation();
                        openFullscreen(this);
                    }
                });
            });

            // Удаляем все существующие span элементы
            const spans = projectItems[i].querySelectorAll('span');
            spans.forEach(span => span.remove());

            // Добавляем название для первого проекта
            if (projectId === 1) {
                const span = document.createElement('span');
                span.textContent = 'INTERVALS 2023';
                span.style.fontSize = 'clamp(16px, 1.125rem, 20px)';
                projectItems[i].appendChild(span);
            }
        }
    }

    // Вызываем функцию обновления изображений
    updateProjectImages();

    // Размеры экрана
    var ww = window.innerWidth, wh = window.innerHeight;

    // Получаем DOM элементы
    var canvas = document.getElementById("c");
    var menuBtn = document.querySelector('.menu-btn');
    var logoText = document.querySelector('.logo-text');
    var overlayMask = document.querySelector('.overlay-mask');
    var activePopup = null;
    
    // Элементы для полноэкранного просмотра
    var fullscreenView = document.querySelector('.fullscreen-view');
    var fullscreenMedia = document.querySelector('.fullscreen-media');
    var closeFullscreenBtn = document.querySelector('.close-fullscreen');
    var currentFullscreenMedia = null;

    // Настройка canvas с учётом devicePixelRatio для чёткости
    var dpr = window.devicePixelRatio || 1;
    canvas.width = ww * dpr;
    canvas.height = wh * dpr;
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    canvas.style.width = ww + "px";
    canvas.style.height = wh + "px";

    // Параметры куба
    var tParam = 1; // 1 = хаос, 0 = собранный куб
    var rotationX = 0, rotationY = 0;
    var letters = "UNIVERSEDESIGN";
    var focale = 500;
    var defaultRotationX = -0.4, defaultRotationY = 0.5;
    var autoRotateSpeed = 0.002;

    // Управление жестами
    var drag = false, oldX = 0, oldY = 0;
    var scrollThreshold = (ww < 768) ? 50 : 100;
    var scrollAccumulator = 0;
    var touchStartY = 0;

    // Для анимации
    var lastTime = 0;

    // Система логирования
    var debugLog = {
        lastFrameTime: performance.now(),
        frameDeltas: [],
        isLogging: true,
        maxLogs: 60, // Хранить данные за последние 60 кадров
        
        logFrame: function(time) {
            if (!this.isLogging) return;
            
            const currentTime = performance.now();
            const frameDelta = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;
            
            // Сохраняем время кадра
            this.frameDeltas.push({
                time: currentTime,
                delta: frameDelta,
                fps: 1000 / frameDelta,
                tParam: tParam,
                rotation: { x: rotationX, y: rotationY }
            });
            
            // Ограничиваем количество логов
            if (this.frameDeltas.length > this.maxLogs) {
                this.frameDeltas.shift();
            }
            
            // Выводим предупреждение если кадр занял больше 32мс (меньше 30 FPS)
            if (frameDelta > 32) {
                console.warn(`Низкий FPS: ${(1000 / frameDelta).toFixed(1)} FPS (${frameDelta.toFixed(2)}мс)`);
            }
        },
        
        logAction: function(action, data) {
            if (!this.isLogging) return;
            console.log(`Действие: ${action}`, {
                time: performance.now(),
                tParam: tParam,
                rotation: { x: rotationX, y: rotationY },
                ...data
            });
        },
        
        getAverageFPS: function() {
            if (this.frameDeltas.length === 0) return 0;
            const sum = this.frameDeltas.reduce((acc, frame) => acc + frame.fps, 0);
            return (sum / this.frameDeltas.length).toFixed(1);
        }
    };

    // Массив точек
    var pointsArray = [];

    // Класс Point
    function Point(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.originalX = x;
        this.originalY = y;
        this.originalZ = z;
        this.scatterX = Math.random() * 2000 - 1000;
        this.scatterY = Math.random() * 2000 - 1000;
        this.scatterZ = Math.random() * 2000 - 1000;
    }

    Point.prototype.rotateX = function(angle) {
        var cosA = Math.cos(angle), sinA = Math.sin(angle);
        var y = this.y * cosA - this.z * sinA;
        var z = this.y * sinA + this.z * cosA;
        this.y = y; this.z = z;
    };

    Point.prototype.rotateY = function(angle) {
        var cosA = Math.cos(angle), sinA = Math.sin(angle);
        var x = this.x * cosA + this.z * sinA;
        var z = -this.x * sinA + this.z * cosA;
        this.x = x; this.z = z;
    };

    Point.prototype.draw = function(i, j) {
        var scale = focale / (focale + this.z);
        if (j === linesY - 1 && tParam <= 0.1) {
            ctx.font = "bold 14px OneDay";
            ctx.fillStyle = "#ffffff";
        } else {
            ctx.font = "14px OneDay";
            var bf = 1 - (this.z + 1000) / 2000;
            bf = Math.max(0, Math.min(1, bf));
            var shade = Math.floor(128 + bf * 127);
            ctx.fillStyle = "rgb(" + shade + "," + shade + "," + shade + ")";
        }
        var xPos = ww / 2 + this.x * scale;
        var yPos = wh / 2 + this.y * scale;
        var text = letters[i % letters.length];
        ctx.fillText(text, xPos, yPos);
    };

    function getCubeSize() {
        var w = window.innerWidth;
        if (w < 576) return 180;
        if (w < 768) return 220;
        if (w < 992) return 260;
        if (w < 1200) return 300;
        if (w < 1400) return 340;
        return 360;
    }

    function createPoints() {
        pointsArray = [];
        var cubeSize = getCubeSize();
        var spaceX = cubeSize / linesX;
        var spaceY = cubeSize / linesY;
        var topZ = cubeSize / 2;
        var botZ = -cubeSize / 2;
        for (var j = 0; j < linesY; j++) {
            for (var i = 0; i < linesX; i++) {
                var x = -cubeSize / 2 + i * spaceX;
                var y = -cubeSize / 2 + j * spaceY;
                for (var k = 0; k < pointsPerLine; k++) {
                    var z = topZ + (botZ - topZ) / pointsPerLine * k;
                    var point = new Point(x, y, z);
                    pointsArray.push(point);
                }
            }
        }
    }
    createPoints();

    function drawPoints() {
        for (var i = 0; i < linesX; i++) {
            for (var j = 0; j < linesY; j++) {
                for (var k = 0; k < pointsPerLine; k++) {
                    var idx = i * linesY * pointsPerLine + j * pointsPerLine + k;
                    var point = pointsArray[idx];
                    point.x = (1 - tParam) * point.originalX + tParam * point.scatterX;
                    point.y = (1 - tParam) * point.originalY + tParam * point.scatterY;
                    point.z = (1 - tParam) * point.originalZ + tParam * point.scatterZ;
                    point.rotateX(rotationX);
                    point.rotateY(rotationY);
                    point.draw(i, j);
                }
            }
        }
    }

    // Добавляем функцию для управления видимостью элементов
    function updateElementsVisibility(shouldShow) {
        if (shouldShow) {
            // Показываем элементы
            menuBtn.style.display = "block";
            logoText.style.display = "block";
            
            // Форсируем reflow
            void menuBtn.offsetHeight;
            void logoText.offsetHeight;
            
            // Добавляем классы видимости
            requestAnimationFrame(() => {
                menuBtn.classList.add('visible');
                logoText.classList.add('visible');
            });
        } else {
            // Убираем классы видимости одновременно
            menuBtn.classList.remove('visible');
            logoText.classList.remove('visible');
            
            // Ждем окончания анимации перед скрытием
            setTimeout(() => {
                if (!shouldShow) {
                    // Скрываем элементы одновременно
                    requestAnimationFrame(() => {
                        menuBtn.style.display = "none";
                        logoText.style.display = "none";
                    });
                }
            }, 1200); // Увеличили время в соответствии с CSS
        }
    }

    function render(time) {
        var deltaTime = time - lastTime;
        lastTime = time;

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, ww, wh);

        drawPoints();
        debugLog.logFrame(time);

        if (!drag) {
            rotationY += 0.0002 * deltaTime;
        }
        
        // Обрабатываем оверлеи
        if (tParam > 0.1) {
            var overlays = document.querySelectorAll('.overlay-menu, .popup-block, .overlay-mask');
            overlays.forEach(function(el) {
                if (el.classList.contains('overlay-menu')) {
                    el.classList.remove('visible');
                    setTimeout(() => {
                        el.style.display = "none";
                    }, 1200);
                } else {
                    el.style.display = "none";
                }
            });
        }

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function onResize() {
        ww = window.innerWidth;
        wh = window.innerHeight;
        var dpr = window.devicePixelRatio || 1;
        canvas.width = ww * dpr;
        canvas.height = wh * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        canvas.style.width = ww + "px";
        canvas.style.height = wh + "px";
        createPoints();
    }
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', function() {
        setTimeout(onResize, 500);
    });
    onResize();

    canvas.addEventListener('mousedown', function(e) {
        handleStart(e.pageX, e.pageY);
    });
    canvas.addEventListener('mousemove', function(e) {
        handleMove(e.pageX, e.pageY);
    });
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);

    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        var touch = e.touches[0];
        handleStart(touch.pageX, touch.pageY);
        touchStartY = touch.pageY;
        oldY = touch.pageY;
    }, { passive: false });
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        var touch = e.touches[0];
        handleMove(touch.pageX, touch.pageY);
        var deltaY = touchStartY - touch.pageY;
        handleScroll(deltaY);
        touchStartY = touch.pageY;
    }, { passive: false });
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        handleEnd();
    }, { passive: false });

    function handleStart(x, y) {
        drag = true;
        oldX = x;
        oldY = y;
    }
    function handleMove(x, y) {
        if (drag) {
            rotationY += (x - oldX) * 0.01;
            rotationX += (y - oldY) * 0.01;
            oldX = x;
            oldY = y;
        }
    }
    function handleEnd() {
        drag = false;
    }

    function handleScroll(deltaY) {
        debugLog.logAction('scroll', { deltaY, scrollAccumulator });
        scrollAccumulator += deltaY;
        if (scrollAccumulator > scrollThreshold) {
            animateScatter();
            scrollAccumulator = 0;
        } else if (scrollAccumulator < -scrollThreshold) {
            animateGather();
            scrollAccumulator = 0;
        }
    }
    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        handleScroll(e.deltaY);
    });

    function animateGather() {
        debugLog.logAction('gather_start', { initTParam: tParam });
        console.log("Animating gather");
        var startTime = performance.now();
        var initT = tParam;
        var duration = 1500;
        var startRotationX = rotationX;
        var startRotationY = rotationY;
        function step(currentTime) {
            var elapsed = currentTime - startTime;
            var progress = Math.min(elapsed / duration, 1);
            tParam = initT * (1 - progress);
            rotationX = startRotationX + (defaultRotationX - startRotationX) * progress;
            rotationY = startRotationY + (defaultRotationY - rotationY) * progress;
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                tParam = 0;
                rotationX = defaultRotationX;
                rotationY = defaultRotationY;
                debugLog.logAction('gather_complete', {});
                // Показываем элементы после завершения анимации куба
                menuBtn.style.display = "block";
                logoText.style.display = "block";
                requestAnimationFrame(() => {
                    menuBtn.classList.add('visible');
                    logoText.classList.add('visible');
                });
            }
        }
        requestAnimationFrame(step);
    }

    function animateScatter() {
        debugLog.logAction('scatter_start', { initTParam: tParam });
        console.log("Animating scatter");
        
        // Начинаем обе анимации одновременно
        var startTime = performance.now();
        var initT = tParam;
        var duration = 1500;
        
        // Запускаем исчезновение интерфейса
        menuBtn.classList.remove('visible');
        logoText.classList.remove('visible');
        setTimeout(() => {
            menuBtn.style.display = "none";
            logoText.style.display = "none";
        }, 1200);
        
        // Запускаем анимацию рассеивания букв
        function step(currentTime) {
            var elapsed = currentTime - startTime;
            var progress = Math.min(elapsed / duration, 1);
            tParam = initT + (1 - initT) * progress;
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                tParam = 1;
                debugLog.logAction('scatter_complete', {});
            }
        }
        requestAnimationFrame(step);
    }

    var menuOverlay = document.querySelector('.overlay-menu');
    if (menuBtn) {
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (menuOverlay.classList.contains('visible')) {
                menuOverlay.classList.remove('visible');
                setTimeout(() => {
                    menuOverlay.style.display = "none";
                }, 400);
            } else {
                menuOverlay.style.display = "block";
                requestAnimationFrame(() => {
                    menuOverlay.classList.add('visible');
                });
            }
        });
    }

    if (logoText) {
        logoText.addEventListener('click', function(e) {
            e.stopPropagation();
            animateGather();
        });
    }

    document.addEventListener('click', function(e) {
        if (activePopup) {
            overlayMask.classList.remove('visible');
            activePopup.classList.remove('visible');
            setTimeout(() => {
                overlayMask.style.display = "none";
                activePopup.style.display = "none";
                activePopup = null;
            }, 400);
        }
    });

    var menuLinks = document.querySelectorAll('.overlay-menu a');
    menuLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var section = this.dataset.section;
            
            // Показываем маску и попап с анимацией
            overlayMask.style.display = 'block';
            activePopup = document.getElementById(section);
            if (activePopup) {
                activePopup.style.display = 'block';
                // Добавляем небольшую задержку для плавности
                setTimeout(() => {
                    overlayMask.classList.add('visible');
                    activePopup.classList.add('visible');
                }, 20);
            }
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && activePopup) {
            overlayMask.classList.remove('visible');
            activePopup.classList.remove('visible');
            setTimeout(() => {
                overlayMask.style.display = "none";
                activePopup.style.display = "none";
                activePopup = null;
            }, 1200);
        }
    });

    // Добавляем кэш для предзагруженных плееров
    const videoPlayers = new Map();

    // Функция для предзагрузки видеоплеера
    function preloadVideoPlayer(videoSrc) {
        if (!videoPlayers.has(videoSrc)) {
            const iframe = document.createElement('iframe');
            iframe.src = videoSrc;
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.style.aspectRatio = '16/9';
            iframe.frameBorder = '0';
            iframe.allow = 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media';
            videoPlayers.set(videoSrc, iframe);
        }
        return videoPlayers.get(videoSrc);
    }

    // Добавляем предзагрузку при открытии проекта
    async function openProjectModal(projectId) {
        console.log('Opening modal for project:', projectId);
        const projectData = await loadProjectData(projectId);
        console.log('Project data:', projectData);
        let modalContent = '';
        
        // Добавляем первую картинку
        if (projectData.galleryUrls && projectData.galleryUrls.length > 0) {
            console.log('Adding first image:', projectData.galleryUrls[0]);
            modalContent += `
                <div class="slide">
                    <img src="${projectData.galleryUrls[0]}" alt="Project image 1" 
                         onload="console.log('Image loaded:', '${projectData.galleryUrls[0]}')" 
                         onerror="console.error('Image failed to load:', '${projectData.galleryUrls[0]}')"
                         class="fullscreen-trigger">
                </div>
            `;
        }
        
        // Добавляем видео Vimeo для первого проекта и предзагружаем его
        if (projectId === 1) {
            console.log('Adding Vimeo video');
            const videoSrc = "https://player.vimeo.com/video/902962085?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479";
            preloadVideoPlayer(videoSrc); // Предзагружаем видео
            modalContent += `
                <div style="padding:56.25% 0 0 0;position:relative;">
                    <iframe src="${videoSrc}" 
                            frameborder="0" 
                            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" 
                            style="position:absolute;top:0;left:0;width:100%;height:100%;" 
                            title="INTERVALS 2023"
                            class="fullscreen-trigger">
                    </iframe>
                </div>
                <script src="https://player.vimeo.com/api/player.js"></script>
            `;
        }
        
        // Добавляем оставшиеся картинки
        if (projectData.galleryUrls && projectData.galleryUrls.length > 1) {
            console.log('Adding remaining images');
            const remainingImages = projectData.galleryUrls.slice(1);
            remainingImages.forEach((url, index) => {
                console.log('Adding remaining image:', url);
                modalContent += `
                    <div class="slide">
                        <img src="${url}" alt="Project image ${index + 2}" 
                             onload="console.log('Image loaded:', '${url}')" 
                             onerror="console.error('Image failed to load:', '${url}')"
                             class="fullscreen-trigger">
                    </div>
                `;
            });
        }

        // Добавляем логотип Behance для первого проекта
        if (projectId === 1) {
            modalContent += `
                <a href="https://www.behance.net/gallery/183591977/INTERSECTION" target="_blank" class="behance-link">
                    <img src="logo/behance.png" alt="Behance">
                </a>
            `;
        }

        const modalHtml = `
            <div class="modal-content">
                <button class="back-button" style="position: fixed; left: 20px; top: 20px; z-index: 1000; background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 10px;">←</button>
                <button class="close-modal">&times;</button>
                <div class="modal-slides">
                    ${modalContent}
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.className = 'project-modal';
        modal.innerHTML = modalHtml;
        document.body.appendChild(modal);

        // Добавляем обработчики для полноэкранного просмотра
        modal.querySelectorAll('.fullscreen-trigger').forEach(media => {
            media.addEventListener('click', (e) => {
                e.stopPropagation();
                openFullscreen(media);
            });
        });

        // Анимация появления
        requestAnimationFrame(() => {
            modal.classList.add('visible');
        });

        // Обработчики для закрытия
        const backBtn = modal.querySelector('.back-button');
        const closeBtn = modal.querySelector('.close-modal');
        
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
            }, 400);
        });

        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
            }, 400);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                e.preventDefault();
                modal.classList.remove('visible');
                setTimeout(() => {
                    modal.remove();
                }, 400);
            }
        });

        document.addEventListener('keydown', function handleEscape(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                modal.classList.remove('visible');
                setTimeout(() => {
                    modal.remove();
                }, 400);
                document.removeEventListener('keydown', handleEscape);
            }
        });
    }

    // Добавляем обработчики для проектов
    document.querySelectorAll('.project-item').forEach((item, index) => {
        item.addEventListener('click', () => {
            openProjectModal(index + 1);
        });
    });

    console.log("All event listeners attached");

    // Функции для полноэкранного просмотра
    let currentFullscreenIndex = 0;
    let fullscreenImages = [];

    function openFullscreen(mediaElement) {
        // Удаляем старый fullscreenView, если он существует
        if (fullscreenView) {
            fullscreenView.remove();
        }

        // Создаем новый fullscreenView каждый раз
        fullscreenView = document.createElement('div');
        fullscreenView.className = 'fullscreen-view';
        document.body.appendChild(fullscreenView);

        const content = document.createElement('div');
        content.className = 'fullscreen-content';
        fullscreenView.appendChild(content);

        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'fullscreen-media';
        content.appendChild(mediaContainer);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-fullscreen';
        closeBtn.innerHTML = '×';
        content.appendChild(closeBtn);

        // Добавляем кнопку next только для десктопов
        if (window.innerWidth > 768) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'next-fullscreen';
            content.appendChild(nextBtn);
            
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showNextImage();
            });
        }

        // Добавляем индикатор свайпа для мобильных
        if (window.innerWidth <= 768) {
            const swipeIndicator = document.createElement('div');
            swipeIndicator.className = 'swipe-indicator';
            swipeIndicator.textContent = 'Свайпните влево для навигации';
            content.appendChild(swipeIndicator);
            
            // Скрываем индикатор после 5 секунд
            setTimeout(() => {
                swipeIndicator.style.display = 'none';
            }, 5000);
        }

        // Добавляем обработчики событий
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeFullscreen();
        });

        fullscreenMedia = mediaContainer;

        // Получаем все изображения и видео в текущем проекте, исключая логотип Behance
        const projectContent = mediaElement.closest('.modal-slides');
        fullscreenImages = Array.from(projectContent.querySelectorAll('.slide img, iframe:not([src*="player.vimeo.com/api"])')).filter(el => !el.closest('.behance-link'));
        currentFullscreenIndex = fullscreenImages.indexOf(mediaElement);

        // Показываем контент
        showCurrentMedia();
        
        // Добавляем обработчики клавиш
        document.addEventListener('keydown', handleFullscreenKeyPress);

        // Активируем полноэкранный режим
        requestAnimationFrame(() => {
            fullscreenView.classList.add('active');
        });

        // Улучшенные обработчики для свайпов
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartTime = 0;
        
        fullscreenView.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            touchStartTime = Date.now();
        }, { passive: true });
        
        fullscreenView.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;
            handleSwipe(touchDuration);
        }, { passive: true });
        
        function handleSwipe(duration) {
            const swipeThreshold = window.innerWidth * 0.15; // 15% от ширины экрана
            const swipeLength = touchEndX - touchStartX;
            const swipeSpeed = Math.abs(swipeLength) / duration;
            
            // Учитываем скорость свайпа и длину
            if (Math.abs(swipeLength) > swipeThreshold || (Math.abs(swipeLength) > 30 && swipeSpeed > 0.5)) {
                if (swipeLength > 0) {
                    showPreviousImage();
                } else {
                    showNextImage();
                }
            }
        }
    }

    // Модифицируем функцию showCurrentMedia
    function showCurrentMedia() {
        const media = fullscreenImages[currentFullscreenIndex];
        fullscreenMedia.innerHTML = '';
        
        if (media.tagName.toLowerCase() === 'iframe') {
            const videoSrc = media.src;
            const player = preloadVideoPlayer(videoSrc);
            if (player) {
                const clone = player.cloneNode(true);
                fullscreenMedia.appendChild(clone);
            }
        } else {
            const clone = media.cloneNode();
            fullscreenMedia.appendChild(clone);
        }
    }

    // Функция для показа следующего изображения
    function showNextImage() {
        currentFullscreenIndex = (currentFullscreenIndex + 1) % fullscreenImages.length;
        showCurrentMedia();
    }

    // Функция для показа предыдущего изображения
    function showPreviousImage() {
        currentFullscreenIndex = (currentFullscreenIndex - 1 + fullscreenImages.length) % fullscreenImages.length;
        showCurrentMedia();
    }

    // Обработчик нажатий клавиш в полноэкранном режиме
    function handleFullscreenKeyPress(e) {
        if (e.key === 'Escape') {
            closeFullscreen();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.key === 'ArrowRight' ? showNextImage() : showPreviousImage();
        }
    }

    // Функция закрытия полноэкранного режима
    function closeFullscreen() {
        if (fullscreenView) {
            fullscreenView.classList.remove('active');
            document.removeEventListener('keydown', handleFullscreenKeyPress);
            
            // Останавливаем видео при закрытии
            const iframe = fullscreenMedia.querySelector('iframe');
            if (iframe) {
                iframe.src = '';
            }

            // Удаляем элемент после анимации
            setTimeout(() => {
                fullscreenView.remove();
                fullscreenView = null;
                fullscreenMedia = null;
            }, 300);
        }
    }

    // Управление видимостью иконки жеста
    const gestureHint = document.querySelector('.gesture-hint');
    if (gestureHint) {
        setTimeout(() => {
            gestureHint.classList.add('visible');
        }, 1000); // Показать через 1 секунду

        // Скрыть иконку после первого взаимодействия
        const hideGestureHint = () => {
            gestureHint.classList.remove('visible');
            localStorage.setItem('gestureHintShown', 'true');
        };

        // Проверяем, показывалась ли иконка ранее
        if (!localStorage.getItem('gestureHintShown')) {
            gestureHint.addEventListener('click', hideGestureHint);
            gestureHint.addEventListener('touchstart', hideGestureHint);
        }
    }
});
