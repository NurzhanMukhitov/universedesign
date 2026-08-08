import { useMemo, useRef } from 'react';

import { useReducedMotion } from '../lib/useScrollProgress.js';
import { useReveal } from '../lib/useReveal.js';

/*
 * «О нас»: текст прилетает буквами и собирается на глазах.
 *
 * Буквы стартуют так же, как точки куба уходят в разлёт, — из случайных
 * позиций далеко от своего места, с поворотом и размытием, — и сходятся
 * по мере прокрутки. Тот же жест, что и у куба, только крупно и словами:
 * сначала шум, потом смысл.
 *
 * Как это сделано и почему именно так. В тексте больше двух сотен букв.
 * Пересчитывать положение каждой на каждом кадре в React значило бы
 * двести с лишним обновлений стилей за кадр — этого не выдержит ни один
 * телефон. Поэтому случайный разброс задаётся каждой букве один раз, при
 * первом рендере, и живёт в её собственных CSS-переменных, а скролл меняет
 * ровно одну переменную на контейнере. Дальше всё считает браузер
 * средствами CSS, на композиторе, без участия JavaScript.
 */

const TEXT =
    'UNIVERSE design — студия, объединяющая искусство, технологии ' +
    'и инновации. Мы создаём медиаарт-инсталляции, которые трансформируют ' +
    'пространство, вовлекают зрителя и открывают новые границы восприятия.';

/**
 * Раскладывает текст на слова, а слова — на буквы, раздавая каждой букве
 * свою точку старта.
 *
 * Деление на слова обязательно. Буква — это inline-block, и без обёртки
 * строка переносится в любом месте: получается «сту / дия» и «иск / усство».
 * Слово переносится целиком, буквы внутри него держатся вместе.
 *
 * Разброс детерминированный, а не через Math.random: пререндер выполняется
 * в Node, гидратация — в браузере, и разные случайные числа в этих двух
 * прогонах дали бы рассинхрон разметки.
 */
function useScatteredWords(text) {
    return useMemo(() => {
        // Простой конгруэнтный генератор: одно зерно — одна и та же раскладка
        // и на сервере, и в браузере.
        let seed = 20260808;
        const random = () => {
            seed = (seed * 1103515245 + 12345) % 2147483648;
            return seed / 2147483648;
        };

        let letterIndex = 0;

        return text.split(' ').map((word, wordIndex) => ({
            key: `${wordIndex}-${word}`,
            letters: [...word].map((char) => ({
                char,
                key: letterIndex++,
                // Откуда буква прилетает: далеко в сторону и по вертикали.
                dx: Math.round((random() - 0.5) * 900),
                dy: Math.round((random() - 0.5) * 620),
                rotate: Math.round((random() - 0.5) * 160),
                // Разброс задержек: буквы садятся не строем, а волной.
                delay: random() * 0.55,
            })),
        }));
    }, [text]);
}

export function About() {
    const ref = useRef(null);
    const reducedMotion = useReducedMotion();

    // Сборка идёт сама, как только раздел показался: прокрутка её лишь
    // запускает. Так текст соберётся и при переходе по ссылке из меню,
    // где никакой прокрутки после прыжка может не быть вовсе.
    const progress = useReveal(ref, {
        duration: 5200,
        threshold: 0.12,
        instant: reducedMotion,
    });
    const words = useScatteredWords(TEXT);

    const eased = progress;

    return (
        <section className="section section--about" id="about" ref={ref}>
            <div className="section__inner">
                <p className="section__index">01 · О нас</p>

                <p
                    className="assemble"
                    style={{ '--p': reducedMotion ? 1 : eased }}
                    // Экранный диктор читает текст целиком и сразу: для него
                    // сборка по буквам — это россыпь одиночных символов.
                    aria-label={TEXT}
                >
                    {words.map((word) => (
                        <span className="assemble__word" key={word.key}>
                            {word.letters.map((letter) => (
                                <span
                                    key={letter.key}
                                    className="assemble__letter"
                                    aria-hidden="true"
                                    style={{
                                        '--dx': `${letter.dx}px`,
                                        '--dy': `${letter.dy}px`,
                                        '--rot': `${letter.rotate}deg`,
                                        '--delay': letter.delay,
                                    }}
                                >
                                    {letter.char}
                                </span>
                            ))}
                        </span>
                    ))}
                </p>
            </div>
        </section>
    );
}
