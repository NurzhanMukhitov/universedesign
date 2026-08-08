import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router';

import { ClientOnly } from './lib/ClientOnly.jsx';
import { Cube } from './cube/Cube.jsx';
import { useReducedMotion } from './lib/useScrollProgress.js';
import { useHashScroll } from './lib/useHashScroll.js';
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

/**
 * Следит, надо ли кубу быть рассыпанным.
 *
 * Порог взят с боевого сайта: там прокрутка копится в счётчике, и когда
 * наберётся сотня, запускается анимация. Ниже первого экрана куб держим
 * рассыпанным всегда, у самого верха — собранным: вернулся наверх, увидел
 * куб на месте.
 */
function useScatterTrigger() {
    const [scattered, setScattered] = useState(false);

    useEffect(() => {
        let frame = null;

        const measure = () => {
            frame = null;
            // Сотня пикселей — тот же порог, что на боевом сайте.
            setScattered(window.scrollY > 100);
        };

        const onScroll = () => {
            if (frame !== null) return;
            frame = requestAnimationFrame(measure);
        };

        measure();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            if (frame !== null) cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    return scattered;
}
function Stage() {
    const contactsRef = useRef(null);
    const reducedMotion = useReducedMotion();

    // Переходы по пунктам меню: разметку рисует JavaScript, и штатный
    // переход браузера по якорю тут не срабатывает.
    useHashScroll();

    // Куб не привязан к полосе прокрутки. Прокрутка лишь спускает курок,
    // дальше он рассыпается сам — полторы секунды, сколько бы человек ни
    // крутил колесо. Так это сделано на боевом сайте, и оттуда ощущение
    // живого объекта, а не ползунка.
    const scattered = useScatterTrigger();

    return (
        <>
            {/*
             * Куб внутри ClientOnly: сборка гоняет страницу через
             * renderToString в Node, где canvas отсутствует. В пререндеренном
             * HTML остаётся текст разделов — то, что читают поисковики.
             */}
            <ClientOnly>
                <Cube scattered={scattered} reducedMotion={reducedMotion} />
            </ClientOnly>

            <section className="stage">
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
