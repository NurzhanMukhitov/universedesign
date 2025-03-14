document.addEventListener('DOMContentLoaded', function() {
    console.log("JavaScript is running!");

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
<<<<<<< HEAD
                
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

=======
            }

>>>>>>> 6e3bbf48720fa692cfb1a97263252d55c9415498
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
    var linesX = 14, linesY = 14, pointsPerLine = 10;
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

    // Функция для открытия модального окна проекта
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
<<<<<<< HEAD
                    <img src="${projectData.galleryUrls[0]}" alt="Project image 1" 
                         onload="console.log('Image loaded:', '${projectData.galleryUrls[0]}')" 
                         onerror="console.error('Image failed to load:', '${projectData.galleryUrls[0]}')"
                         class="fullscreen-trigger">
=======
                    <img src="${projectData.galleryUrls[0]}" alt="Project image 1" onload="console.log('Image loaded:', '${projectData.galleryUrls[0]}')" onerror="console.error('Image failed to load:', '${projectData.galleryUrls[0]}')">
>>>>>>> 6e3bbf48720fa692cfb1a97263252d55c9415498
                </div>
            `;
        }
        
        // Добавляем видео Vimeo для первого проекта
        if (projectId === 1) {
            console.log('Adding Vimeo video');
            modalContent += `
                <div style="padding:56.25% 0 0 0;position:relative;">
                    <iframe src="https://player.vimeo.com/video/902962085?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" 
                            frameborder="0" 
                            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" 
                            style="position:absolute;top:0;left:0;width:100%;height:100%;" 
<<<<<<< HEAD
                            title="INTERVALS 2023"
                            class="fullscreen-trigger">
=======
                            title="INTERVALS 2023">
>>>>>>> 6e3bbf48720fa692cfb1a97263252d55c9415498
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
<<<<<<< HEAD
                        <img src="${url}" alt="Project image ${index + 2}" 
                             onload="console.log('Image loaded:', '${url}')" 
                             onerror="console.error('Image failed to load:', '${url}')"
                             class="fullscreen-trigger">
=======
                        <img src="${url}" alt="Project image ${index + 2}" onload="console.log('Image loaded:', '${url}')" onerror="console.error('Image failed to load:', '${url}')">
>>>>>>> 6e3bbf48720fa692cfb1a97263252d55c9415498
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

<<<<<<< HEAD
        // Добавляем обработчики для полноэкранного просмотра
        modal.querySelectorAll('.fullscreen-trigger').forEach(media => {
            media.addEventListener('click', (e) => {
                e.stopPropagation();
                openFullscreen(media);
            });
        });

=======
>>>>>>> 6e3bbf48720fa692cfb1a97263252d55c9415498
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
        // Собираем все медиа элементы из текущего проекта (включая iframe для видео)
        fullscreenImages = Array.from(mediaElement.closest('.modal-slides').querySelectorAll('.fullscreen-trigger, iframe'));
        currentFullscreenIndex = fullscreenImages.indexOf(mediaElement);
        
        showCurrentMedia(mediaElement);
        
        // Показываем полноэкранный режим
        fullscreenView.classList.add('active');
        
        // Блокируем скролл
        document.body.style.overflow = 'hidden';

        // Добавляем обработчик клавиш
        document.addEventListener('keydown', handleFullscreenKeyPress);
    }

    function showCurrentMedia(mediaElement) {
        // Очищаем контейнер
        fullscreenMedia.innerHTML = '';
        
        if (mediaElement.tagName === 'IFRAME') {
            // Для Vimeo видео создаем новый iframe
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'padding:56.25% 0 0 0;position:relative;width:100%;max-width:1200px;';
            
            const iframe = document.createElement('iframe');
            iframe.src = mediaElement.src;
            iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media');
            iframe.setAttribute('allowfullscreen', '');
            
            wrapper.appendChild(iframe);
            fullscreenMedia.appendChild(wrapper);
            
            // Добавляем скрипт Vimeo Player API
            if (!document.querySelector('script[src="https://player.vimeo.com/api/player.js"]')) {
                const script = document.createElement('script');
                script.src = 'https://player.vimeo.com/api/player.js';
                document.body.appendChild(script);
            }
        } else {
            // Для изображений и других типов медиа
            const clone = mediaElement.cloneNode(true);
            if (clone.tagName === 'VIDEO') {
                clone.controls = true;
            }
            fullscreenMedia.appendChild(clone);
        }
        
        currentFullscreenMedia = mediaElement;
    }

    function closeFullscreen() {
        // Скрываем полноэкранный режим
        fullscreenView.classList.remove('active');
        currentFullscreenMedia = null;
        
        // Разблокируем скролл
        document.body.style.overflow = '';
        
        // Если было видео, останавливаем его
        const video = fullscreenMedia.querySelector('video');
        if (video) {
            video.pause();
        }
        
        // Если было Vimeo видео, останавливаем его
        const iframe = fullscreenMedia.querySelector('iframe');
        if (iframe && iframe.src.includes('vimeo')) {
            iframe.src = iframe.src;
        }
        
        // Очищаем контейнер
        fullscreenMedia.innerHTML = '';

        // Удаляем обработчик клавиш
        document.removeEventListener('keydown', handleFullscreenKeyPress);
    }

    function showNextImage() {
        if (currentFullscreenIndex < fullscreenImages.length - 1) {
            currentFullscreenIndex++;
            const nextMedia = fullscreenImages[currentFullscreenIndex];
            showCurrentMedia(nextMedia);
        }
    }

    function showPrevImage() {
        if (currentFullscreenIndex > 0) {
            currentFullscreenIndex--;
            const prevMedia = fullscreenImages[currentFullscreenIndex];
            showCurrentMedia(prevMedia);
        }
    }

    function handleFullscreenKeyPress(e) {
        if (fullscreenView.classList.contains('active')) {
            if (e.key === 'ArrowRight') {
                showNextImage();
            } else if (e.key === 'ArrowLeft') {
                showPrevImage();
            } else if (e.key === 'Escape') {
                closeFullscreen();
            }
        }
    }

    // Обработчики событий для полноэкранного просмотра
    closeFullscreenBtn.addEventListener('click', closeFullscreen);

    // Добавляем обработчики для свайпов на мобильных устройствах
    let touchStartX = 0;
    let touchEndX = 0;

    fullscreenView.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    fullscreenView.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);

    function handleSwipe() {
        const swipeThreshold = 50; // минимальное расстояние для свайпа
        const swipeLength = touchEndX - touchStartX;
        
        if (Math.abs(swipeLength) > swipeThreshold) {
            if (swipeLength > 0) {
                showPrevImage();
            } else {
                showNextImage();
            }
        }
    }
});
