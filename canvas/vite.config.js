import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { imagetools } from 'vite-imagetools';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';

export default defineConfig({
    plugins: [
        react(),

        /*
         * Картинки берём из соседних папок репозитория и оптимизируем на сборке.
         * Своего /_vercel/image на VPS нет, а исходники и так лежат рядом —
         * canvas/ это подпапка того же репозитория. Копировать нечего.
         */
        imagetools(),

        /*
         * Пререндер. У сайта 24 боевых URL, hreflang и .md-зеркала для
         * AI-краулеров; отдавать пустой <div> и дорисовывать его скриптом
         * нельзя — Яндекс исполняет JavaScript хуже Google, а он для нас
         * основной.
         *
         * Плагин рендерит в Node через renderToString, headless-браузера
         * в его зависимостях нет. Значит WebGL при сборке физически
         * отсутствует и повиснуть на SwiftShader не на чем. За то, чтобы
         * <Canvas> туда не попал, отвечает ClientOnly.
         */
        vitePrerenderPlugin({
            renderTarget: '#root',
            additionalPrerenderRoutes: ['/404'],

            // Отдельный файл, а не entry с атрибутом prerender: иначе код
            // сборки уезжает в браузерный бандл вместе с ленивыми ссылками
            // на renderToString — 400 КБ, которые никогда не выполнятся.
            prerenderScript: fileURLToPath(
                new URL('./src/prerender.jsx', import.meta.url),
            ),
        }),
    ],

    /*
     * Исходники медиа лежат выше canvas/ — в корне репозитория. Без этого
     * dev-сервер откажется их отдавать: по умолчанию Vite не выпускает
     * файловый доступ за пределы корня проекта.
     */
    server: {
        fs: {
            allow: ['..'],
        },
    },

    build: {
        // Отчёт о размере чанков нужен на каждой сборке: бюджет 400 КБ gzip
        // легко проесть одним неаккуратным импортом из drei.
        reportCompressedSize: true,
    },
});
