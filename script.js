document.addEventListener('DOMContentLoaded', function() {
    console.log("JavaScript is running!");

    // Размеры экрана
    var ww = window.innerWidth, wh = window.innerHeight;

    // Получаем DOM элементы
    var canvas = document.getElementById("c");
    var menuBtn = document.querySelector('.menu-btn');
    var logoText = document.querySelector('.logo-text');
    var overlayMask = document.querySelector('.overlay-mask');
    var gestureHint = document.querySelector('.gesture-hint');
    var gestureMask = document.querySelector('.gesture-mask');
    var activePopup = null;
    var menuOverlay = document.querySelector('.overlay-menu');
    var resetButton = document.querySelector('.reset-button');
    var isMenuLocked = false; // Флаг для фиксации меню
    
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
    var letters = "UNIVERSEDESIGN";
    var focale = 500;
    var defaultRotationX = -0.4, defaultRotationY = 0.5;
    var autoRotateSpeed = 0.0002;
    
    // Параметры для подсветки букв
    var highlightedPoints = new Set();
    var currentLetterIndex = 0;
    var letterHighlightDuration = 12000;
    var lastHighlightTime = 0;
    var highlightIntensity = 0;
    var fadeSpeed = 0.1;
    var canStartHighlight = false;

    // Определяем состояние куба на основе localStorage
    var forceChaotic = localStorage.getItem('force_chaotic_cube') === 'true';
    
    console.log("Cube state check:", { forceChaotic });
    
    if (forceChaotic) {
        // При принудительном обновлении куб в хаотичном состоянии
        console.log("Showing chaotic cube (forced)");
        tParam = 1;
        rotationX = 0;
        rotationY = 0;
        
        // Удаляем флаг принудительного режима после применения
        localStorage.removeItem('force_chaotic_cube');
        
        // Показываем gesture-hint
        if (gestureHint && gestureMask) {
            gestureHint.style.display = 'flex';
            gestureMask.style.display = 'block';
            gestureHint.classList.add('visible');
            gestureMask.classList.add('visible');
            
            // Блокируем взаимодействие на 3 секунды
            canvas.style.pointerEvents = 'none';
            setTimeout(() => {
                canvas.style.pointerEvents = 'auto';
                // Запускаем подсветку через секунду после исчезновения иконки
                setTimeout(() => {
                    canStartHighlight = true;
                }, 1000);
            }, 3000);
        }
    } else {
        // Обычный режим - куб собран
        console.log("Showing assembled cube");
        tParam = 0;
        rotationX = defaultRotationX;
        rotationY = defaultRotationY;
        
        // Скрываем gesture-hint и gesture-mask
        if (gestureHint && gestureMask) {
            gestureHint.style.display = 'none';
            gestureMask.style.display = 'none';
        }
        
        // Показываем меню и лого
        if (menuBtn && logoText) {
            menuBtn.style.display = 'block';
            logoText.style.display = 'block';
            menuBtn.classList.add('visible');
            logoText.classList.add('visible');
        }
    }

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
        var idx = i * linesY * pointsPerLine + j * pointsPerLine;
        
        if (tParam >= 0.9 && highlightedPoints.has(idx)) {
            // Подсвеченные буквы
            ctx.font = "bold 18px OneDay";
            // Используем z-координату для расчета яркости
            var zBrightness = 1 - (this.z + 1000) / 2000;
            zBrightness = Math.max(0.4, Math.min(1, zBrightness)); // Ограничиваем минимальную яркость
            var finalOpacity = zBrightness * (0.6 + highlightIntensity * 0.4);
            ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
            ctx.shadowColor = `rgba(255, 255, 255, ${finalOpacity * 0.8})`;
            ctx.shadowBlur = 20 * zBrightness;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        } else if (j === linesY - 1 && tParam <= 0.1) {
            // Собранное состояние
            ctx.font = "bold 14px OneDay";
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        } else {
            // Обычное состояние
            ctx.font = "14px OneDay";
            var bf = 1 - (this.z + 1000) / 2000;
            bf = Math.max(0, Math.min(1, bf));
            var shade = Math.floor(20 + bf * 127); // Делаем неподсвеченные буквы еще темнее
            ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
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

    function render(time) {
        var deltaTime = time - lastTime;
        lastTime = time;

        if (deltaTime > 100) deltaTime = 100;

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, ww, wh);

        // Обновляем подсветку букв
        updateLetterHighlight(time);
        
        drawPoints();
        debugLog.logFrame(time);

        if (!drag) {
            rotationY += autoRotateSpeed * deltaTime;
        }
        
        // Проверяем состояние куба и обновляем видимость элементов
        if (tParam === 0) {
            // Куб собран - показываем элементы и фиксируем меню
            if (menuBtn.style.display !== "block") {
                menuBtn.style.display = "block";
                logoText.style.display = "block";
                menuBtn.classList.add('visible');
                logoText.classList.add('visible');
                isMenuLocked = true; // Фиксируем меню при сборке куба
                // Автоматически открываем меню
                menuOverlay.style.display = "block";
                requestAnimationFrame(() => {
                    menuOverlay.classList.add('visible');
                });
            }
            // Всегда поддерживаем фиксацию меню при собранном кубе
            isMenuLocked = true;
        } else {
            // Куб рассеян - скрываем элементы и снимаем фиксацию меню
            if (menuBtn.style.display !== "none") {
                menuBtn.classList.remove('visible');
                logoText.classList.remove('visible');
                menuBtn.style.display = "none";
                logoText.style.display = "none";
                isMenuLocked = false; // Снимаем фиксацию меню
                // Скрываем меню
                menuOverlay.classList.remove('visible');
                setTimeout(() => {
                    menuOverlay.style.display = "none";
                }, 400);
            }
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
        touchStartY = e.touches[0].pageY;
    }, { passive: false });
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        var touchY = e.touches[0].pageY;
        var deltaY = touchY - touchStartY;
        handleScroll(-deltaY);
        touchStartY = touchY;
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
        console.log("Scroll accumulator:", scrollAccumulator, "Threshold:", scrollThreshold);
        
        if (scrollAccumulator > scrollThreshold) {
            console.log("Triggering scatter");
            animateScatter();
            scrollAccumulator = 0;
        } else if (scrollAccumulator < -scrollThreshold) {
            console.log("Triggering gather");
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
        
        // Если куб уже собран, ничего не делаем
        if (tParam === 0) {
            console.log("Cube already gathered");
            return;
        }
        
        var startTime = performance.now();
        var initT = tParam;
        var duration = 1500;
        
        function step(currentTime) {
            var elapsed = currentTime - startTime;
            var progress = Math.min(elapsed / duration, 1);
            tParam = initT * (1 - progress);
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                tParam = 0;
                debugLog.logAction('gather_complete', {});
            }
        }
        requestAnimationFrame(step);
    }

    function animateScatter() {
        debugLog.logAction('scatter_start', { initTParam: tParam });
        console.log("Animating scatter");
        
        // Если куб уже рассеян, ничего не делаем
        if (tParam === 1) {
            console.log("Cube already scattered");
            return;
        }
        
        // Скрываем все оверлеи при начале рассеивания
        var overlays = document.querySelectorAll('.overlay-menu, .popup-block, .overlay-mask');
        overlays.forEach(function(el) {
            if (el.style.display !== "none") {
                el.classList.remove('visible');
                setTimeout(() => {
                    el.style.display = "none";
                }, 400);
            }
        });
        
        var startTime = performance.now();
        var initT = tParam;
        var duration = 1500;
        
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
            e.preventDefault();
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
        // Удаляем обработчик клика с логотипа
        logoText.style.pointerEvents = 'none';
        logoText.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
    }

    // Общий обработчик клика для закрытия меню и попапа
    document.addEventListener('click', function(e) {
        // Проверяем, что клик не на маске
        if (e.target === overlayMask) {
            return;
        }
        
        // Обработка закрытия попапа по клику вне его
        if (activePopup && !e.target.closest('.popup-block') && !e.target.closest('.overlay-menu') && !e.target.closest('.menu-btn')) {
            console.log("Закрываем попап по клику вне его (общий обработчик)");
            hidePopup();
        }
        
        // Обработка закрытия меню - только если нет активного попапа и меню не зафиксировано
        else if (!isMenuLocked && !activePopup && 
            !e.target.closest('.overlay-menu') && 
            !e.target.closest('.menu-btn') && 
            menuOverlay.classList.contains('visible')) {
            
            console.log("Закрываем меню по клику вне его");
            menuOverlay.classList.remove('visible');
            setTimeout(() => {
                menuOverlay.style.display = "none";
            }, 400);
        }
    });

    var menuLinks = document.querySelectorAll('.overlay-menu a');
    if (menuLinks) {
        // Обработчик для всех ссылок в меню
        menuLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                var sectionId = this.getAttribute('data-section');
                if (sectionId) {
                    e.preventDefault();
                    
                    // Скрываем меню при клике на пункт
                    menuOverlay.classList.remove('visible');
                    setTimeout(() => {
                        menuOverlay.style.display = "none";
                    }, 400);
                    
                    // Показываем соответствующий popup
                    showPopup(sectionId);
                }
            });
        });
    }

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
        console.log('Opening project page for project:', projectId);
        
        // Перенаправляем на страницу проекта вместо открытия модального окна
        let projectPath = projectId === 1 ? 'intervals2023' : `project_${projectId}`;
        let projectUrl = `projects/${projectPath}/index.html`;
        
        console.log('Redirecting to:', projectUrl);
        window.location.href = projectUrl;
        return;
        
        // Оставшийся код не будет выполняться из-за return выше
    }
    
    // Функция для закрытия модального окна проекта
    function closeProjectModal(modal) {
        // Возвращаем исходный URL
        window.history.pushState({}, '', window.location.pathname);
        
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.remove();
        }, 400);
    }

    // Добавляем обработчики для проектов
    document.querySelectorAll('.project-item').forEach((item, index) => {
        console.log("Adding click handler for project item:", item);
        const projectId = parseInt(item.getAttribute('data-project-id')) || (index + 1);
        if (!projectId) {
            console.error("Project item without data-project-id:", item);
            return;
        }
        
        item.addEventListener('click', () => {
            console.log("Project item clicked:", projectId);
            openProjectModal(projectId);
        });
    });

    // Обработчик для History API
    window.addEventListener('popstate', function(event) {
        // Закрываем все открытые модальные окна проектов
        const openModals = document.querySelectorAll('.project-modal');
        openModals.forEach(modal => {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
            }, 400);
        });
        
        // Если в URL есть хэш с проектом, открываем его
        if (window.location.hash.startsWith('#project/')) {
            const projectPath = window.location.hash.replace('#project/', '');
            let projectId;
            
            if (projectPath === 'intervals2023') {
                projectId = 1;
            } else {
                const match = projectPath.match(/project_(\d+)/);
                if (match) {
                    projectId = parseInt(match[1]);
                }
            }
            
            if (projectId) {
                openProjectModal(projectId);
            }
        }
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

        const nextBtn = document.createElement('button');
        nextBtn.className = 'next-fullscreen';
        content.appendChild(nextBtn);

        // Добавляем обработчики событий
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeFullscreen();
        });
        
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showNextImage();
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

        // Добавляем обработчики для свайпов
        let touchStartX = 0;
        let touchEndX = 0;
        
        fullscreenView.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        fullscreenView.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeThreshold = 50; // Минимальное расстояние для свайпа
            const swipeLength = touchEndX - touchStartX;
            
            if (Math.abs(swipeLength) > swipeThreshold) {
                if (swipeLength > 0) {
                    // Свайп вправо - предыдущее изображение
                    showPreviousImage();
                } else {
                    // Свайп влево - следующее изображение
                    showNextImage();
                }
            }
        }
        
        function showPreviousImage() {
            currentFullscreenIndex = (currentFullscreenIndex - 1 + fullscreenImages.length) % fullscreenImages.length;
            showCurrentMedia();
        }
    }

    // Функция для показа текущего медиа
    function showCurrentMedia() {
        const media = fullscreenImages[currentFullscreenIndex];
        
        // Очищаем контейнер
        fullscreenMedia.innerHTML = '';
        
        if (media.tagName.toLowerCase() === 'iframe') {
            // Создаем статичный прелоадер
            const preloader = document.createElement('div');
            preloader.textContent = 'Загрузка видео...'; // Текст прелоадера
            preloader.style.fontSize = '18px';
            preloader.style.color = '#fff';
            preloader.style.textAlign = 'center';
            preloader.style.padding = '20px';
            fullscreenMedia.appendChild(preloader);
            
            // Загружаем видео после прелоадера
            const iframe = document.createElement('iframe');
            iframe.src = media.src;
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.style.aspectRatio = '16/9';
            iframe.frameBorder = '0';
            iframe.allow = 'autoplay; fullscreen; picture-in-picture';
            iframe.onload = function() {
                fullscreenMedia.innerHTML = ''; // Очищаем контейнер перед добавлением видео
                fullscreenMedia.appendChild(iframe);
            };
        } else {
            // Клонируем изображение
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

    if (menuOverlay) {
        menuOverlay.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // Обработчики событий для скрытия gesture-hint при взаимодействии
    function hideGestureHint() {
        if (gestureHint && gestureHint.classList.contains('visible')) {
            gestureHint.classList.remove('visible');
            gestureMask.classList.remove('visible');
            setTimeout(() => {
                gestureHint.style.display = 'none';
                gestureMask.style.display = 'none';
            }, 300);
        }
    }

    canvas.addEventListener('mousedown', hideGestureHint);
    canvas.addEventListener('touchstart', hideGestureHint);
    canvas.addEventListener('wheel', hideGestureHint);

    // Функция для получения случайного индекса точки для текущей буквы
    function getRandomPointIndexForLetter(letter) {
        var indices = [];
        for (var i = 0; i < linesX; i++) {
            for (var j = 0; j < linesY; j++) {
                for (var k = 0; k < pointsPerLine; k++) {
                    var idx = i * linesY * pointsPerLine + j * pointsPerLine + k;
                    if (letters[i % letters.length] === letter) {
                        indices.push(idx);
                    }
                }
            }
        }
        return indices[Math.floor(Math.random() * indices.length)];
    }

    // Функция обновления подсветки букв
    function updateLetterHighlight(time) {
        if (!lastHighlightTime) lastHighlightTime = time;
        
        if (!canStartHighlight || tParam < 0.9) {
            highlightedPoints.clear();
            return;
        }

        var deltaTime = time - lastHighlightTime;
        
        // Обновляем интенсивность подсветки с более плавной пульсацией
        if (highlightedPoints.size > 0) {
            // Комбинируем несколько синусоид с разными частотами для более естественной пульсации
            var pulse1 = Math.sin(time * 0.0005) * 0.5; // Очень медленная пульсация
            var pulse2 = Math.sin(time * 0.001) * 0.3; // Средняя пульсация
            var pulse3 = Math.sin(time * 0.002) * 0.2; // Быстрая пульсация
            highlightIntensity = (pulse1 + pulse2 + pulse3 + 1) / 2; // Нормализуем к диапазону 0-1
        }

        // Проверяем, нужно ли добавить новую букву
        if (deltaTime > letterHighlightDuration / letters.length) {
            // Находим все возможные индексы для текущей буквы
            var indices = [];
            var currentLetter = letters[currentLetterIndex];
            
            for (var i = 0; i < linesX; i++) {
                for (var j = 0; j < linesY; j++) {
                    for (var k = 0; k < pointsPerLine; k++) {
                        var idx = i * linesY * pointsPerLine + j * pointsPerLine + k;
                        if (letters[i % letters.length] === currentLetter) {
                            indices.push(idx);
                        }
                    }
                }
            }
            
            // Добавляем больше точек для текущей буквы
            var pointsToAdd = Math.min(8, indices.length); // Увеличиваем количество подсвеченных точек
            for (var p = 0; p < pointsToAdd; p++) {
                if (indices.length > 0) {
                    var randomIndex = Math.floor(Math.random() * indices.length);
                    highlightedPoints.add(indices[randomIndex]);
                    indices.splice(randomIndex, 1);
                }
            }
            
            // Переходим к следующей букве
            currentLetterIndex = (currentLetterIndex + 1) % letters.length;
            
            // Если начали новое слово, НЕ очищаем старые подсветки
            // Удалено: if (currentLetterIndex === 0) { highlightedPoints.clear(); }
            
            lastHighlightTime = time;
        }
    }

    // Обработчик клика на кнопку сброса
    if (resetButton) {
        resetButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Устанавливаем флаг принудительного обновления
            localStorage.setItem('force_chaotic_cube', 'true');
            
            // Перезагружаем страницу
            window.location.reload();
        });
    }
    
    // Обработчик комбинации клавиш Cmd+Shift+R (и Ctrl+Shift+R для Windows/Linux)
    document.addEventListener('keydown', function(e) {
        // Проверяем комбинацию клавиш (Cmd/Ctrl + Shift + R)
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'r' || e.key === 'R')) {
            console.log("Комбинация клавиш для сброса обнаружена");
            
            // Предотвращаем стандартное поведение браузера
            e.preventDefault();
            e.stopPropagation();
            
            // Устанавливаем флаг принудительного обновления
            localStorage.setItem('force_chaotic_cube', 'true');
            
            // Перезагружаем страницу
            setTimeout(function() {
                window.location.reload();
            }, 50);
            
            return false;
        }
    }, true); // Добавляем третий параметр true для фазы захвата
    
    // Функции для управления popup
    function showPopup(id) {
        // Запоминаем время открытия
        popupOpenTime = Date.now();
        
        // Закрываем предыдущий popup
        if (activePopup) {
            hidePopup();
        }
        
        activePopup = document.getElementById(id);
        if (!activePopup) return;
        
        console.log("Показываем popup:", id);
        
        // Показываем маску и popup
        overlayMask.style.display = 'block';
        activePopup.style.display = 'block';
        
        // Анимация
        setTimeout(function() {
            overlayMask.classList.add('visible');
            activePopup.classList.add('visible');
        }, 10);
    }
    
    function hidePopup() {
        if (!activePopup) return;
        
        console.log("Скрываем popup:", activePopup.id);
        
        overlayMask.classList.remove('visible');
        activePopup.classList.remove('visible');
        
        setTimeout(function() {
            overlayMask.style.display = 'none';
            activePopup.style.display = 'none';
            activePopup = null;
        }, 400);
    }

    // Обработчик для закрытия popup по клику на маску
    if (overlayMask) {
        overlayMask.addEventListener('click', function(e) {
            console.log("Клик на маску обнаружен");
            if (activePopup) {
                console.log("Закрываем popup по клику на маску");
                e.preventDefault();
                e.stopPropagation();
                hidePopup();
            }
        });
    }
    
    // Обработчик для Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && activePopup) {
            console.log("Закрываем popup по Escape");
            hidePopup();
        }
    });
});
