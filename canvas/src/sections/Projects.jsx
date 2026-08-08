import { Link } from 'react-router';

import data from '../data/projects.json';
import { projectCover } from '../lib/media.js';

/*
 * Лента проектов.
 *
 * Горизонтальная, с нативной прокруткой: на телефоне это обычный свайп,
 * который система уже умеет, а на десктопе работает колесо и клавиатура.
 * scroll-snap не ставим — по ТЗ полотно должно течь, а не щёлкать.
 *
 * Под каждым кадром служебная строка: индекс, год, город. Всё моноширинным,
 * как во всей «Спецификации»: если это данные — они набраны моно.
 */

/** Год или прочерк. Даты, которых студия не подтвердила, не выдумываем. */
function yearOf(project) {
    return project.year ?? '—';
}

function Card({ slug, project, index }) {
    const cover = projectCover(slug);
    const number = String(index + 1).padStart(2, '0');

    return (
        <li className="tape__item">
            <Link to={`/projects/${slug}`} className="card">
                <div className="card__frame">
                    {cover ? (
                        <picture>
                            {cover.sources?.avif && (
                                <source
                                    srcSet={cover.sources.avif}
                                    type="image/avif"
                                />
                            )}
                            {cover.sources?.webp && (
                                <source
                                    srcSet={cover.sources.webp}
                                    type="image/webp"
                                />
                            )}
                            <img
                                src={cover.img?.src}
                                width={cover.img?.w}
                                height={cover.img?.h}
                                alt={`${project.title} — обложка проекта`}
                                loading="lazy"
                                decoding="async"
                            />
                        </picture>
                    ) : null}

                    <span className="card__index">{number}</span>
                </div>

                <p className="card__title">{project.title}</p>

                <p className="card__meta">
                    <span>{yearOf(project)}</span>
                    <span>{project.city?.ru}</span>
                </p>
            </Link>
        </li>
    );
}

export function Projects() {
    return (
        <section className="section" id="projects">
            <div className="section__inner">
                <p className="section__index">02 · Проекты</p>
                <h2 className="title">Что мы собрали</h2>
            </div>

            {/*
             * Лента вынесена из колонки текста и идёт от края экрана:
             * кадры должны уходить за границу, иначе не видно, что список
             * продолжается.
             */}
            <ul className="tape">
                {data.order.map((slug, index) => (
                    <Card
                        key={slug}
                        slug={slug}
                        project={data.projects[slug]}
                        index={index}
                    />
                ))}
            </ul>
        </section>
    );
}
