# Prompt: agregar VARIOS parlantes del mismo fabricante en una pasada

Útil cuando querés cargar una serie completa (ej. todos los Oberon, o
los floorstanders de la línea Silver 7G de Monitor Audio) sin tener que
correr el prompt individual una y otra vez.

Aceptá uno de los dos modos en `INPUT`:

- **Modo A (lista explícita)** — si ya tenés las URLs de cada producto:

  ```
  INPUT:
  - https://www.dali-speakers.com/en/products/oberon/oberon-1/
  - https://www.dali-speakers.com/en/products/oberon/oberon-3/
  - https://www.dali-speakers.com/en/products/oberon/oberon-5/
  ```

- **Modo B (página-índice)** — si querés que descubra los modelos a
  partir de una página de la serie:

  ```
  INPUT:
  https://www.dali-speakers.com/en/products/oberon/
  ```

Pegalo entero en una sesión nueva.

---

```
Agregá VARIOS parlantes al catálogo de HiFi-Sise siguiendo el mismo
pipeline que el prompt individual (`docs/add-speaker-prompt.md`), pero en
batch.

INPUT:
<pegá acá una lista de URLs de productos individuales O una sola URL de
una página de serie/línea del fabricante>

Seguí este proceso:

──────────────────────────────────────────────────────────────────────
FASE 1 — Descubrimiento y plan
──────────────────────────────────────────────────────────────────────

1.1 Normalizá el input:
    - Si recibiste varias URLs, una por modelo → la lista ya está.
    - Si recibiste UNA URL que es una página de serie/categoría →
      hacé WebFetch a esa URL y extraé los links a las páginas
      individuales de cada producto. Filtrá: solo modelos que sean
      parlantes pasivos/activos (no subwoofers, soundbars, accesorios)
      a menos que el usuario haya pedido lo contrario.
    - Si tenés dudas sobre cuáles son productos vs accesorios,
      mostrame la lista y esperá confirmación.

1.2 Para cada URL del lote, en PARALELO (un solo mensaje con N llamadas
    a WebFetch), extraé las specs clave:
      • model + series + generation
      • type (bookshelf | floorstander)
      • dimensions (heightMm, widthMm, depthMm, weightKg)
      • drivers (cantidad y tipo)
      • frequencyResponseHz {min, max}
      • sensitivityDb, impedanceOhm
      • priceUsd si está
    Si algún dato crítico falta (dimensiones, drivers, FR), agregá la
    URL de la fuente secundaria al lado del modelo. No ejecutes una
    búsqueda secundaria hasta tener la lista completa de la fase 1.

1.3 Detectá colisiones contra el catálogo actual:
      `ls src/data/speakers/`
    Si el `<id>` calculado para un modelo nuevo ya existe, marcalo en
    el plan como "EXISTENTE — saltear" (no lo sobrescribas salvo que
    el usuario lo pida explícitamente).

1.4 Mostrame un PLAN consolidado en formato tabla, una fila por modelo:

    | id           | brand | model      | type         | H × W × D mm    | Estado     |
    |--------------|-------|------------|--------------|-----------------|------------|
    | dali-kore    | Dali  | Kore       | floorstander | 1675 × 514 × 593| EXISTENTE  |
    | dali-epikore-11 | Dali | Epikore 11 | floorstander | 1620 × 380 × 540 | NUEVO     |
    ...

    Marcá los datos faltantes con un `?` y la fuente que vas a usar
    para completarlos. Esperá mi confirmación antes de pasar a la
    Fase 2.

──────────────────────────────────────────────────────────────────────
FASE 2 — Imágenes (la parte crítica)
──────────────────────────────────────────────────────────────────────

Para cada modelo confirmado, conseguí DOS imágenes — `hero` y `front` —
siguiendo las MISMAS reglas que el prompt individual:

  - **hero**: vista 3/4 o frontal con sombra, decorativa
  - **front**: vista frontal pura (drivers circulares, lados invisibles,
    plinto simétrico) — crítica para el comparador

Estrategia eficiente para batch:

2.1 **Listá TODAS las imágenes de TODOS los productos en una sola
    pasada por la página de cada producto.** Generalmente las
    marcas siguen un patrón consistente dentro de una serie:

    Ejemplo DALI:
      `KORE_ammara_ebony.png`         ← 3/4 default (hero)
      `KORE_ammara_ebony_front.png`   ← frontal pura (front)
      `KORE_ammara_ebony_rear_01.png` ← trasera (verificar enclosure)
      `OBERON_3_walnut.png`           ← mismo patrón pero otro modelo
      `OBERON_3_walnut_front.png`

    Detectá el patrón en el primer modelo y reutilizalo para los
    demás del lote.

2.2 Descargá las imágenes en paralelo (un solo mensaje con N curls
    en background o en serie con `&&` si son rápidos).

2.3 Trimmeá cada par con ImageMagick (`-channel A -threshold 50%
    +channel -trim` para PNGs transparentes).

2.4 Mostrame las imágenes de TODOS los modelos en un solo mensaje,
    con un resumen tipo:

    ```
    [hero image] dali-oberon-3        (3/4 view, walnut, 540×850 px)
    [front image] dali-oberon-3-front (frontal pura, 410×850 px, aspect 0.482)
    [hero image] dali-oberon-5        (...)
    [front image] dali-oberon-5-front (...)
    ```

    Si algún modelo NO TIENE vista frontal pura disponible (ni en el
    sitio del fabricante ni en retailers conocidos: Crutchfield, B&H,
    Audio Advice, Bay Bloor Radio, etc.), NO LO OMITAS silenciosamente
    — listame al final del mensaje:

    ```
    ⚠ Faltan imágenes frontales puras para:
      - dali-rubicon-8: solo encontré 3/4
      - dali-epicon-9: la página oficial está caída
    ```

    y preguntame si lo dejamos pendiente, si te paso las imágenes vos,
    o si uso 3/4 como fallback (esto último ensucia el comparador,
    avisar siempre).

2.5 Esperá mi OK sobre las imágenes antes de generar JSONs.

──────────────────────────────────────────────────────────────────────
FASE 3 — Generación de JSONs
──────────────────────────────────────────────────────────────────────

3.1 Por cada modelo confirmado, creá `src/data/speakers/<id>.json`
    siguiendo EXACTAMENTE las convenciones del prompt individual:

    - id = `<brand-slug>-<model-slug>` (lowercase, guiones, debe
      coincidir con el nombre del archivo)
    - widthMm = round(heightMm × imgWidth / imgHeight) — calculado
      a partir del aspect de la imagen FRONTAL trimeada, no del
      ancho oficial
    - dimensions, drivers, enclosure, frequencyResponseHz,
      frequencyResponseToleranceDb, sensitivityDb, impedanceOhm,
      powerHandlingW, recommendedAmpW, priceUsd, images, sourceUrl
    - Si la marca es NUEVA (no aparece en `src/lib/brands.ts`),
      avisame ANTES de crear los JSONs para sumar `BRAND_LOGOS` y
      `BRAND_INFO` primero.

3.2 Si en la fase 2 quedó algún modelo SIN imagen frontal y decidiste
    no agregarlo, no generes su JSON. Listalo al final del reporte.

──────────────────────────────────────────────────────────────────────
FASE 4 — Verificación consolidada
──────────────────────────────────────────────────────────────────────

4.1 Levantá el dev server si no está corriendo.

4.2 Por cada modelo nuevo que agregaste, hacé un curl:
      `curl -sL http://localhost:3000/en/speaker/<id> -o /dev/null -w "%{http_code}\n"`
    Verificá que todos devuelvan 200.

4.3 Hacé un curl al brand page del fabricante y verificá que aparecen
    los nuevos modelos en el listado.

4.4 Mostrame un REPORTE FINAL con esta forma:

    ```
    ✅ Agregados (N):
       - dali-oberon-3   (Oberon 3, bookshelf, 350×195×237 mm)
       - dali-oberon-5   (Oberon 5, floorstander, ...)
       - ...

    ⏸ Pendientes / no agregados:
       - dali-rubicon-8: faltó imagen frontal
       - ...

    🌐 Verificación HTTP:
       - 200 /en/speaker/dali-oberon-3
       - 200 /en/speaker/dali-oberon-5
       - 200 /en?brand=Dali  (lista X parlantes ahora)
    ```

──────────────────────────────────────────────────────────────────────
Reglas generales del batch
──────────────────────────────────────────────────────────────────────

- Paralelizá agresivamente Fase 1 (WebFetch) y Fase 2 (curl): un solo
  mensaje con N llamadas en lugar de N mensajes.
- NO me pidas confirmación entre modelos individuales — pedímela en
  bloque (después de Fase 1, después de Fase 2).
- Si UN modelo del lote falla (404 oficial, datos imposibles de
  conseguir, imagen frontal no disponible), anotalo y SEGUÍ con el
  resto. Reportalo al final, no abortes todo el lote.
- Si la marca es nueva y no está en `BRAND_LOGOS` / `BRAND_INFO`, frená
  inmediatamente y pedíme el flag del país, descripción breve, año de
  fundación y un PNG/SVG del logo. Luego seguís con el lote.
```

---

## Notas para mantener este prompt

- Si la convención de imágenes (`<id>-hero.png` / `<id>-front.png`) cambia,
  actualizar también el prompt individual para mantenerlos en sync.
- Si aparecen marcas con más de 2 vistas relevantes (ej. side, top), el
  campo `images` en el tipo `Speaker` ya soporta `side` y `top` — el
  prompt debería sumarlos como pasos opcionales.
- Si el dev server tiene un costo grande para verificación (ej. una vez
  ya tenemos 50+ parlantes), considerar reemplazar la verificación HTTP
  por un script `node` que importe `getAllSpeakers()` y valide el
  schema sin levantar Next.
