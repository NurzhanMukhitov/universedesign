/*
 * Первый экран: раскрытое меню слева, логотип справа, куб по центру —
 * так же, как на боевом сайте, только пункты крупнее.
 *
 * Порядок разделов задан владельцем и отличается от боевого: сначала
 * рассказ о студии, потом технология, потом работы, потом контакты.
 */

const ITEMS = [
    { label: 'О нас', href: '#about' },
    { label: 'UNIVERSE × LedPulse', href: '#ledpulse' },
    { label: 'Проекты', href: '#projects' },
    { label: 'Контакты', href: '#contacts' },
];

export function Menu() {
    return (
        <div className="stage__inner">
            <div className="topbar">
                <nav className="nav" aria-label="Разделы">
                    <p className="lang">
                        <span className="lang__current">RU</span>
                        <span className="lang__sep"> / </span>
                        <a className="lang__other" href="/en/">
                            EN
                        </a>
                    </p>

                    <ul className="nav__list">
                        {ITEMS.map((item) => (
                            <li key={item.href}>
                                <a className="nav__link" href={item.href}>
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <p className="wordmark">
                    UNIVERSE
                    <span className="wordmark__sub">design</span>
                </p>
            </div>

            {/* Подсказка внизу: куб рассыпается от прокрутки, и об этом
                надо сказать — иначе человек уйдёт, не тронув страницу. */}
            <p className="scrollhint">Листайте вниз</p>
        </div>
    );
}
