/*
 * «О нас»: четыре тезиса вместо четырёх абзацев.
 *
 * Из букв разлетевшегося куба складывается короткая строка, которую читают
 * за секунду, — абзац на семь строк для этого не годится. Полный текст
 * никуда не девается, он остаётся на отдельной странице.
 *
 * Первый тезис здесь терминологический («Волюметрические экраны»), хотя
 * в брифе был образный: образный вариант уже работает заголовком первого
 * экрана, и повторять его через два раздела значило бы сказать одно и то же
 * дважды.
 */

const THESES = [
    {
        title: 'Волюметрические экраны',
        note: 'Светодиодные нити в объёме, а не в плоскости.',
    },
    {
        title: 'От замысла до монтажа',
        note: 'Концепция, 3D-визуализация, производство, контент.',
    },
    {
        title: 'Инженеры, программисты, художники',
        note: 'Одна команда на всю глубину задачи.',
    },
    {
        title: 'Зритель попадает внутрь работы',
        note: 'Сенсоры и генеративный контент: человек перестаёт быть наблюдателем.',
    },
];

export function About() {
    return (
        <section className="section" id="about">
            <div className="section__inner">
                <p className="section__index">03 · О студии</p>
                <h2 className="title">Что мы умеем</h2>

                <ol className="theses">
                    {THESES.map((thesis, index) => (
                        <li className="thesis" key={thesis.title}>
                            <span className="thesis__num">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="thesis__body">
                                <span className="thesis__title">
                                    {thesis.title}
                                </span>
                                <span className="thesis__note">
                                    {thesis.note}
                                </span>
                            </span>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
