import { useEffect, useRef, useState } from 'react';

/**
 * Бесконечный цикл сборки и разборки: 0 → 1 → пауза → 0 → пауза → снова.
 *
 * Режим для разглядывания эффекта, а не для сайта. В обычной жизни текст
 * собирается один раз, когда раздел показался, и дальше стоит: повторяющееся
 * движение рядом с текстом, который надо прочитать, мешает читать.
 * Выключается флагом `loop` в About.jsx.
 *
 * Фазы подобраны так, чтобы собранный текст успевали прочесть, а разборка
 * шла быстрее сборки — рассыпается всегда охотнее, чем собирается.
 */
const ASSEMBLE = 5200;
const HOLD_ASSEMBLED = 2600;
const DISASSEMBLE = 3000;
const HOLD_SCATTERED = 900;

const TOTAL = ASSEMBLE + HOLD_ASSEMBLED + DISASSEMBLE + HOLD_SCATTERED;

/** Плавный вход и выход — та же кривая, что у куба. */
function ease(ratio) {
    return ratio < 0.5
        ? 4 * ratio * ratio * ratio
        : 1 - Math.pow(-2 * ratio + 2, 3) / 2;
}

export function useAssembleLoop(enabled) {
    const [progress, setProgress] = useState(0);
    const frameRef = useRef(null);

    useEffect(() => {
        if (!enabled) return;

        let startedAt = null;

        const tick = (now) => {
            if (startedAt === null) startedAt = now;

            const t = (now - startedAt) % TOTAL;

            if (t < ASSEMBLE) {
                setProgress(ease(t / ASSEMBLE));
            } else if (t < ASSEMBLE + HOLD_ASSEMBLED) {
                setProgress(1);
            } else if (t < ASSEMBLE + HOLD_ASSEMBLED + DISASSEMBLE) {
                const d = (t - ASSEMBLE - HOLD_ASSEMBLED) / DISASSEMBLE;
                setProgress(1 - ease(d));
            } else {
                setProgress(0);
            }

            frameRef.current = requestAnimationFrame(tick);
        };

        frameRef.current = requestAnimationFrame(tick);

        return () => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        };
    }, [enabled]);

    return progress;
}
