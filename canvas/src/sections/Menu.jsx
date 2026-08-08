import { wordmarkUrl } from '../lib/media.js';

/*
 * Первый экран: раскрытое меню слева, логотип справа, куб по центру —
 * так же, как на боевом сайте, только пункты крупнее.
 *
 * Порядок разделов задан владельцем и отличается от боевого: сначала
 * рассказ о студии, потом технология, потом работы, потом контакты.
 */

/*
 * Написание пунктов взято с боевого сайта дословно: капс стоит в самом
 * тексте, а не в стилях, и «UNIVERSE х LedPulse» набран смешанным
 * регистром с кириллической «х» — так же, как называется папка проекта.
 */
const ITEMS = [
    { label: 'О НАС', href: '#about' },
    { label: 'UNIVERSE х LedPulse', href: '#ledpulse' },
    { label: 'ПРОЕКТЫ', href: '#projects' },
    { label: 'КОНТАКТЫ', href: '#contacts' },
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

                {/* Настоящий логотип студии, а не набранный шрифтом:
                    начертание авторское, имитация выдаёт себя расстояниями
                    между буквами. */}
                <a className="wordmark" href="/" aria-label="UNIVERSE DESIGN, на главную">
                    <img src={wordmarkUrl} alt="" width="220" height="55" />
                </a>
            </div>

            {/* Подсказка внизу: куб рассыпается от прокрутки, и об этом
                надо сказать — иначе человек уйдёт, не тронув страницу. */}
            <p className="scrollhint">Листайте вниз</p>
        </div>
    );
}
