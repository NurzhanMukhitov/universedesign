/*
 * Единственная точка, знающая, где лежит медиа.
 *
 * Решение по хостингу за месяц менялось дважды: GitHub Pages -> Vercel -> свой
 * VPS. Каждый раз менялись и пути к картинкам. Поэтому ни один компонент не
 * пишет путь напрямую — всё идёт сюда, и следующий переезд станет правкой
 * одного файла.
 *
 * Здесь же спрятана разница между двумя источниками:
 *   картинки — исходники соседних папок репозитория, их обрабатывает
 *              vite-imagetools при сборке и кладёт в dist;
 *   видео   — лежит на сервере в /var/www/canvas-media/ мимо гита, потому что
 *              бинарные блобы уже раздули .git до 346 МБ. nginx отдаёт его
 *              по /media/.
 */

/** Базовый путь для видео. Совпадает с `location /media/` в конфиге nginx. */
const MEDIA_BASE = '/media/';

/**
 * Картинка из галереи проекта.
 *
 * Пути ведут на два уровня вверх — в корень репозитория, где лежат исходные
 * папки проектов. Vite резолвит их на сборке, оптимизирует и переписывает
 * на хешированные имена в dist; в рантайме сюда уже приходит готовый URL.
 *
 * @param {string} project — папка проекта, например 'refraction'
 * @param {string} file    — имя файла с расширением, например 'image1.jpg'
 */
export function projectImage(project, file) {
    return new URL(
        `../../../projects/${project}/gallery/${file}`,
        import.meta.url,
    ).href;
}

/**
 * Обложка проекта для ленты.
 *
 * @param {string} project — папка проекта
 * @param {string} [file]  — имя файла, по умолчанию 'cover.jpg'
 */
export function projectCover(project, file = 'cover.jpg') {
    return new URL(
        `../../../projects/${project}/covers/${file}`,
        import.meta.url,
    ).href;
}

/**
 * Видео с сервера. В гит не попадает — см. AGENTS.md, раздел про canvas-media.
 *
 * @param {string} file — имя файла, например 'ledpulse.mp4'
 */
export function video(file) {
    return MEDIA_BASE + file;
}

/**
 * Постер к видео. Лежит рядом с самим видео, тоже на сервере: постер к ролику,
 * которого нет в гите, держать в гите незачем.
 *
 * @param {string} file — имя файла, например 'ledpulse.jpg'
 */
export function videoPoster(file) {
    return MEDIA_BASE + file;
}
