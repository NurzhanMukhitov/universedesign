document.addEventListener('DOMContentLoaded', function() {
    console.log("JavaScript is running!");

    // Размеры экрана
    var ww = window.innerWidth, wh = window.innerHeight;

    // Получаем DOM элементы
    var canvas = document.getElementById("c");
    var menuBtn = document.querySelector('.menu-btn');
    var logoText = document.querySelector('.logo-text');
    var overlayMask = document.querySelector('.overlay-mask');
    var activePopup = null;

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
        // Верхняя грань при собранном кубе — белый жирный шрифт
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

    // Функция для определения размера куба по брейкпоинтам
    function getCubeSize() {
        var w = window.innerWidth;
        if (w < 576) return 180;
        if (w < 768) return 220;
        if (w < 992) return 260;
        if (w < 1200) return 300;
        if (w < 1400) return 340;
        return 360;
    }

    // Создание массива точек
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

    // Отрисовка всех точек
    function drawPoints() {
        for (var i = 0; i < linesX; i++) {
            for (var j = 0; j < linesY; j++) {
                for (var k = 0; k < pointsPerLine; k++) {
                    var idx = i * linesY * pointsPerLine + j * pointsPerLine + k;
                    var point = pointsArray[idx];
                    // Интерполяция между собранным и хаотичным состоянием
                    point.x = (1 - tParam) * point.originalX + tParam * point.scatterX;
                    point.y = (1 - tParam) * point.originalY + tParam * point.scatterY;
                    point.z = (1 - tParam) * point.originalZ + tParam * point.scatterZ;
                    // Повороты
                    point.rotateX(rotationX);
                    point.rotateY(rotationY);
                    point.draw(i, j);
                }
            }
        }
    }

    // Главный цикл рендеринга
    var lastTime = 0;
    function render(time) {
        var deltaTime = time - lastTime;
        lastTime = time;

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, ww, wh);

        drawPoints();

        // Автовращение
        if (!drag) {
            rotationY += 0.0002 * deltaTime;
        }

        // Показ/скрытие меню и логотипа
        if (tParam <= 0.1) {
            menuBtn.style.display = "block";
            logoText.style.display = "block";
        } else {
            menuBtn.style.display = "none";
            logoText.style.display = "none";
            // Скрываем меню и popup
            document.querySelector('.overlay-menu').style.display = 'none';
            var popups = document.querySelectorAll('.popup-block, .overlay-mask');
            popups.forEach(function(p) {
                p.style.display = 'none';
            });
        }

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // Функция обновления размеров и пересоздания canvas
    function onResize() {
        ww = window.innerWidth;
        wh = window.innerHeight;

        let dpr = window.devicePixelRatio || 1;
        canvas.width = ww * dpr;
        canvas.height = wh * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        canvas.style.width = ww + "px";
        canvas.style.height = wh + "px";

        createPoints(); // Пересоздаём точки
    }

    // Событие resize
    window.addEventListener('resize', onResize);
    // orientationchange
    window.addEventListener('orientationchange', function() {
        setTimeout(onResize, 500);
    });

    // Инициализация размеров при загрузке
    onResize();

    // Управление мышью
    canvas.addEventListener('mousedown', function(e) {
        handleStart(e.pageX, e.pageY);
    });
    canvas.addEventListener('mousemove', function(e) {
        handleMove(e.pageX, e.pageY);
    });
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);

    // Управление touch
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

    // Скролл для сборки/разброса
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

    // Анимация сборки (Gather)
    function animateGather() {
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
            rotationY = startRotationY + (defaultRotationY - startRotationY) * progress;
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                tParam = 0;
                rotationX = defaultRotationX;
                rotationY = defaultRotationY;
            }
        }
        requestAnimationFrame(step);
    }

    // Анимация разброса (Scatter)
    function animateScatter() {
        console.log("Animating scatter");
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

    // Меню и popup
    var menuOverlay = document.querySelector('.overlay-menu');
    if (menuBtn) {
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (menuOverlay.style.display === "block") {
                menuOverlay.style.display = "none";
            } else {
                menuOverlay.style.display = "block";
            }
        });
    }

    // Логотип – при клике запускается сборка
    if (logoText) {
        logoText.addEventListener('click', function(e) {
            e.stopPropagation();
            animateGather();
        });
    }

    // Обработка кликов по пунктам меню
    var menuLinks = document.querySelectorAll('.overlay-menu a');
    menuLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var section = this.dataset.section;
            overlayMask.style.display = 'block';
            activePopup = document.getElementById(section);
            if (activePopup) {
                activePopup.style.display = 'block';
            }
        });
    });

    // Закрытие popup при клике вне
    document.addEventListener('click', function(e) {
        if (activePopup) {
            activePopup.style.display = 'none';
            overlayMask.style.display = 'none';
            activePopup = null;
        }
    });

    // Закрытие popup по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && activePopup) {
            activePopup.style.display = 'none';
            overlayMask.style.display = 'none';
            activePopup = null;
        }
    });
});
