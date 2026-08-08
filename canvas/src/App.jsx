import { Routes, Route, useLocation } from 'react-router';

import { ClientOnly } from './lib/ClientOnly.jsx';

/*
 * Каркас. Сцены появятся на шагах 3-7, пока здесь только скелет маршрутов —
 * его задача доказать, что пререндер отдаёт готовый HTML, а WebGL в сборку
 * не попадает.
 */

/** Полотно: куб, LedPulse, лента проектов, о нас, контакты. */
function Canvas() {
    return (
        <main>
            <h1>UNIVERSE DESIGN</h1>
            <p>Студия медиаарта. Волюметрические LED-экраны и медиаконтент.</p>

            {/*
             * Всё, что рисует WebGL, живёт внутри ClientOnly. В пререндеренном
             * HTML остаётся текст выше — то, что и должны прочитать поисковики.
             */}
            <ClientOnly>{null}</ClientOnly>
        </main>
    );
}

/** Страница проекта. Сюда WebGL не приходит вообще — только DOM. */
function Project() {
    const { pathname } = useLocation();
    return (
        <main>
            <h1>Проект</h1>
            <p>{pathname}</p>
        </main>
    );
}

function NotFound() {
    return (
        <main>
            <h1>Такой страницы нет</h1>
        </main>
    );
}

export function App() {
    return (
        <Routes>
            <Route path="/" element={<Canvas />} />
            <Route path="/projects/:slug" element={<Project />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
