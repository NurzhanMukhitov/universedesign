import { ledpulse } from '../lib/media.js';
import { Picture } from '../lib/Picture.jsx';

/*
 * UNIVERSE × LedPulse — раздел про технологию.
 *
 * Здесь кадры работают землёй, а не иллюстрацией: студия продаёт то, что
 * видно глазами, и рассказывать об этом одним текстом бессмысленно. Кадры
 * взяты с боевого сайта — те самые, где человек стоит у светящейся стены
 * и виден масштаб.
 *
 * Цифры — из баннеров студии. До сих пор они существовали только в пикселях:
 * ни поиск, ни переводчик, ни экранный диктор их не видели.
 */

const SPECS = [
    { label: 'Шаг нити', value: '5 см' },
    { label: 'Органический шаг', value: '2,5 см' },
    { label: 'Модуль', value: '500×500×3100 мм' },
    { label: 'Сборки', value: '9 · 12 · 16 · 36' },
];

export function LedPulse() {
    return (
        <section className="section section--ledpulse" id="ledpulse">
            {/* Кадр во весь экран, текст поверх: земля — изображение,
                а не цвет фона. */}
            <div className="hero-frame">
                <Picture
                    source={ledpulse.image3}
                    alt="Зрители у волюметрического LED-экрана Dragon O²"
                    className="hero-frame__media"
                    sizes="100vw"
                />

                <div className="hero-frame__text">
                    <p className="section__index">02 · UNIVERSE × LedPulse</p>
                    <h2 className="title">Официальный партнёр LedPulse в России</h2>
                    <p className="lede">
                        Как эксклюзивный партнёр одного из мировых лидеров
                        в производстве волюметрических LED-экранов, мы получаем
                        доступ к передовым разработкам и адаптируем их под
                        сложные проекты.
                    </p>
                </div>
            </div>

            <div className="section__inner">
                <h3 className="subtitle">Dragon O²</h3>
                <p className="lede">
                    Светодиодные нити расставлены не в плоскости, а в объёме.
                    Изображение остаётся трёхмерным с любой точки зала и без
                    очков — и именно поэтому его невозможно показать
                    фотографией.
                </p>

                <div className="spec">
                    {SPECS.map((item) => (
                        <div className="spec__cell" key={item.label}>
                            <p className="spec__label">{item.label}</p>
                            <p className="spec__value">{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Второй кадр — масштаб: человек рядом с экраном в полный рост. */}
            <div className="wide-frame">
                <Picture
                    source={ledpulse.image7}
                    alt="Модульный экран Dragon O² в полный рост рядом с человеком"
                    className="wide-frame__media"
                    sizes="100vw"
                />
            </div>
        </section>
    );
}
