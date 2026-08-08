/*
 * Скрипт сборки. В браузер не попадает.
 *
 * Импорты динамические, включая корень приложения. Это не стиль, а способ
 * разорвать связь: при статическом импорте Rolldown складывает этот файл
 * и Root.jsx в один чанк, клиент тянет его ради Root, и вместе с ним
 * в достижимый граф въезжает renderToString.
 *
 * Ссылки не краулим. Плагин умеет обходить разметку и искать новые адреса,
 * но парсер весит вдвое больше самого рендерера, а список страниц у сайта
 * известен заранее и должен быть под контролем: он же лежит в sitemap.
 * Маршруты перечислены в vite.config.js.
 */
export async function prerender(data) {
    const { renderToString } = await import('react-dom/server.edge');
    const { Root } = await import('./Root.jsx');

    return { html: await renderToString(<Root url={data.url} />) };
}
