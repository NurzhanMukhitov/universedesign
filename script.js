// Удаляем глобальный флаг
// let isIndexPageInitialLoad = true; 

document.addEventListener('DOMContentLoaded', function() {
    // Проверяем флаг возврата с другой страницы
    if (sessionStorage.getItem('justLeftIndex') === 'true') {
        console.log("Обнаружен флаг justLeftIndex, планируем открыть меню.");
        // Оборачиваем открытие меню в setTimeout, чтобы дать браузеру время на отрисовку
        setTimeout(function() {
            openBurgerMenu(); // Открываем меню
            console.log("Меню открыто после небольшой задержки.");
        }, 0); // Минимальная задержка
        sessionStorage.removeItem('justLeftIndex'); // Удаляем флаг сразу
        console.log("Флаг justLeftIndex удален из sessionStorage.");
    }

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
    var backButton = document.querySelector('.back-button');
    var isMenuLocked = false;

    // Настройка canvas с учётом devicePixelRatio для чёткости
    // --- Возвращаем dpr к исходному значению ---
    var dpr = window.devicePixelRatio || 1;
    // --- Конец возврата dpr ---
    canvas.width = ww * dpr;
    canvas.height = wh * dpr;
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    canvas.style.width = ww + "px";
    canvas.style.height = wh + "px";

    // Параметры куба
    var linesX = 14;
    var linesY = 14; // Всегда 14
    var pointsPerLine = getPointsPerLine(); // Динамическое значение
    var letters = "UNIVERSEDESIGN";
    var focale = 500; // Статичное значение для всех
    var defaultRotationX = -0.4, defaultRotationY = 0.5;
    var autoRotateSpeed = 0.0002;
    
    // >>> Глобальные переменные для оптимизации вращения <<<
    var currentSinX = 0, currentCosX = 1, currentSinY = 0, currentCosY = 1;
    // >>> Конец глобальных переменных <<<

    // >>> ОБЪЯВЛЯЕМ ПЕРЕМЕННЫЕ ШРИФТА ГЛОБАЛЬНО <<<
    var baseFontSize;
    var boldFontSize;
    // >>> КОНЕЦ ОБЪЯВЛЕНИЯ <<<

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
    
    if (forceChaotic) {
        tParam = 1;
        rotationX = 0;
        rotationY = 0;
        
        localStorage.removeItem('force_chaotic_cube');
        
        if (gestureHint && gestureMask) {
            gestureHint.style.display = 'flex';
            gestureMask.style.display = 'block';
            gestureHint.classList.add('visible');
            gestureMask.classList.add('visible');
            
            canvas.style.pointerEvents = 'none';
            setTimeout(() => {
                canvas.style.pointerEvents = 'auto';
                setTimeout(() => {
                    canStartHighlight = true;
                }, 1000);
            }, 3500);
        }
    } else {
        tParam = 0;
        rotationX = defaultRotationX;
        rotationY = defaultRotationY;
        
        if (gestureHint && gestureMask) {
            gestureHint.style.display = 'none';
            gestureMask.style.display = 'none';
        }
        
        if (menuBtn && logoText) {
            menuBtn.style.display = 'block';
            logoText.style.display = 'block';
            menuBtn.classList.add('visible');
            logoText.classList.add('visible');
        }
    }

    // Управление жестами
    var drag = false;
    var oldX = 0;
    var oldY = 0;
    var scrollAccumulator = 0;
    var scrollThreshold = 100;
    var touchStartY = 0;

    // Для анимации
    var lastTime = 0;

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
        var idx = i * linesY + pointsPerLine + j * pointsPerLine;

        if (tParam >= 0.9 && highlightedPoints.has(idx)) {
            // Подсвеченные буквы
            ctx.font = `bold ${boldFontSize}px OneDay`;
            // Используем z-координату для расчета яркости
            var zBrightness = 1 - (this.z + 1000) / 2000;
            zBrightness = Math.max(0.4, Math.min(1, zBrightness)); // Ограничиваем минимальную яркость
            var finalOpacity = zBrightness * (0.6 + highlightIntensity * 0.4);
            ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
        } else if (j === linesY - 1 && tParam <= 0.1) {
            // Собранное состояние
            ctx.font = `bold ${boldFontSize}px OneDay`;
            ctx.fillStyle = "#ffffff";
        } else {
            // Обычное состояние
            ctx.font = `${baseFontSize}px OneDay`;
            var bf = 1 - (this.z + 1000) / 2000;
            bf = Math.max(0, Math.min(1, bf));
            var shade = Math.floor(20 + bf * 127); // Делаем неподсвеченные буквы еще темнее
            ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        }
        
        var xPos = ww / 2 + this.x * scale;
        var yPos = wh / 2 + this.y * scale;
        var text = letters[i % letters.length];
        ctx.fillText(text, xPos, yPos);
    };

    // Новая функция для определения глубины куба
    function getPointsPerLine() {
        var w = window.innerWidth;
        if (w < 768) return 8; // Мобильные: 8 рядов
        return 10; // Десктоп: 10 рядов
    }

    // Измененная функция для определения размера куба
    function getCubeSize() {
        var w = window.innerWidth;
        if (w < 576) return 220; // Вернем 220 (было 200)
        if (w < 768) return 280; // Сделаем чуть больше (было 260)
        // Остальные размеры без изменений
        if (w < 992) return 260;
        if (w < 1200) return 300;
        if (w < 1400) return 340;
        return 360;
    }

    function createPoints() {
        pointsArray = [];
        var cubeSize = getCubeSize();
        // >>> ВОЗВРАЩАЕМ СТАНДАРТНЫЙ Z-РАСЧЕТ <<<
        var topZ = cubeSize / 2;
        var botZ = -cubeSize / 2;
        // >>> КОНЕЦ ИЗМЕНЕНИЯ <<<
        var spaceX = cubeSize / linesX;
        var spaceY = cubeSize / linesY;

        for (var j = 0; j < linesY; j++) {
            for (var i = 0; i < linesX; i++) {
                var x = -cubeSize / 2 + i * spaceX;
                var y = -cubeSize / 2 + j * spaceY;
                // pointsPerLine остается динамическим (8 или 10)
                for (var k = 0; k < pointsPerLine; k++) {
                    // Используем стандартные topZ/botZ
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
                    // Интерполяция координат
                    var px = (1 - tParam) * point.originalX + tParam * point.scatterX;
                    var py = (1 - tParam) * point.originalY + tParam * point.scatterY;
                    var pz = (1 - tParam) * point.originalZ + tParam * point.scatterZ;
                    
                    // >>> Применение вращений напрямую <<<
                    // Вращение вокруг X
                    var rotatedY1 = py * currentCosX - pz * currentSinX;
                    var rotatedZ1 = py * currentSinX + pz * currentCosX;
                    // Вращение вокруг Y
                    var rotatedX2 = px * currentCosY + rotatedZ1 * currentSinY;
                    var rotatedZ2 = -px * currentSinY + rotatedZ1 * currentCosY;
                    
                    // Обновляем координаты точки перед отрисовкой
                    point.x = rotatedX2;
                    point.y = rotatedY1;
                    point.z = rotatedZ2;
                    // >>> Конец применения вращений <<<
                    
                    point.draw(i, j);
                }
            }
        }
    }

    function render(time) {
        // >>> РАССЧИТЫВАЕМ ШРИФТЫ ОДИН РАЗ ЗА КАДР <<<
        var w = window.innerWidth;
        baseFontSize = (w < 768) ? 8 : 14;
        boldFontSize = (w < 768) ? 12 : 14;
        // >>> КОНЕЦ РАСЧЕТА ШРИФТОВ <<<

        // >>> ВЫЧИСЛЯЕМ SIN/COS ДЛЯ ВРАЩЕНИЯ ОДИН РАЗ ЗА КАДР <<<
        currentSinX = Math.sin(rotationX);
        currentCosX = Math.cos(rotationX);
        currentSinY = Math.sin(rotationY);
        currentCosY = Math.cos(rotationY);
        // >>> КОНЕЦ ВЫЧИСЛЕНИЯ SIN/COS <<<

        var deltaTime = time - lastTime;
        lastTime = time;

        if (deltaTime > 100) deltaTime = 100;

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, ww, wh);

        // Обновляем подсветку букв
        updateLetterHighlight(time);
        
        drawPoints();

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

    // Функция для обработки изменения размера окна
    function handleResize() {
        // Обновляем размеры окна
        ww = window.innerWidth;
        wh = window.innerHeight;

        // Обновляем размеры canvas с учетом devicePixelRatio
        // --- Возвращаем dpr к исходному значению ---
        var dpr = window.devicePixelRatio || 1;
        // --- Конец возврата dpr ---
        // Проверяем, существует ли canvas и ctx перед использованием
        if (canvas && ctx) {
        canvas.width = ww * dpr;
        canvas.height = wh * dpr;
            ctx.scale(dpr, dpr); // Важно сбросить и применить scale заново
        canvas.style.width = ww + "px";
        canvas.style.height = wh + "px";
        } else {
            console.error("Canvas или context не найдены при ресайзе.");
            return; // Прерываем выполнение, если canvas/ctx нет
        }

        // Обновляем параметры куба
        pointsPerLine = getPointsPerLine();

        // Пересоздаем точки с новыми параметрами
        createPoints();

        // Обновляем лог, используя статичное значение focale
        console.log(`Resized. New params: Size=${getCubeSize()}, Focale=${focale}, LinesY=${linesY}, PointsPerLine=${pointsPerLine}`);
    }

    // Добавляем обработчик события resize
    // Проверим, нет ли уже существующего обработчика, чтобы не дублировать
    // (Простой способ - добавить в любом случае, но лучше бы проверить)
    // Пока просто добавляем:
    window.addEventListener('resize', handleResize);

    // Убедимся, что первоначальный вызов createPoints() происходит после определения handleResize
    // (В вашем коде createPoints() вызывается раньше, что нормально для первого вызова)

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
        handleStart(e.touches[0].pageX, e.touches[0].pageY);
    }, { passive: false });

    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        var touchY = e.touches[0].pageY;
        var deltaY = touchY - touchStartY;
        handleScroll(-deltaY);
        handleMove(e.touches[0].pageX, e.touches[0].pageY);
        touchStartY = touchY;
    }, { passive: false });

    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        handleEnd();
    }, { passive: false });

    function handleMove(x, y) {
        if (drag) {
            rotationY += (x - oldX) * 0.01;
            rotationX += (y - oldY) * 0.01;
            oldX = x;
            oldY = y;
        }
    }

    function handleStart(x, y) {
        drag = true;
        oldX = x;
        oldY = y;
    }

    function handleEnd() {
        drag = false;
    }

    function handleScroll(deltaY) {
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
            }
        }
        requestAnimationFrame(step);
    }

    function animateScatter() {
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

    // Проверяем, что все элементы найдены
    console.log('Элементы DOM:', {
        overlayMask: overlayMask,
        menuOverlay: menuOverlay,
        menuBtn: menuBtn
    });

    // Обработчик клика на маску
    if (overlayMask) {
        overlayMask.addEventListener('click', function(e) {
            console.log('Клик на маску:', {
                target: e.target,
                isMask: e.target === overlayMask,
                activePopup: activePopup ? activePopup.id : null
            });
            
            // Закрываем попап при клике на маску
            hidePopup();
        });
    }

    // Обработчик клика вне попапа
    document.addEventListener('click', function(e) {
        if (!activePopup) return;
        
        // Проверяем, был ли клик внутри контента попапа
        const isClickInsideContent = e.target.closest('.popup-content');
        // Проверяем, был ли клик на меню
        const isClickOnMenu = e.target.closest('.overlay-menu') || e.target.closest('.menu-btn');
        // Проверяем, был ли клик на маске
        const isClickOnMask = e.target === overlayMask;
        
        console.log('Клик:', {
            target: e.target,
            isClickInsideContent,
            isClickOnMenu,
            isClickOnMask,
            activePopupId: activePopup ? activePopup.id : null
        });

        // Закрываем попап только если клик был вне контента попапа и не на меню
        if (!isClickInsideContent && !isClickOnMenu) {
            hidePopup();
        }
    });

    // Обработчик клавиши Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && activePopup) {
            console.log("Закрываем попап по Escape");
            hidePopup();
        }
    });

    // Функция закрытия попапа
    function hidePopup() {
        if (!activePopup) return;
        
        console.log('Закрываем попап:', activePopup.id);
        
        overlayMask.classList.remove('visible');
        activePopup.classList.remove('visible');
        
        setTimeout(function() {
            overlayMask.style.display = 'none';
            activePopup.style.display = 'none';
            activePopup = null;
            }, 400);
        }

    // Функция показа попапа
    function showPopup(popupId) {
        var popup = document.getElementById(popupId);
        if (!popup) {
            console.error('Попап не найден:', popupId);
            return;
        }
        
        console.log('Показываем попап:', popupId);
        
        // Скрываем предыдущий попап, если он есть
        if (activePopup) {
            hidePopup();
        }
        
        activePopup = popup;
        
        // Показываем маску и попап
        overlayMask.style.display = 'block';
        popup.style.display = 'block';
        
        // Даем время браузеру обработать изменение display
        requestAnimationFrame(function() {
            overlayMask.classList.add('visible');
            popup.classList.add('visible');
        });
    }

    // Обработчики меню
    if (menuOverlay) {
        var menuItems = menuOverlay.querySelectorAll('li a');
        menuItems.forEach(function(item) {
            item.addEventListener('click', function(event) {
                // Получаем ID секции из data-атрибута
                const sectionId = this.getAttribute('data-section');
                // Получаем href
                const href = this.getAttribute('href');

                // Устанавливаем флаг в sessionStorage перед переходом, если это не попап
                if (!sectionId && href && href !== '#' && !href.startsWith('javascript:')) {
                    sessionStorage.setItem('justLeftIndex', 'true');
                    console.log("Установлен флаг justLeftIndex в sessionStorage");
                }

                if (sectionId) {
                    // Если есть data-section, показываем попап
                    event.preventDefault(); // Отменяем стандартное поведение ТОЛЬКО для попапов
                    showPopup(sectionId);
                    // Закрываем меню
                    menuOverlay.classList.remove('visible');
                    overlayMask.classList.remove('visible');
                    menuBtn.classList.remove('active');
                } else if (href && href !== '#' && !href.startsWith('javascript:')) {
                    // Если есть валидный href, позволяем браузеру перейти по ссылке.
                    // Дополнительно закрываем меню, если оно было открыто
                    menuOverlay.classList.remove('visible');
                    overlayMask.classList.remove('visible');
                    menuBtn.classList.remove('active');
                    // Стандартный переход по href выполнится автоматически
                } else {
                    // Если нет ни sectionId, ни валидного href, отменяем действие
                    event.preventDefault(); 
                }
            });
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
            }, 450);
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
        fullscreenView.style.backgroundColor = "#000"; // Черный фон
        fullscreenView.className = 'fullscreen-view';
        document.body.appendChild(fullscreenView);
        
        // Блокируем прокрутку страницы
        console.log("Setting overflow: hidden on html and body");
        document.documentElement.style.setProperty('overflow', 'hidden', 'important'); // Для html
        document.body.style.setProperty('overflow', 'hidden', 'important'); // Для body

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
        
        // Добавляем обработчики событий
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeFullscreen();
        });

        fullscreenMedia = mediaContainer;

        // Получаем все изображения и видео в текущем проекте
        const projectContent = mediaElement.closest('.modal-slides');
        fullscreenImages = Array.from(projectContent.querySelectorAll('.slide img, iframe:not([src*="player.vimeo.com/api"])'));
        currentFullscreenIndex = fullscreenImages.indexOf(mediaElement);

        // Показываем контент
        showCurrentMedia();
        
        // Добавляем обработчики клавиш
        document.addEventListener('keydown', handleFullscreenKeyPress);

        // Активируем полноэкранный режим
        requestAnimationFrame(() => {
            fullscreenView.classList.add('active');
        });

        // Обработчики для свайпов на мобильных устройствах
        let touchStartX = 0;
        let touchStartY = 0;
        let isSwiping = false; // Флаг, что идет свайп
        
        function handleTouchStart(e) {
            if (e.touches.length !== 1) return; // Только одно касание
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isSwiping = true; // Начинаем отслеживать свайп
            console.log(`TouchStart: x=${touchStartX.toFixed(2)}, y=${touchStartY.toFixed(2)}`);
        }
        
        function handleTouchMove(e) {
            if (!isSwiping || e.touches.length !== 1) return;
            console.log(`TouchMove: x=${e.touches[0].clientX.toFixed(2)}, y=${e.touches[0].clientY.toFixed(2)}`);
            // Блокируем прокрутку страницы при свайпе
            e.preventDefault();
        }
        
        function handleTouchEnd(e) {
            if (!isSwiping || e.changedTouches.length !== 1) {
                isSwiping = false;
                return;
            }
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            // Рассчитываем дистанцию свайпа
            const swipeDistanceX = touchEndX - touchStartX;
            const swipeDistanceY = touchEndY - touchStartY; // Не используем Math.abs здесь для определения направления
            
            console.log(`TouchEnd: x=${touchEndX.toFixed(2)}, y=${touchEndY.toFixed(2)}`);
            console.log(`Swipe Distance: dX=${swipeDistanceX.toFixed(2)}, dY=${swipeDistanceY.toFixed(2)}`);
            
            isSwiping = false; // Завершили свайп

            // Проверяем, что свайп был преимущественно горизонтальным (|dx| > |dy| * 1.5 - увеличиваем порог)
            if (Math.abs(swipeDistanceX) > Math.abs(swipeDistanceY) * 1.5) {
                // Минимальная дистанция свайпа - 10% от ширины экрана
                const minSwipeDistance = window.innerWidth * 0.1;
                console.log(`Horizontal swipe detected. Min distance: ${minSwipeDistance.toFixed(2)}`);
                
                if (Math.abs(swipeDistanceX) > minSwipeDistance) {
                    console.log("Swipe distance threshold met.");
                    if (swipeDistanceX > 0) {
                        console.log("Executing showPreviousImage()");
                    // Свайп вправо - предыдущее изображение
                    showPreviousImage();
                } else {
                        console.log("Executing showNextImage()");
                    // Свайп влево - следующее изображение
                    showNextImage();
                }
                } else {
                    console.log("Swipe distance threshold NOT met.");
                }
            } else {
                 console.log("Swipe is more vertical or diagonal, ignored.");
            }
        }
        
        // Добавляем обработчики свайпа
        fullscreenView.addEventListener('touchstart', handleTouchStart, { passive: false });
        fullscreenView.addEventListener('touchmove', handleTouchMove, { passive: false });
        fullscreenView.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        // Сохраняем ссылки на обработчики для удаления при закрытии
        fullscreenView.touchHandlers = {
            start: handleTouchStart,
            move: handleTouchMove,
            end: handleTouchEnd
        };

        // Добавляем индикатор свайпа для мобильных
        if (window.innerWidth <= 768) {
            const swipeIndicator = document.createElement('div');
            swipeIndicator.className = 'swipe-indicator';
            swipeIndicator.textContent = 'Свайпните для навигации';
            content.appendChild(swipeIndicator);
            
            // Скрываем индикатор через 3 секунды
            setTimeout(() => {
                swipeIndicator.remove();
            }, 3000);
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
            // Разблокируем прокрутку страницы
            console.log("Removing overflow: hidden from html and body");
            document.documentElement.style.removeProperty('overflow'); // Для html
            document.body.style.removeProperty('overflow'); // Для body
            
            // Удаляем обработчики событий
            document.removeEventListener('keydown', handleFullscreenKeyPress);
            
            // Удаляем обработчики свайпа
            if (fullscreenView.touchHandlers) {
                fullscreenView.removeEventListener('touchstart', fullscreenView.touchHandlers.start);
                fullscreenView.removeEventListener('touchmove', fullscreenView.touchHandlers.move);
                fullscreenView.removeEventListener('touchend', fullscreenView.touchHandlers.end);
            }
            
            fullscreenView.classList.remove('active');
            
            // Останавливаем видео при закрытии
            const iframe = fullscreenMedia.querySelector('iframe');
            if (iframe) {
                iframe.src = '';
            }

            // Удаляем элемент после анимации
            setTimeout(() => {
                if (fullscreenView) {
                fullscreenView.remove();
                fullscreenView = null;
                fullscreenMedia = null;
                }
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
            }, 450);
        }
    }

    canvas.addEventListener('mousedown', hideGestureHint);
    canvas.addEventListener('touchstart', hideGestureHint);
    canvas.addEventListener('wheel', hideGestureHint);

    function openBurgerMenu() {
        console.log('openBurgerMenu вызвана');
        const menuOverlay = document.querySelector('.overlay-menu');
        if (menuOverlay) {
            console.log('Элемент .overlay-menu найден');
            menuOverlay.style.display = 'block';
            requestAnimationFrame(() => {
                menuOverlay.classList.add('visible');
                console.log('Класс visible добавлен к .overlay-menu');
            });
        } else {
            console.error('Элемент .overlay-menu не найден');
        }
    }

    // Пример вызова функции при возврате
    if (backButton) {
        console.log('backButton найден');
        backButton.addEventListener('click', () => {
            console.log('Клик по backButton');
            // Логика возврата
            window.location.href = '/'; // Пример: если нужно перейти на главную
        });
    } else {
        console.error('backButton не найден на этой странице'); // Уточняем сообщение об ошибке
    }

    // Добавляем обработчик pageshow для корректной работы с bfcache
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            // Если страница восстановлена из bfcache, вызываем функцию для открытия меню
            openBurgerMenu();
        }
    });
});

// Test comment
