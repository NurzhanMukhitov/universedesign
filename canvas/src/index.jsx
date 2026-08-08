import { createRoot, hydrateRoot } from 'react-dom/client';

import { Root } from './Root.jsx';
import './style.css';

/*
 * Клиентский вход. Ничего серверного здесь быть не должно.
 *
 * Функция prerender живёт в соседнем prerender.jsx: когда она лежала в этом
 * файле, её код попадал в браузерный бандл и тянул за собой ленивые ссылки
 * на renderToString — 400 КБ, которые никогда не выполнятся.
 */
const target = document.getElementById('root');

// В dev-режиме пререндеренного HTML нет, гидрировать нечего.
import.meta.env.DEV
    ? createRoot(target).render(<Root />)
    : hydrateRoot(target, <Root />);
