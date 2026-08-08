import { useEffect, useRef } from 'react';

import { CubeEngine } from './engine.js';

/*
 * Куб на полотне.
 *
 * Отличие от боевого сайта в том, как ведёт себя палец. Там холст перехватывал
 * touchmove целиком и сам решал, вращать куб или разлетать его; страница под
 * ним не скроллилась вовсе — она и не должна была, экран был один.
 *
 * Здесь под кубом лежит длинный документ, и отбирать у него скролл нельзя.
 * Поэтому на первом же движении пальца определяем намерение: повёл вбок —
 * крутим куб, повёл вверх или вниз — молча отдаём жест странице. Мышь крутит
 * всегда: мышью не прокручивают, для этого есть колесо.
 */
export function Cube({ scattered = false, reducedMotion = false }) {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);

    // Заводим движок один раз на всё время жизни компонента.
    useEffect(() => {
        const engine = new CubeEngine(canvasRef.current);
        engineRef.current = engine;

        if (reducedMotion) {
            // Человек попросил меньше движения: рисуем один кадр и молчим.
            engine.render(performance.now());
        } else {
            engine.start();
        }

        const onResize = () => engine.resize();
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
            engine.destroy();
            engineRef.current = null;
        };
    }, [reducedMotion]);

    // Прокрутка не тянет куб за собой, а спускает курок: дальше он
    // рассыпается или собирается сам, за полторы секунды. Так это работает
    // на боевом сайте, и именно отсюда ощущение живого объекта.
    useEffect(() => {
        const engine = engineRef.current;
        if (!engine) return;

        if (reducedMotion) {
            engine.setT(scattered ? 1 : 0);
            engine.render(performance.now());
            return;
        }

        engine.animateTo(scattered ? 1 : 0, 1500);
    }, [scattered, reducedMotion]);

    // Жесты. Слушатели вешаем вручную, потому что touchmove нужен
    // неpassive: React вешает свои как passive, а из passive нельзя
    // отменить прокрутку, когда мы всё-таки решили крутить куб.
    useEffect(() => {
        const canvas = canvasRef.current;
        const engine = engineRef.current;
        if (!canvas || !engine) return;

        let pointerX = 0;
        let pointerY = 0;

        // null — намерение ещё не определено, решаем на первом движении.
        let intent = null;

        const onMouseDown = (event) => {
            engine.setDragging(true);
            pointerX = event.clientX;
            pointerY = event.clientY;
        };

        const onMouseMove = (event) => {
            if (!engine.dragging) return;
            engine.rotateBy(event.clientX - pointerX, event.clientY - pointerY);
            pointerX = event.clientX;
            pointerY = event.clientY;
        };

        const onMouseUp = () => engine.setDragging(false);

        const onTouchStart = (event) => {
            const touch = event.touches[0];
            pointerX = touch.clientX;
            pointerY = touch.clientY;
            intent = null;
        };

        const onTouchMove = (event) => {
            const touch = event.touches[0];
            const dx = touch.clientX - pointerX;
            const dy = touch.clientY - pointerY;

            if (intent === null) {
                // Ждём, пока движение станет отчётливым: у самого начала
                // жеста dx и dy шумят и намерение определяется неверно.
                if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
                intent = Math.abs(dx) > Math.abs(dy) ? 'rotate' : 'scroll';
                if (intent === 'rotate') engine.setDragging(true);
            }

            if (intent === 'scroll') return;

            // Крутим — значит прокрутка страницы сейчас не нужна.
            event.preventDefault();
            engine.rotateBy(dx, dy);
            pointerX = touch.clientX;
            pointerY = touch.clientY;
        };

        const onTouchEnd = () => {
            engine.setDragging(false);
            intent = null;
        };

        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('touchstart', onTouchStart, { passive: true });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd);
        canvas.addEventListener('touchcancel', onTouchEnd);

        return () => {
            canvas.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('touchmove', onTouchMove);
            canvas.removeEventListener('touchend', onTouchEnd);
            canvas.removeEventListener('touchcancel', onTouchEnd);
        };
    }, []);

    return <canvas ref={canvasRef} className="cube" aria-hidden="true" />;
}
