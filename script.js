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
    linesX = 14,
    linesY = 14,
    pointsPerLine = 10;
var tParam = 1;
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
    this.scatterX = Math.random() * 2000 - 1000;
    this.scatterY = Math.random() * 2000 - 1000;
    this.scatterZ = Math.random() * 2000 - 1000;
}
var focale = 500;

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
    ctx.font = "18px OneDay";
    ctx.fillStyle = "#ffffff";
    var text = letters[i % letters.length];
    var xPos = ww / 2 + x * scale;
    var yPos = wh / 2 + y * scale;
    ctx.fillText(text, xPos, yPos);
}

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
    if (tParam < .1) {
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
        tParam = 0;
        rotationX = defaultRotationX;
        rotationY = defaultRotationY;
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
    handleEnd();
});

window.addEventListener('resize', function() {
    console.log("Window resized");
    ww = window.innerWidth;
    wh = window.innerHeight;
    canvas.width = ww;
    canvas.height = wh;
    createPoints();
});

var scrollThreshold = 50;
var scrollAccumulator = 0;

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

function handleScroll(deltaY) {
    console.log("Handle scroll:", deltaY);
    scrollAccumulator += deltaY;

    if (scrollAccumulator > scrollThreshold) {
        console.log("Scattering");
        animateScatter();
        scrollAccumulator = 0;
    } else if (scrollAccumulator < -scrollThreshold) {
        console.log("Gathering");
        animateGather();
        scrollAccumulator = 0;
    }
}

canvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    console.log("Wheel event", e.deltaY);
    handleScroll(e.deltaY);
});

canvas.addEventListener('touchmove', function(e) {
    if (drag) {
        console.log("Touch move for scroll");
        var touch = e.touches[0];
        var deltaY = oldY - touch.pageY;
        handleScroll(deltaY);
        oldY = touch.pageY;
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
