import { useRef } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router';

import { ClientOnly } from './lib/ClientOnly.jsx';
import { Cube } from './cube/Cube.jsx';
import { useScrollProgress, useReducedMotion } from './lib/useScrollProgress.js';

/*
 * Шаг 3: куб и разлёт по скроллу. Остальные разделы полотна появятся дальше.
 */

function Stage() {
    const stageRef = useRef(null);
    const progress = useScrollProgress(stageRef);
    const reducedMotion = useReducedMotion();

    return (
        <>
            {/*
             * Куб внутри ClientOnly: сборка гоняет страницу через
             * renderToString в Node, где WebGL и canvas отсутствуют.
             * В пререндеренном HTML остаётся текст ниже — то, что читают
             * поисковики.
             */}
            <ClientOnly>
                <Cube t={progress} reducedMotion={reducedMotion} />
            </ClientOnly>

            <section className="stage" ref={stageRef}>
                <div className="stage__inner">
                    <div className="meta">
                        <span>UNIVERSE DESIGN</span>
                        <span>Москва</span>
                    </div>

                    <div>
                        <h1 className="title">Свет, который стоит в объёме</h1>
                        <p className="lede">
                            Студия медиаарта. Проектируем и собираем
                            волюметрические LED-экраны, делаем для них контент.
                        </p>
                    </div>

                    <div className="meta">
                        <Link to="/projects/refraction">Проекты</Link>
                        <span>RU / EN</span>
                    </div>
                </div>
            </section>

            <section className="stage__inner" style={{ position: 'relative' }}>
                <div>
                    <h2 className="title">Dragon O²</h2>
                    <p className="lede">
                        Волюметрический LED-экран. Светодиодные нити расставлены
                        не в плоскости, а в объёме — изображение остаётся
                        трёхмерным с любой точки зала и без очков.
                    </p>

                    <div className="spec">
                        <div className="spec__cell">
                            <p className="spec__label">Шаг нити</p>
                            <p className="spec__value">5 см</p>
                        </div>
                        <div className="spec__cell">
                            <p className="spec__label">Органический шаг</p>
                            <p className="spec__value">2,5 см</p>
                        </div>
                        <div className="spec__cell">
                            <p className="spec__label">Модуль</p>
                            <p className="spec__value">500×500×3100 мм</p>
                        </div>
                        <div className="spec__cell">
                            <p className="spec__label">Сборки</p>
                            <p className="spec__value">9 · 12 · 16 · 36</p>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

function Project() {
    const { pathname } = useLocation();
    return (
        <main className="stage__inner" style={{ position: 'relative' }}>
            <h1 className="title">Проект</h1>
            <p className="lede">{pathname}</p>
        </main>
    );
}

function NotFound() {
    return (
        <main className="stage__inner" style={{ position: 'relative' }}>
            <h1 className="title">Такой страницы нет</h1>
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
