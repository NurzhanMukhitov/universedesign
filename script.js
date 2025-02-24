console.log("JavaScript is running!");

var ww = window.innerWidth,
    wh = window.innerHeight;

var canvas = document.getElementById("c");
var menuBtn = document.querySelector('.menu-btn');
var logoText = document.querySelector('.logo-text');
var overlayMask = document.querySelector('.overlay-mask');

var activePopup = null;

console.log("DOM elements:", canvas, menuBtn, logoText, overlayMask);

canvas.width = ww;
canvas.height = wh;
var ctx = canvas.getContext("2d");

var points = [],
    linesX = 10, // Уменьшаем плотность для мобильных устройств
    linesY = 10, // Уменьшаем плотность для мобильных устройств
    pointsPerLine = 8; // Уменьшаем количество точек на линии
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

function Point(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.originalX = x;
    this.originalY = y;
    this.originalZ = z;
    this.scatterX = Math.random() * 1500 - 750; // Уменьшаем разброс для мобильных
    this.scatterY = Math.random() * 1500 - 750; // Уменьшаем разброс для мобильных
    this.scatterZ = Math.random() * 1500 - 750; // Уменьшаем разброс для мобильных
}
var focale = 400; // Уменьшаем фокусное расстояние для мобильных

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
    var fontSize = Math.max(10, ww / 60); // Динамический размер шрифта, минимум 10px
    ctx.font = `${fontSize}px OneDay`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)"; // Добавляем прозрачность (70%)
    var text = letters[i % letters.length];
    var xPos = ww / 2 + x * scale + (i % 2 === 0 ? 2 : -2); // Небольшой сдвиг для чередования
    var yPos = wh / 2 + y * scale;
    ctx.fillText(text, xPos, yPos);
}

function getCubeSize() {
    var w = window.innerWidth;
    if (w < 576) return 120; // Меньший размер для очень маленьких экранов
    if (w < 768) return 160; // Меньший размер для мобильных
    if (w < 992) return 200; // Средние экраны
    if (w < 1200) return 250; // Большие экраны
    if (w < 1400) return 300; // Очень большие экраны
    return 320; // Максимальный размер для огромных экранов
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
    for (var i = 0; i < linesX; i++) {
        for (var j = 0; j < linesY; j++) {
            for (var k = 0; k < pointsPerLine; k++) {
                var point = points[i * linesX * pointsPerLine + j * pointsPerLine + k];
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
createPoints();

var lastTime = 0;
function render(time) {
    var deltaTime = time - lastTime;
    lastTime = time;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, ww, wh);
    drawPoints();
    if (!drag) {
        rotationY += 0.0002 * deltaTime;
    }
    if (tParam < 0.1) {
        document.querySelector('.menu').style.display = 'block';
        document.querySelector('.logo-text').style.display = 'block';
    } else {
        document.querySelector('.menu').style.display = 'none';
        document.querySelector('.logo-text').style.display = 'none';
        document.querySelector('.overlay-menu').style.display = 'none';
    }
    window.requestAnimationFrame(render);
}

window.requestAnimationFrame(render);

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
        rotationY += (x - oldX) * 0.01;
        rotationX += (y - oldY) * 0.01;
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
    var duration = 1500;

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
    var duration = 1500;

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
var swipeThreshold = 50; // Порог свайпа для активации анимации

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

window.addEventListener('resize', function() {
    console.log("Window resized");
    ww = window.innerWidth;
    wh = window.innerHeight;
    canvas.width = ww;
    canvas.height = wh;
    createPoints();
    adjustDensity(); // Новая функция для адаптации плотности
});

// Новая функция для адаптации плотности точек
function adjustDensity() {
    var w = window.innerWidth;
    if (w < 576) {
        linesX = 8;
        linesY = 8;
        pointsPerLine = 6;
        focale = 300;
    } else if (w < 768) {
        linesX = 10;
        linesY = 10;
        pointsPerLine = 8;
        focale = 350;
    } else if (w < 992) {
        linesX = 12;
        linesY = 12;
        pointsPerLine = 10;
        focale = 400;
    } else {
        linesX = 14;
        linesY = 14;
        pointsPerLine = 10;
        focale = 500;
    }
    createPoints(); // Пересоздаем точки с новыми параметрами
}

// Поддержка мыши для десктопа
canvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    console.log("Wheel event", e.deltaY);
    if (e.deltaY > 0) {
        animateScatter();
    } else {
        animateGather();
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