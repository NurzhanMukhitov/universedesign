import { BrowserRouter, StaticRouter } from 'react-router';

import { App } from './App.jsx';

/*
 * Корень дерева, общий для браузера и для сборки.
 *
 * В браузере роутер обычный, в Node — статический: во время пререндера нет ни
 * history, ни location, и BrowserRouter там просто не запустится.
 */
export function Root({ url }) {
    const Router = typeof window !== 'undefined' ? BrowserRouter : StaticRouter;

    return (
        <Router location={url}>
            <App />
        </Router>
    );
}
