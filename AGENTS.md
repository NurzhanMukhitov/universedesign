# Контекст проекта UNIVERSE DESIGN

## Что это за проект
- Статический сайт-портфолио студии `UNIVERSE DESIGN`.
- Технологии: чистые `HTML/CSS/JavaScript` (без фреймворков).
- Хостинг: GitHub Pages, домен задается через `CNAME`.

## Ключевая структура
- Главная: `index.html` + `script.js` (интерактивный куб, меню, overlay).
- Список проектов: `projects.html`.
- Страница о студии: `about.html`.
- Общие стили: `style.css`.
- Стили страниц проектов: `projects/projects.css`.
- Каждая страница проекта: `projects/<slug>.html`.
- Медиа проекта: `projects/<slug>/covers/cover.jpg` и `projects/<slug>/gallery/*`.
- Логика полноэкранной галереи проектов: `projects/project-gallery.js`.
- Обнаружение поисковиками и AI-агентами: `robots.txt` и `sitemap.xml` в корне.

## Как обычно добавлять новый проект
1. Создать папку `projects/<slug>/` с:
   - `covers/cover.jpg`
   - `gallery/` с файлами `image*.jpg/png` и `gif*.gif` (без пробелов/кириллицы в именах).
2. Создать страницу `projects/<slug>.html` по шаблону существующих проектов.
   Обязательный минимум в `<head>`: `<link rel="canonical">`, `<meta name="description">`,
   блок Open Graph/Twitter, JSON-LD. Скопировать целиком с соседней страницы проекта
   и заменить URL, описание и `og:image` на обложку нового проекта.
3. Добавить карточку проекта в `projects.html`:
   - блок в сетке карточек;
   - запись в JSON-LD (`itemListElement`).
4. **Дописать URL страницы в `sitemap.xml`.** Сборки нет, файл статический — сам он не обновится.
   Если в имени файла есть кириллица, URL percent-энкодить (пример: `UNIVERSE%D1%85LedPulse.html`).
5. Проверить мобильную и десктопную верстку (особенно GIF и iframe-видео).

## Важные практики для правок
- `.DS_Store` закрыт в `.gitignore` — руками ничего делать не нужно.
- Перед коммитом проверять `git status` и состав staged-файлов.
- Если есть файл `README.md` локально, проверять необходимость его добавления в релиз отдельно.
- Для Vimeo/YouTube учитывать, что базовые контейнеры в `projects/projects.css` ориентированы на `16:9`; портретные видео требуют отдельного класса/медиа-правила.

## Текущее состояние (на август 2026)
- Добавлен проект `ECHO 2.0` (март 2026):
  - `projects/echo_2.0.html`
  - `projects/echo_2.0/covers/cover.jpg`
  - `projects/echo_2.0/gallery/*`
  - карточка и JSON-LD запись в `projects.html`
- Пройден слой agent-readiness / SEO (август 2026):
  - создан `robots.txt` — все AI-краулеры разрешены, есть `Content-Signal`;
  - создан `sitemap.xml` со всеми 9 страницами;
  - `canonical`, `meta description`, Open Graph и Twitter Card добавлены на все 9 страниц;
  - удалена папка `backup_json_ld_20250510/` (дубли контента, восстановима из коммита `1f26573`);
  - добавлен `.gitignore`, `.DS_Store` убраны из индекса.

## Чего на этом хостинге сделать нельзя
GitHub Pages отдаёт статику и не позволяет задавать свои HTTP-заголовки
и делать content negotiation. Поэтому недоступны:
- `Link`-заголовки (RFC 8288) — нужен прокси вроде Cloudflare;
- Markdown negotiation по `Accept: text/markdown` — то же самое.

Домен сейчас смотрит прямо на GitHub Pages (NS у reg.ru, A-записи `185.199.108–111.153`).
Если понадобится — это отдельная задача по переносу NS на Cloudflare.
