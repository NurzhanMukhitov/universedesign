import { Root } from './Root.jsx';

/*
 * Скрипт сборки. В браузер не попадает — плагин собирает его отдельным
 * прогоном, поэтому renderToString и парсер ссылок не утекают в клиентский
 * бандл.
 *
 * Вызывается по разу на каждый обнаруженный URL.
 */
export async function prerender(data) {
    const { renderToString } = await import('react-dom/server.edge');
    const { parseLinks } = await import('vite-prerender-plugin/parse');

    const html = await renderToString(<Root url={data.url} />);

    return {
        html,
        links: new Set(parseLinks(html)),
    };
}
