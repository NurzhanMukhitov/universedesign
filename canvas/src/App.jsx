import { useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router';

import { ClientOnly } from './lib/ClientOnly.jsx';
import { Cube } from './cube/Cube.jsx';
import {
    useScrollProgress,
    useEnterProgress,
    useReducedMotion,
} from './lib/useScrollProgress.js';
import { Menu } from './sections/Menu.jsx';
import { About } from './sections/About.jsx';
import { LedPulse } from './sections/LedPulse.jsx';
import { Projects } from './sections/Projects.jsx';
import { Contacts } from './sections/Contacts.jsx';

/*
 * Полотно.
 *
 * Первый экран повторяет боевой сайт: раскрытое меню слева, логотип справа,
 * куб по центру. Дальше по прокрутке куб рассыпается той же механикой, что
 * и раньше, а из-под него выходят разделы — в порядке, заданном владельцем:
 * о нас, технология, проекты, контакты.
 */
function Stage() {
    const stageRef = useRef(null);
    const contactsRef = useRef(null);
    const reducedMotion = useReducedMotion();

    // Разлёт на первом экране и обратная сборка на контактах — один и тот же
    // параметр с разных концов полотна: куб уходит в облако, пока читают
    // страницу, и собирается обратно к контактам.
    const scatter = useScrollProgress(stageRef);
    const gather = useEnterProgress(contactsRef);
    const progress = Math.max(0, Math.min(1, scatter - gather));

    return (
        <>
            {/*
             * Куб внутри ClientOnly: сборка гоняет страницу через
             * renderToString в Node, где canvas отсутствует. В пререндеренном
             * HTML остаётся текст разделов — то, что читают поисковики.
             */}
            <ClientOnly>
                <Cube t={progress} reducedMotion={reducedMotion} />
            </ClientOnly>

            <section className="stage" ref={stageRef}>
                <Menu />
            </section>

            <About />
            <LedPulse />
            <Projects />
            <Contacts ref={contactsRef} />
        </>
    );
}

function Project() {
    const { pathname } = useLocation();
    return (
        <main className="section">
            <div className="section__inner">
                <h1 className="title">Проект</h1>
                <p className="lede">{pathname}</p>
            </div>
        </main>
    );
}

function NotFound() {
    return (
        <main className="section">
            <div className="section__inner">
                <h1 className="title">Такой страницы нет</h1>
            </div>
        </main>
    );
}

export function App() {
    return (
        <Routes>
            <Route path="/" element={<Stage />} />
            <Route path="/projects/:slug" element={<Project />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
