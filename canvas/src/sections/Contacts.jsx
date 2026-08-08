import { forwardRef } from 'react';

/*
 * Контакты — конец полотна и место, где куб собирается обратно: петля
 * закрывается там же, где открылась.
 *
 * Telegram стоит первым намеренно. У event-аудитории вся переписка идёт там,
 * и требовать от продюсера письма в разгар подготовки площадки — значит
 * получить ответ через неделю.
 *
 * Ref нужен снаружи: по положению этой секции считается обратная сборка куба.
 */

const PEOPLE = [
    {
        name: 'Юрий Хоцинский',
        telegram: 'yurahoc',
        phone: '+7 926 824 0607',
        mail: 'y.khotsinskiy@universe-design.com',
    },
    {
        name: 'Дмитрий Хоцинский',
        telegram: 'dimahoc',
        phone: '+7 926 916 9386',
        mail: 'd.khotsinskiy@universe-design.com',
    },
];

/** Телефон для tel: — без пробелов, иначе часть набирается не полностью. */
const dial = (phone) => phone.replace(/[^\d+]/g, '');

export const Contacts = forwardRef(function Contacts(_props, ref) {
    return (
        <section className="section section--contacts" id="contacts" ref={ref}>
            <div className="section__inner">
                <p className="section__index">04 · Контакты</p>

                {/* Приглашение перед контактами: человеку проще написать,
                    когда сказано, что писать. */}
                <h2 className="title">
                    Расскажите про площадку, сроки и задачу
                </h2>
                <p className="lede">
                    Ответим, что из этого делается и сколько занимает.
                    Быстрее всего — в Telegram.
                </p>

                <ul className="people">
                    {PEOPLE.map((person) => (
                        <li className="person" key={person.telegram}>
                            <p className="person__name">{person.name}</p>

                            <a
                                className="person__link person__link--first"
                                href={`https://t.me/${person.telegram}`}
                            >
                                @{person.telegram}
                            </a>
                            <a
                                className="person__link"
                                href={`tel:${dial(person.phone)}`}
                            >
                                {person.phone}
                            </a>
                            <a
                                className="person__link"
                                href={`mailto:${person.mail}`}
                            >
                                {person.mail}
                            </a>
                        </li>
                    ))}
                </ul>

                <div className="studio">
                    <p className="spec__label">Студия</p>
                    <p className="studio__address">
                        127015, Москва, Большая Новодмитровская улица, 23
                    </p>
                    <a
                        className="person__link"
                        href="https://t.me/universe_design_studio"
                    >
                        @universe_design_studio
                    </a>
                </div>
            </div>
        </section>
    );
});
