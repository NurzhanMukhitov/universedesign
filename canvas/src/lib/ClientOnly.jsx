import { useEffect, useState } from 'react';

/*
 * Не пускает содержимое в пререндер.
 *
 * Сборка гоняет приложение через renderToString в Node, где WebGL нет вообще.
 * Если <Canvas> попадёт в это дерево, сборка либо упадёт, либо запишет в HTML
 * мусор. Обёртка выключает такие поддеревья дважды: сначала проверкой window
 * (в Node его нет), потом флагом, который поднимается только после первого
 * useEffect — то есть уже в браузере, после гидратации.
 *
 * Двойная защита нужна потому, что одной проверки window мало: на клиенте
 * первый проход гидратации обязан совпасть с тем, что отдал сервер, иначе
 * React ругается на рассинхрон разметки.
 *
 * Побочная выгода: в пререндеренном HTML остаётся чистый текстовый слой —
 * ровно то, что читают поисковики и AI-краулеры.
 */
export function ClientOnly({ children, fallback = null }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (typeof window === 'undefined' || !mounted) return fallback;

    return children;
}
