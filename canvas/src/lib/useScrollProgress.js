import { useEffect, useState } from 'react';

/**
 * Прогресс прокрутки внутри элемента: 0 — верх элемента дошёл до верха окна,
 * 1 — низ элемента дошёл до низа окна.
 *
 * Библиотеки скролла сюда не тянем. ScrollControls из drei заводит собственный
 * контейнер прокрутки внутри WebGL-холста, а куб живёт вне его; GSAP с
 * ScrollTrigger — семьдесят килобайт ради одного числа, которое считается
 * четырьмя строками.
 *
 * Считаем в rAF, а не прямо в обработчике scroll: событие приходит чаще кадра,
 * и лишние пересчёты всё равно некуда показать.
 */
export function useScrollProgress(ref) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        let frame = null;

        const measure = () => {
            frame = null;

            const rect = element.getBoundingClientRect();

            // Сколько всего пикселей прокрутки приходится на этот элемент.
            const travel = rect.height - window.innerHeight;
            if (travel <= 0) {
                setProgress(rect.top <= 0 ? 1 : 0);
                return;
            }

            const value = -rect.top / travel;
            setProgress(Math.max(0, Math.min(1, value)));
        };

        const onScroll = () => {
            if (frame !== null) return;
            frame = requestAnimationFrame(measure);
        };

        measure();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);

        return () => {
            if (frame !== null) cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [ref]);

    return progress;
}

/** Следит за системной настройкой «меньше движения». */
export function useReducedMotion() {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReduced(query.matches);

        const onChange = (event) => setReduced(event.matches);
        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
    }, []);

    return reduced;
}
