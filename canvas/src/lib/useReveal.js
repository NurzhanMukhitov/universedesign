import { useEffect, useRef, useState } from 'react';

/**
 * Прогресс 0…1, который идёт сам по времени, как только элемент попал в кадр.
 *
 * Отличается от привязки к прокрутке принципиально. При привязке анимация —
 * это полоса прокрутки: остановился — замерло на полпути, отмотал — поехало
 * назад. Здесь прокрутка лишь спускает курок, а дальше движение идёт своим
 * ходом и доходит до конца.
 *
 * Так работает куб на боевом сайте, и того же владелец попросил для текста:
 * попал на раздел — буквы собрались сами, не дожидаясь, пока крутанут дальше.
 * Это же снимает вопрос с переходом по ссылке из меню: якорь бросает человека
 * в середину раздела, прокрутки после этого может не быть вовсе, а сборка
 * всё равно произойдёт.
 *
 * @param {object} ref — элемент, за появлением которого следим
 * @param {object} options
 * @param {number} options.duration — длительность, мс
 * @param {number} options.threshold — какая доля элемента должна показаться
 * @param {boolean} options.instant — отдать сразу единицу, без движения
 */
export function useReveal(ref, { duration = 1800, threshold = 0.25, instant = false } = {}) {
    const [progress, setProgress] = useState(instant ? 1 : 0);
    const startedRef = useRef(false);

    useEffect(() => {
        if (instant) {
            setProgress(1);
            return;
        }

        const element = ref.current;
        if (!element) return;

        let frame = null;

        const run = (startedAt) => {
            const tick = (now) => {
                const ratio = Math.min((now - startedAt) / duration, 1);

                // Плавный вход и выход: буквы трогаются мягко, у цели
                // притормаживают.
                const eased =
                    ratio < 0.5
                        ? 4 * ratio * ratio * ratio
                        : 1 - Math.pow(-2 * ratio + 2, 3) / 2;

                setProgress(eased);
                if (ratio < 1) frame = requestAnimationFrame(tick);
            };

            frame = requestAnimationFrame(tick);
        };

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting || startedRef.current) continue;

                    startedRef.current = true;
                    observer.disconnect();
                    run(performance.now());
                }
            },
            { threshold },
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
            if (frame !== null) cancelAnimationFrame(frame);
        };
    }, [ref, duration, threshold, instant]);

    return progress;
}
