import { useEffect } from 'react';

/**
 * Доводит до раздела, названного в адресе.
 *
 * Браузер делает это сам на обычной странице, но здесь разметку рисует
 * JavaScript: в момент, когда браузер читает адрес, раздела в документе
 * ещё нет — прыгать некуда, и человек остаётся наверху. Поэтому прокрутку
 * повторяем сами, уже после того, как всё отрисовано.
 *
 * Заодно обрабатываем нажатия по ссылкам вида #about: у SPA-роутера свои
 * представления о переходах, и без этого клик по пункту меню менял адрес,
 * но никуда не вёл.
 */
export function useHashScroll() {
    useEffect(() => {
        const scrollToHash = (hash, behavior) => {
            if (!hash || hash === '#') return;

            const target = document.querySelector(hash);
            if (!target) return;

            target.scrollIntoView({ behavior, block: 'start' });
        };

        // Первый заход по ссылке с якорем. Ждём кадр: до него верстка ещё
        // не разложена и координаты раздела будут неверными.
        const frame = requestAnimationFrame(() => {
            scrollToHash(window.location.hash, 'auto');
        });

        const onClick = (event) => {
            const link = event.target.closest('a[href^="#"]');
            if (!link) return;

            const hash = link.getAttribute('href');
            if (!hash || hash === '#') return;

            const target = document.querySelector(hash);
            if (!target) return;

            event.preventDefault();
            scrollToHash(hash, 'smooth');

            // Адрес меняем без записи в историю: иначе кнопка «назад»
            // начнёт отматывать по одному разделу вместо возврата на
            // предыдущую страницу.
            window.history.replaceState(null, '', hash);
        };

        document.addEventListener('click', onClick);

        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener('click', onClick);
        };
    }, []);
}
