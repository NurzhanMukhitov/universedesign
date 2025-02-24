console.log("JavaScript is running!");

var ww = window.innerWidth,
    wh = window.innerHeight;

var canvas = document.getElementById("c");
var menuBtn = document.querySelector('.menu-btn');
var logoText = document.querySelector('.logo-text');
var overlayMask = document.querySelector('.overlay-mask');
var projectsGrid = document.getElementById("projects-grid");

var activePopup = null;

console.log("DOM elements:", canvas, menuBtn, logoText, overlayMask, projectsGrid);

canvas.width = ww;
canvas.height = wh;
var ctx = canvas.getContext("2d");

var points = [],
    linesX = 6, // Минимальная плотность для мобильных
    linesY = 6, // Минимальная плотность для мобильных
    pointsPerLine = 4; // Минимальное количество точек на линии
var tParam = 1; // 0 - куб, 1 - хаос
var rotationX = 0,
    rotationY = 0;
var drag = false,
    oldX, oldY;
var PI = Math.PI,
    cos = Math.cos,
    sin = Math.sin;
var letters = "UNIVERSEDESIGN";

var defaultRotationX = -0.4;
var defaultRotationY = 0.5;

var lastFrameTime = 0;
var targetFPS = 30; // Ограничение FPS для плавности на мобильных
var frameInterval = 1000 / targetFPS;

function Point(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.originalX = x;
    this.originalY = y;
    this.originalZ = z;
    this.scatterX = Math.random() * 400 - 200; // Уменьшаем разброс для мобильных
    this.scatterY = Math.random() * 400 - 200; // Уменьшаем разброс для мобильных
    this.scatterZ = Math.random() * 400 - 200; // Уменьшаем разброс для мобильных
}
var focale = 250; // Уменьшаем фокусное расстояние для мобильных

Point.prototype.rotateX = function(angle) {
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    var y = this.y * cos - this.z * sin;
    var z = this.y * sin + this.z * cos;
    this.y = y;
    this.z = z;
}
Point.prototype.rotateY = function(angle) {
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    var x = this.x * cos + this.z * sin;
    var z = -this.x * sin + this.z * cos;
    this.x = x;
    this.z = z;
}
Point.prototype.draw = function(i, j) {
    var x = this.x,
        y = this.y,
        z = this.z;
    var scale = focale / (focale + z);
    ctx.beginPath();
    var fontSize = Math.max(6, ww / 100); // Еще меньший динамический размер шрифта для мобильных
    ctx.font = `${fontSize}px OneDay`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; // Больше прозрачности для читаемости
    var text = letters[i % letters.length];
    var xPos = ww / 2 + x * scale + (i % 2 === 0 ? 1 : -1); // Минимальный сдвиг для чередования
    var yPos = wh / 2 + y * scale;
    ctx.fillText(text, xPos, yPos);
}

function getCubeSize() {
    var w = window.innerWidth;
    if (w < 576) return 80; // Очень маленький размер для мобильных
    if (w < 768) return 120; // Меньший размер для мобильных
    if (w < 992) return 160; // Средний размер для планшетов
    if (w < 1200) return 200; // Больший размер для планшетов/малых десктопов
    if (w < 1400) return 240; // Средний десктоп
    return 280; // Большой десктоп
}

function createPoints() {
    points = [];
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
                points.push(point);
            }
        }
    }
}

function drawPoints() {
    for (var i = 0; i < points.length; i++) {
        var point = points[i];
        point.x = (1 - tParam) * point.originalX + tParam * point.scatterX;
        point.y = (1 - tParam) * point.originalY + tParam * point.scatterY;
        point.z = (1 - tParam) * point.originalZ + tParam * point.scatterZ;
        point.rotateX(rotationX);
        point.rotateY(rotationY);
        point.draw(i % linesX, Math.floor(i / linesX));
    }
}
createPoints();

function render(time) {
    if (time - lastFrameTime < frameInterval) {
        requestAnimationFrame(render);
        return;
    }
    lastFrameTime = time;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, ww, wh);
    drawPoints();
    if (!drag) {
        rotationY += 0.0001 * (time - lastFrameTime); // Уменьшаем скорость вращения для плавности
    }
    if (tParam < 0.1) {
        document.querySelector('.menu').style.display = 'block';
        document.querySelector('.logo-text').style.display = 'block';
    } else {
        document.querySelector('.menu').style.display = 'none';
        document.querySelector('.logo-text').style.display = 'none';
        document.querySelector('.overlay-menu').style.display = 'none';
    }
    requestAnimationFrame(render);
}

requestAnimationFrame(render);

if (menuBtn) {
    menuBtn.addEventListener('click', function() {
        console.log("Menu button clicked!");
        document.querySelector('.overlay-menu').style.display = 'block';
    });
}

if (logoText) {
    logoText.addEventListener('click', function() {
        console.log("Logo clicked!");
        animateGather();
    });
}

var sections = document.querySelectorAll('.overlay-menu a');
for (var i = 0; i < sections.length; i++) {
    sections[i].addEventListener('click', function(e) {
        e.preventDefault();
        console.log("Section clicked:", this.dataset.section);
        var section = this.dataset.section;
        overlayMask.style.display = 'block';
        activePopup = document.getElementById(section);
        activePopup.style.display = 'block';
    });
}

// Управление вращением
function handleStart(x, y) {
    console.log("Handle start:", x, y);
    drag = true;
    oldX = x;
    oldY = y;
}

function handleMove(x, y) {
    if (drag) {
        console.log("Handle move:", x, y);
        rotationY += (x - oldX) * 0.002; // Еще меньшая скорость вращения для плавности
        rotationX += (y - oldY) * 0.002; // Еще меньшая скорость вращения для плавности
        oldX = x;
        oldY = y;
    }
}

function handleEnd() {
    console.log("Handle end");
    drag = false;
}

// Анимации перехода
function animateGather() {
    console.log("Animating gather");
    var startTime = performance.now();
    var startParam = tParam;
    var startRotationX = rotationX;
    var startRotationY = rotationY;
    var duration = 300; // Уменьшаем до 0.3 секунды для быстрого и плавного перехода

    function step(currentTime) {
        var elapsed = currentTime - startTime;
        var progress = Math.min(elapsed / duration, 1);
        tParam = startParam * (1 - progress);
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

function animateScatter() {
    console.log("Animating scatter");
    var startTime = performance.now();
    var startParam = tParam;
    var duration = 300; // Уменьшаем до 0.3 секунды для быстрого и плавного перехода

    function step(currentTime) {
        var elapsed = currentTime - startTime;
        var progress = Math.min(elapsed / duration, 1);
        tParam = startParam + (1 - startParam) * progress;
        
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            tParam = 1;
        }
    }

    requestAnimationFrame(step);
}

// Управление жестами и скроллингом
var touchStartY = 0;
var swipeThreshold = 30; // Уменьшаем порог свайпа для мобильных

canvas.addEventListener('mousedown', function(e) {
    if (!activePopup) {
        handleStart(e.pageX, e.pageY);
    }
});

canvas.addEventListener('mousemove', function(e) {
    handleMove(e.pageX, e.pageY);
});

canvas.addEventListener('mouseup', handleEnd);

canvas.addEventListener('touchstart', function(e) {
    console.log("Touch start event");
    e.preventDefault();
    if (!activePopup) {
        var touch = e.touches[0];
        handleStart(touch.pageX, touch.pageY);
        touchStartY = touch.pageY; // Запоминаем начальную позицию для свайпа
    }
});

canvas.addEventListener('touchmove', function(e) {
    console.log("Touch move event");
    e.preventDefault();
    var touch = e.touches[0];
    handleMove(touch.pageX, touch.pageY);
});

canvas.addEventListener('touchend', function(e) {
    console.log("Touch end event");
    e.preventDefault();
    var touch = e.changedTouches[0];
    var deltaY = touchStartY - touch.pageY; // Вычисляем разницу для свайпа
    if (Math.abs(deltaY) > swipeThreshold) {
        if (deltaY > 0) {
            console.log("Swipe up - gathering");
            animateGather();
        } else {
            console.log("Swipe down - scattering");
            animateScatter();
        }
    }
    handleEnd();
});

// Скроллинг для проектов на мобильных и десктопе
projectsGrid.addEventListener('wheel', function(e) {
    e.preventDefault();
    projectsGrid.scrollTop += e.deltaY;
});

projectsGrid.addEventListener('touchmove', function(e) {
    e.preventDefault();
    var touch = e.touches[0];
    var deltaY = touch.pageY - oldY;
    projectsGrid.scrollTop -= deltaY;
    oldY = touch.pageY;
});

window.addEventListener('resize', function() {
    console.log("Window resized");
    ww = window.innerWidth;
    wh = window.innerHeight;
    canvas.width = ww;
    canvas.height = wh;
    createPoints();
    adjustDensity(); // Адаптация плотности
    adjustProjectsGrid(); // Адаптация размера сетки проектов
});

// Новая функция для адаптации плотности точек
function adjustDensity() {
    var w = window.innerWidth;
    if (w < 576) {
        linesX = 4;
        linesY = 4;
        pointsPerLine = 3;
        focale = 200;
    } else if (w < 768) {
        linesX = 6;
        linesY = 6;
        pointsPerLine = 4;
        focale = 250;
    } else if (w < 992) {
        linesX = 8;
        linesY = 8;
        pointsPerLine = 6;
        focale = 300;
    } else if (w < 1200) {
        linesX = 10;
        linesY = 10;
        pointsPerLine = 8;
        focale = 350;
    } else if (w < 1400) {
        linesX = 12;
        linesY = 12;
        pointsPerLine = 10;
        focale = 400;
    } else {
        linesX = 14;
        linesY = 14;
        pointsPerLine = 12;
        focale = 450;
    }
    createPoints(); // Пересоздаем точки с новыми параметрами
}

// Новая функция для адаптации размера сетки проектов
function adjustProjectsGrid() {
    var w = window.innerWidth;
    if (w >= 1400) {
        projectsGrid.style.maxHeight = '70vh';
    } else if (w >= 1200) {
        projectsGrid.style.maxHeight = '70vh';
    } else if (w >= 992) {
        projectsGrid.style.maxHeight = '65vh';
    } else if (w >= 768) {
        projectsGrid.style.maxHeight = '60vh';
    } else if (w >= 576) {
        projectsGrid.style.maxHeight = '55vh';
    } else {
        projectsGrid.style.maxHeight = '50vh';
    }
}

// Поддержка мыши для десктопа
canvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    if (!activePopup) {
        if (e.deltaY > 0) {
            animateScatter();
        } else {
            animateGather();
        }
    }
});

// Закрытие попапа при клике в любой области
document.addEventListener('click', function(event) {
    if (activePopup) {
        console.log("Closing popup");
        activePopup.style.display = 'none';
        overlayMask.style.display = 'none';
        activePopup = null;
    }
});

// Закрытие попапа через клавишу Escape (только для десктопа)
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && activePopup) {
        console.log("Closing popup with Escape key");
        activePopup.style.display = 'none';
        overlayMask.style.display = 'none';
        activePopup = null;
        event.preventDefault();
    }
});

// Предотвращение закрытия при клике на меню
menuBtn.addEventListener('click', function(event) {
    event.stopPropagation();
});

// Предотвращение закрытия при клике на пункты меню
var menuItems = document.querySelectorAll('.overlay-menu a');
menuItems.forEach(function(item) {
    item.addEventListener('click', function(event) {
        event.stopPropagation();
    });
});

console.log("All event listeners attached");

// Вызываем адаптацию при загрузке
adjustDensity();
adjustProjectsGrid();