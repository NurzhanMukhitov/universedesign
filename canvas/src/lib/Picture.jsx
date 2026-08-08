/*
 * Тег <picture> из того, что отдаёт vite-imagetools.
 *
 * Вынесен отдельно, потому что нужен в трёх разделах, а форма объекта
 * у imagetools своя: sources по форматам плюс img с размерами. Держать
 * эту форму в трёх местах значило бы трижды её и чинить.
 */
export function Picture({ source, alt, className, loading = 'lazy', sizes }) {
    if (!source) return null;

    return (
        <picture className={className}>
            {source.sources?.avif && (
                <source srcSet={source.sources.avif} sizes={sizes} type="image/avif" />
            )}
            {source.sources?.webp && (
                <source srcSet={source.sources.webp} sizes={sizes} type="image/webp" />
            )}
            <img
                src={source.img?.src}
                width={source.img?.w}
                height={source.img?.h}
                alt={alt}
                loading={loading}
                decoding="async"
            />
        </picture>
    );
}
