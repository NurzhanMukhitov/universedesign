import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/*
 * Выносит из dist то, что нужно было только сборке.
 *
 * Пререндер выполняется во время build, но его чанки — renderToString, парсер
 * ссылок, сам скрипт — остаются в dist. Мало того: Rolldown видит скрипт
 * пререндера как точку входа и вешает на него <link rel="modulepreload">.
 * То есть браузер начинал бы предзагружать полсотни килобайт кода, который
 * никогда не выполнится, — при бюджете 1.2 секунды до интерактива это заметно.
 *
 * Поэтому порядок такой: сперва вырезаем подсказки предзагрузки из разметки,
 * потом удаляем сами файлы. Удаляем по префиксу имени, а не по хешу: хеш
 * меняется от сборки к сборке, префикс — нет.
 */

const DIST = new URL('../dist/', import.meta.url).pathname;
const SERVER_CHUNK_PREFIXES = ['prerender-', 'server.edge-', 'parse-'];

const isServerChunk = (name) =>
    SERVER_CHUNK_PREFIXES.some((prefix) => name.startsWith(prefix));

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

// 1. Убираем из разметки предзагрузку серверных чанков.
let preloadsDropped = 0;

for (const html of files.filter((f) => f.endsWith('.html'))) {
    const before = await readFile(html, 'utf8');
    const after = before.replace(
        /[ \t]*<link[^>]*rel="modulepreload"[^>]*>\n?/g,
        (tag) => {
            const href = tag.match(/href="([^"]+)"/)?.[1] ?? '';
            const name = href.split('/').pop();
            if (!isServerChunk(name)) return tag;
            preloadsDropped += 1;
            return '';
        },
    );

    if (after !== before) await writeFile(html, after);
}

// 2. Теперь, когда ссылок нет, удаляем сами файлы. Проверка на упоминание
//    остаётся страховкой: если плагин однажды начнёт подключать что-то из
//    этого списка по-настоящему, лучше оставить лишнее, чем сломать страницу.
const referenced = (
    await Promise.all(
        files.filter((f) => f.endsWith('.html')).map((f) => readFile(f, 'utf8')),
    )
).join('\n');

let removed = 0;
let freed = 0;

for (const file of files.filter((f) => isServerChunk(f.split('/').pop()))) {
    const name = file.split('/').pop();

    if (referenced.includes(name)) {
        console.log(`  оставлен (есть ссылка в HTML): ${name}`);
        continue;
    }

    freed += (await stat(file)).size;
    await rm(file);
    removed += 1;
}

console.log(
    `Убрано из dist: ${removed} серверных чанков (${Math.round(freed / 1024)} КБ), ` +
        `${preloadsDropped} лишних modulepreload`,
);
