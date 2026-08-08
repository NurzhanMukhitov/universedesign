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

/*
 * Обложки проектов. Собираем глобом, а не по одной: список проектов живёт
 * в projects.json и меняется, а импорты пришлось бы править руками.
 *
 * Три ширины под реальные брейкпоинты; avif первым, webp запасным, исходный
 * jpeg — последним рубежом. Формат `picture` отдаёт готовый набор srcset,
 * из которого собирается тег <picture>.
 *
 * eager: обложки видны сразу в ленте, ленивая загрузка модуля тут только
 * добавила бы задержку.
 */
const covers = import.meta.glob(
    '../../../projects/*/covers/cover.jpg',
    {
        eager: true,
        query: {
            w: '480;960;1440',
            format: 'avif;webp;jpg',
            as: 'picture',

            // Не растягивать сверх исходника. Обложки старых проектов —
            // 640 пикселей по ширине; без этого запрос на 1440 давал
            // апскейл, то есть файл втрое тяжелее при том же качестве.
            withoutEnlargement: true,
        },
        import: 'default',
    },
);

/*
 * Кадры раздела UNIVERSE × LedPulse. Лежат в корне репозитория, в папке
 * с кириллической «х» в имени — она осталась с боевого сайта, и трогать
 * её нельзя: на неё ссылаются живые страницы.
 *
 * Ширины крупнее, чем у обложек: эти кадры идут во весь экран.
 */
const ledpulseFrames = import.meta.glob(
    '../../../UNIVERSEхLedPulse/*.jpeg',
    {
        eager: true,
        query: {
            w: '960;1440;1920',
            format: 'avif;webp;jpg',
            as: 'picture',
            withoutEnlargement: true,
        },
        import: 'default',
    },
);

/** Кадры LedPulse по имени файла без расширения: image3, image7 и так далее. */
export const ledpulse = Object.fromEntries(
    Object.entries(ledpulseFrames).map(([path, value]) => [
        path.split('/').pop().replace('.jpeg', ''),
        value,
    ]),
);

/** Достаёт slug проекта из пути вида ../../../projects/<slug>/covers/cover.jpg */
function slugOf(path) {
    return path.split('/projects/')[1]?.split('/')[0] ?? '';
}

/** Обложки, разложенные по slug проекта. */
export const projectCovers = Object.fromEntries(
    Object.entries(covers).map(([path, value]) => [slugOf(path), value]),
);

/**
 * Обложка проекта: объект с полями sources и img — готов для тега <picture>.
 *
 * @param {string} project — папка проекта, например 'refraction'
 */
export function projectCover(project) {
    return projectCovers[project] ?? null;
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
