/*
 * ASCII-куб. Порт кубической части script.js с боевого сайта.
 *
 * Куб намеренно остаётся на Canvas 2D и не переезжает на three.js: он сложен
 * из букв слова UNIVERSEDESIGN, и буквы здесь несут смысл, а не фактуру.
 * Порт на WebGL потребовал бы SDF-атласа глифов и всё равно дал бы другую
 * картинку.
 *
 * Что изменилось против оригинала — ровно одно: там `render()` сам решал,
 * показывать ли бургер, логотип и переключатель языка, то есть состояние
 * интерфейса было вшито в кадр анимации. Здесь движок ничего не знает про
 * DOM вокруг: он принимает t снаружи и рисует. Кто и когда показывает
 * интерфейс — забота React.
 *
 * t (0…1) — положение между собранным кубом и разлётом. В оригинале он звался
 * tParam и жил неявной глобальной переменной.
 */

const LETTERS = 'UNIVERSEDESIGN';
const LINES_X = 14;
const LINES_Y = 14;
const FOCALE = 500;
const DEFAULT_ROTATION_X = -0.4;
const DEFAULT_ROTATION_Y = 0.5;
const AUTO_ROTATE_SPEED = 0.0002;

/** Длительность полного цикла подсветки букв, мс. */
const HIGHLIGHT_CYCLE = 8000;

/** Точек в глубину: на узком экране меньше, иначе куб превращается в кашу. */
function pointsPerLineFor(width) {
    return width < 768 ? 8 : 10;
}

/** Размер куба под ширину экрана. Значения подобраны на боевом сайте. */
function cubeSizeFor(width) {
    if (width < 576) return 220;
    if (width < 768) return 280;
    if (width < 992) return 260;
    if (width < 1200) return 300;
    if (width < 1400) return 340;
    return 360;
}

/** Кегль букв. На узком экране 8px, дальше 14px. */
function fontSizeFor(width) {
    return width < 768 ? 8 : 14;
}

class Point {
    constructor(x, y, z) {
        this.originalX = x;
        this.originalY = y;
        this.originalZ = z;

        // Куда точка улетает при разлёте. Разброс задаётся один раз при
        // создании — иначе куб «кипел» бы вместо того, чтобы расходиться.
        this.scatterX = Math.random() * 2000 - 1000;
        this.scatterY = Math.random() * 2000 - 1000;
        this.scatterZ = Math.random() * 2000 - 1000;

        // Координаты после поворота, пересчитываются каждый кадр.
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

export class CubeEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.t = 0;
        this.rotationX = DEFAULT_ROTATION_X;
        this.rotationY = DEFAULT_ROTATION_Y;

        // Пока пользователь крутит куб пальцем, автовращение молчит: иначе
        // объект уезжает из-под руки.
        this.dragging = false;

        this.points = [];
        this.highlighted = new Set();
        this.highlightIntensity = 0;
        this.letterIndex = 0;
        this.lastHighlightTime = 0;
        this.lastFrameTime = 0;
        this.frameHandle = null;

        // Подсветка букв включается только в разлёте — на собранном кубе её
        // всё равно не видно, а считать её каждый кадр незачем.
        this.highlightEnabled = false;

        this.resize();
    }

    /** Пересобирает точки и подгоняет холст под размер окна и плотность пикселей. */
    resize() {
        const { canvas, ctx } = this;
        const width = window.innerWidth;
        const height = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;

        this.width = width;
        this.height = height;
        this.fontSize = fontSizeFor(width);

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        // setTransform, а не scale: scale умножается на предыдущий масштаб,
        // и после второго ресайза холст уезжал бы вдвое.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.createPoints();
    }

    createPoints() {
        const size = cubeSizeFor(this.width);
        const perLine = pointsPerLineFor(this.width);
        const topZ = size / 2;
        const botZ = -size / 2;
        const spaceX = size / LINES_X;
        const spaceY = size / LINES_Y;

        this.pointsPerLine = perLine;
        this.points = [];

        for (let j = 0; j < LINES_Y; j++) {
            for (let i = 0; i < LINES_X; i++) {
                const x = -size / 2 + i * spaceX;
                const y = -size / 2 + j * spaceY;

                for (let k = 0; k < perLine; k++) {
                    const z = topZ + ((botZ - topZ) / perLine) * k;
                    this.points.push(new Point(x, y, z));
                }
            }
        }
    }

    /** Положение между собранным кубом (0) и разлётом (1). */
    setT(value) {
        this.t = Math.max(0, Math.min(1, value));
        this.highlightEnabled = this.t >= 0.9;
        if (!this.highlightEnabled) this.highlighted.clear();
    }

    /** Поворот от жеста. dx и dy — смещение указателя в пикселях. */
    rotateBy(dx, dy) {
        this.rotationY += dx * 0.01;
        this.rotationX += dy * 0.01;
    }

    setDragging(value) {
        this.dragging = value;
    }

    start() {
        if (this.frameHandle !== null) return;
        const loop = (time) => {
            this.frameHandle = requestAnimationFrame(loop);
            this.render(time);
        };
        this.frameHandle = requestAnimationFrame(loop);
    }

    stop() {
        if (this.frameHandle === null) return;
        cancelAnimationFrame(this.frameHandle);
        this.frameHandle = null;
    }

    /**
     * Рисует один кадр. В отличие от оригинала не трогает ничего за пределами
     * своего холста.
     */
    render(time) {
        const { ctx } = this;

        let delta = time - this.lastFrameTime;
        this.lastFrameTime = time;

        // Вкладка была в фоне — не наверстываем пропущенное рывком.
        if (delta > 100) delta = 100;

        if (!this.dragging) {
            this.rotationY += AUTO_ROTATE_SPEED * delta;
        }

        // Синус и косинус считаем раз на кадр, а не на каждую из полутора
        // тысяч точек.
        const sinX = Math.sin(this.rotationX);
        const cosX = Math.cos(this.rotationX);
        const sinY = Math.sin(this.rotationY);
        const cosY = Math.cos(this.rotationY);

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.width, this.height);

        this.updateHighlight(time);
        this.drawPoints(sinX, cosX, sinY, cosY);
    }

    drawPoints(sinX, cosX, sinY, cosY) {
        const { ctx, t, points, pointsPerLine } = this;
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        const font = this.fontSize;

        // Ветвление по состоянию вынесено из цикла: внутри оно исполнялось бы
        // полторы тысячи раз за кадр ради значений, которые не меняются.
        const gathered = t <= 0.1;
        const scattered = t >= 0.9;

        for (let i = 0; i < LINES_X; i++) {
            for (let j = 0; j < LINES_Y; j++) {
                for (let k = 0; k < pointsPerLine; k++) {
                    const idx = i * LINES_Y * pointsPerLine + j * pointsPerLine + k;
                    const point = points[idx];

                    // Интерполяция между собранным состоянием и разлётом —
                    // то самое место, которое теперь принимает скролл.
                    const px = (1 - t) * point.originalX + t * point.scatterX;
                    const py = (1 - t) * point.originalY + t * point.scatterY;
                    const pz = (1 - t) * point.originalZ + t * point.scatterZ;

                    const y1 = py * cosX - pz * sinX;
                    const z1 = py * sinX + pz * cosX;
                    const x2 = px * cosY + z1 * sinY;
                    const z2 = -px * sinY + z1 * cosY;

                    const scale = FOCALE / (FOCALE + z2);
                    const isHighlighted = scattered && this.highlighted.has(idx);

                    if (isHighlighted) {
                        // Буква в подсветке: светится и слегка пульсирует.
                        const depth = Math.max(
                            0.4,
                            Math.min(1, 1 - (z2 + 1000) / 2000),
                        );
                        const opacity = depth * (0.6 + this.highlightIntensity * 0.4);

                        ctx.font = `bold ${font}px OneDay`;
                        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                        ctx.shadowColor = `rgba(255, 255, 255, ${opacity * 0.8})`;
                        ctx.shadowBlur = 20 * depth;
                    } else if (gathered && j === LINES_Y - 1) {
                        // Верхняя грань собранного куба — сплошной белый:
                        // именно она читается как надпись.
                        ctx.font = `bold ${font}px OneDay`;
                        ctx.fillStyle = '#ffffff';
                        ctx.shadowColor = 'transparent';
                        ctx.shadowBlur = 0;
                    } else {
                        // Остальные точки тонут в глубине по мере удаления.
                        const depth = Math.max(
                            0,
                            Math.min(1, 1 - (z2 + 1000) / 2000),
                        );
                        const shade = Math.floor(20 + depth * 127);

                        ctx.font = `${font}px OneDay`;
                        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
                        ctx.shadowColor = 'transparent';
                        ctx.shadowBlur = 0;
                    }

                    ctx.fillText(
                        LETTERS[i % LETTERS.length],
                        halfW + x2 * scale,
                        halfH + y1 * scale,
                    );
                }
            }
        }
    }

    /**
     * Подсветка букв в разлёте: буквы слова зажигаются по очереди и остаются
     * гореть, пульсируя. Работает только когда куб разлетелся.
     */
    updateHighlight(time) {
        if (!this.highlightEnabled) return;
        if (!this.lastHighlightTime) this.lastHighlightTime = time;

        if (this.highlighted.size > 0) {
            // Три синусоиды с разными периодами: одна давала бы ровное
            // мигание, вместе они дышат неровно и потому живо.
            const slow = Math.sin(time * 0.0005) * 0.5;
            const medium = Math.sin(time * 0.001) * 0.3;
            const fast = Math.sin(time * 0.002) * 0.2;
            this.highlightIntensity = (slow + medium + fast + 1) / 2;
        }

        if (time - this.lastHighlightTime <= HIGHLIGHT_CYCLE / LETTERS.length) {
            return;
        }

        // Зажигаем несколько случайных точек текущей буквы.
        const letter = LETTERS[this.letterIndex];
        const candidates = [];

        for (let i = 0; i < LINES_X; i++) {
            if (LETTERS[i % LETTERS.length] !== letter) continue;
            for (let j = 0; j < LINES_Y; j++) {
                for (let k = 0; k < this.pointsPerLine; k++) {
                    candidates.push(
                        i * LINES_Y * this.pointsPerLine + j * this.pointsPerLine + k,
                    );
                }
            }
        }

        for (let n = 0; n < 8 && candidates.length > 0; n++) {
            const pick = Math.floor(Math.random() * candidates.length);
            this.highlighted.add(candidates[pick]);
            candidates.splice(pick, 1);
        }

        this.letterIndex = (this.letterIndex + 1) % LETTERS.length;
        this.lastHighlightTime = time;
    }

    destroy() {
        this.stop();
        this.points = [];
        this.highlighted.clear();
    }
}
