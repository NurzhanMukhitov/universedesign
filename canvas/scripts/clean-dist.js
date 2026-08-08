import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

/*
 * Выносит из dist то, что нужно было только сборке.
 *
 * Пререндер выполняется во время build, но его чанки — renderToString, парсер
 * ссылок, сам скрипт — остаются в dist. Мало того: Rolldown видит скрипт
 * пререндера как точку входа и вешает на него <link rel="modulepreload">,
 * то есть браузер начинал бы предзагружать полсотни килобайт кода, который
 * никогда не выполнится.
 *
 * Считаем достижимость, а не смотрим на имена. Первая версия скрипта удаляла
 * файлы по префиксу `prerender-` — и сломалась ровно тогда, когда бандлер
 * перекроил чанки: под этим именем оказался общий код приложения, страница
 * получила 404 и пустой экран. Имена чанков решает бандлер, полагаться на них
 * нельзя.
 *
 * Поэтому: берём за корни разметку, обходим импорты вглубь и удаляем то,
 * до чего из HTML дойти нельзя.
 */

const DIST = new URL('../dist/', import.meta.url).pathname;

/** Рекурсивно собирает пути всех файлов внутри директории. */
async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        entries.map((entry) => {
            const path = join(dir, entry.name);
            return entry.isDirectory() ? walk(path) : [path];
        }),
    );
    return files.flat();
}

const files = await walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const assets = files.filter((f) => /\.(js|css)$/.test(f));

// Шаг 1. Убираем из разметки предзагрузку того, что окажется лишним. Делаем
// это до обхода, чтобы такие ссылки не считались за достижимость.
const assetNames = new Set(assets.map((f) => basename(f)));
const contents = new Map(
    await Promise.all(
        assets.map(async (f) => [basename(f), await readFile(f, 'utf8')]),
    ),
);

/**
 * Имена ассетов, подключённых из этого файла **статически**.
 *
 * Различие принципиальное. Статический импорт браузер выполняет всегда —
 * такой чанк нужен. Динамический (`import("./x.js")`) выполняется только
 * когда до него дойдёт код; у нас через него подключён renderToString,
 * а вызывает его лишь функция пререндера, которой в браузере не бывает.
 * Считать оба вида одинаково — значит держать в сборке двести килобайт,
 * которые никто никогда не запросит.
 */
function referencesIn(text) {
    const found = [];

    for (const name of assetNames) {
        // Экранируем: в именах чанков попадаются точки и дефисы.
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // `from "./x.js"` — обычный импорт, `import "./x.js"` — ради
        // побочного эффекта. Оба статические.
        const isStatic = new RegExp(
            `(?:from|import)\\s*["'][^"']*${escaped}["']`,
        ).test(text);

        if (isStatic) found.push(name);
    }

    return found;
}

// Шаг 2. Обход в ширину от разметки вглубь по импортам.
const reachable = new Set();
const queue = [];

for (const html of htmlFiles) {
    const text = await readFile(html, 'utf8');

    // Корни — только то, что браузер обязан загрузить: скрипт входа
    // и таблица стилей. modulepreload сюда не входит намеренно: это
    // подсказка предзагрузки, и плагин вешает её в том числе на чанк
    // пререндера. Считать её доказательством нужности — значит объявить
    // достижимым ровно то, что мы собираемся убрать.
    for (const tag of text.matchAll(/<(?:script|link)[^>]*>/g)) {
        const raw = tag[0];
        if (raw.includes('rel="modulepreload"')) continue;

        const name = basename(raw.match(/(?:src|href)="([^"]+)"/)?.[1] ?? '');
        if (assetNames.has(name)) queue.push(name);
    }
}

while (queue.length > 0) {
    const name = queue.pop();
    if (reachable.has(name)) continue;
    reachable.add(name);

    const text = contents.get(name);
    if (!text) continue;

    for (const child of referencesIn(text)) {
        if (!reachable.has(child)) queue.push(child);
    }
}

// Шаг 3. Недостижимое — это и есть остатки сборки.
let removed = 0;
let freed = 0;

for (const file of assets) {
    const name = basename(file);
    if (reachable.has(name)) continue;

    freed += (await stat(file)).size;
    await rm(file);
    removed += 1;
}

// Шаг 4. Подчищаем modulepreload на удалённое — иначе браузер полезет
// за файлами, которых больше нет.
let preloadsDropped = 0;

for (const html of htmlFiles) {
    const before = await readFile(html, 'utf8');
    const after = before.replace(
        /[ \t]*<link[^>]*rel="modulepreload"[^>]*>\n?/g,
        (tag) => {
            const href = tag.match(/href="([^"]+)"/)?.[1] ?? '';
            if (reachable.has(basename(href))) return tag;
            preloadsDropped += 1;
            return '';
        },
    );

    if (after !== before) await writeFile(html, after);
}

console.log(
    `Убрано из dist: ${removed} недостижимых чанков (${Math.round(freed / 1024)} КБ), ` +
        `${preloadsDropped} ссылок предзагрузки`,
);
