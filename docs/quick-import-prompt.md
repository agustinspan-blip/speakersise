# Prompt: import rápido cuando vos proveés imágenes + URLs

Usalo cuando ya tenés todo en mano y querés mínima fricción:

- Imágenes en `data-imports/<Marca>/` (por convención: una `*_Front.*` y
  una `*_2.*` o `*_Hero.*` por modelo, mismo prefijo del nombre del
  modelo).
- Una lista de URLs oficiales del fabricante en el orden de los modelos
  (o en un archivo `data-imports/<Marca>/urls.txt`, una URL por línea).

A diferencia de [`add-speakers-batch-prompt.md`](add-speakers-batch-prompt.md),
este flujo **no busca imágenes ni URLs**, **no pregunta entre modelos**, y
asume que vos ya validaste calidad/curaduría de las imágenes que dejaste.

---

```
Importá VARIOS parlantes al catálogo de TrueScale en una sola pasada.

INPUT:
- Carpeta: data-imports/<Marca>/
- URLs (una por modelo, en el mismo orden que las imágenes pareadas):
  <pegá acá>

Reglas globales:
- NO me preguntes confirmación entre modelos. Una sola gate antes de
  generar JSONs (después de scrapear specs e identificar imágenes), una
  sola al final con el reporte.
- NO busques imágenes ni URLs alternativas. Si una imagen falta o una URL
  está caída, anotalo en el reporte y seguí con el resto.
- Respetá las convenciones de docs/add-speaker-prompt.md (series sin
  sufijos, drivers con vocabulario controlado, powerHandlingW.min omitido
  cuando no se publica, hero con sufijo `-hero`, etc.).

──────────────────────────────────────────────────────────────────────
PASO 1 — Inventario y pareo (una sola pasada)
──────────────────────────────────────────────────────────────────────

1.1 Listá `data-imports/<Marca>/` con `ls`. Detectá las imágenes y
    pareás por prefijo de filename:
      <prefix>_Front.<ext>   → vista frontal pura (TrueScale)
      <prefix>_(2|Hero).<ext> → vista hero (3/4 o frontal con sombra)
    El `<prefix>` se asume que mapea 1:1 con un modelo en el orden de
    las URLs (ej. AURA1 ↔ aura-1). Si el matching no es obvio, mostrame
    la tabla y esperá confirmación.

1.2 En PARALELO (un solo mensaje con N WebFetch), traé las specs de cada
    URL. Extraé como mínimo:
      - model, series, generation, type, year (si aparece)
      - dimensions: heightMm, depthMm (con terminales), weightKg
      - drivers: role, sizeMm, quantity, material
      - enclosure (puerto y dirección — si la página no es clara, leé
        la imagen `_rear` del CDN del fabricante o el manual)
      - frequencyResponseHz {min, max} y toleranceDb
      - sensitivityDb, impedanceOhm, impedanceMinOhm
      - recommendedAmpW {min, max} (omitir min si no se publica)
      - powerHandlingW (omitir si no se publica)
      - priceUsd si aparece
      - description.en + description.es (2-3 oraciones, redactadas, no
        copiadas literal del marketing)

1.3 Detectá colisiones contra `ls src/data/speakers/`. Si un id ya
    existe, marcalo "EXISTE — saltear" en el plan.

1.4 Detectá si la marca está registrada:
      - Buscá en src/lib/brands.ts → BRAND_INFO.<Marca>.
      - Si NO existe: parate inmediatamente y pedíme:
          • Logo PNG/SVG (o confirmar que ya está en public/brands/)
          • País (ISO alpha-2) + bandera emoji
          • Año de fundación
          • Sitio web oficial
          • Color de tema (literal Tailwind, ej. "emerald-800")
          • Descripción ES + EN (2-3 oraciones)
        Una vez que te paso eso, agregalo a BRAND_LOGOS / BRAND_INFO /
        BRAND_THEMES y a las claves i18n brandDescriptions.<key>.

──────────────────────────────────────────────────────────────────────
PASO 2 — Confirmación única
──────────────────────────────────────────────────────────────────────

Mostrame UN solo bloque consolidado:

```
Plan de import — <Marca>:
┌─────────────────────┬──────────────┬──────────────────┬──────────┐
│ id                  │ tipo         │ H × W × D mm     │ Estado   │
├─────────────────────┼──────────────┼──────────────────┼──────────┤
│ wharfedale-aura-1   │ bookshelf    │ 386 × 249 × 352  │ NUEVO    │
│ wharfedale-aura-2   │ bookshelf    │ 560 × 289 × 402  │ NUEVO    │
│ wharfedale-aura-3   │ floorstander │ 1037 × 338 × 352 │ EXISTE ⏭ │
└─────────────────────┴──────────────┴──────────────────┴──────────┘

Imágenes pareadas:
  ✓ aura-1: AURA1_Front.webp + AURA1_2.webp
  ✓ aura-2: AURA2_Front.webp + AURA2_2.webp
  ⚠ aura-3: solo AURA3_Front.webp (falta hero) — uso front como hero

Marca: Wharfedale (ya registrada / nueva — pendiente metadata)

Datos faltantes detectados:
  - aura-2: powerHandlingW no publicado → omito el campo
  - aura-4: priceUsd no listado en el sitio oficial
```

Esperá un OK breve. Si decís "ok", ejecuto sin más interrupciones.

──────────────────────────────────────────────────────────────────────
PASO 3 — Procesamiento (una sola pasada, sin consultas)
──────────────────────────────────────────────────────────────────────

3.1 Imágenes: para CADA par, en bash:
    a. Detectá el color de fondo con
         magick identify -format '%[fx:int(255*p{0,0}.r)],%[fx:int(255*p{0,0}.g)],%[fx:int(255*p{0,0}.b)]'
       Si es ≈ blanco/gris-claro (todos los canales > 230 y diff entre
       canales < 8), usá ese color para hacer transparente.
    b. Convertí + trimeá + transparentá:
         magick "<input>" -alpha set -fuzz 10% -transparent "#<color>" -trim +repage "public/speakers/<id>-<role>.<ext>"
       (role = `front` o `hero`)
    c. Si no hay alpha factible (fondo no uniforme), trimeá sin
       transparencia y documentá en el reporte.

3.2 widthMm: calculalo a partir del aspect de la imagen frontal trimeada:
      widthMm = round(heightMm × imgWidth / imgHeight)
    Si difiere >15% del ancho oficial, sumá una nota en el reporte
    indicando "plinto más ancho que cabinet" (típico en floorstanders) —
    igual usá el valor calculado, así la silueta del comparador no se
    distorsiona.

3.3 JSONs: generá `src/data/speakers/<id>.json` para cada modelo,
    siguiendo EXACTAMENTE el shape del tipo `Speaker` (ver src/lib/types.ts).
    Convenciones críticas:
      - id = <brand-slug>-<model-slug>, lowercase, guiones
      - series sin sufijo "Series"/"Collection" (ver
        docs/add-speaker-prompt.md)
      - drivers: hyphen en compuestos ("wood-fibre cone"), espacio entre
        nombre y número ("Esotar 3"), incluir tipo cuando el material
        solo no lo describe ("MPD III planar ribbon")
      - powerHandlingW.min: omitir si no se publica
      - hero: /speakers/<id>-hero.<ext>
      - front: /speakers/<id>-front.<ext>

──────────────────────────────────────────────────────────────────────
PASO 4 — Verificación + reporte único
──────────────────────────────────────────────────────────────────────

4.1 `npx tsc --noEmit` — debe estar limpio.
4.2 Para cada nuevo id, en una sola pasada:
      curl -sL http://localhost:3000/en/speaker/<id> -o /dev/null -w "%{http_code} <id>\n"
4.3 Una request a la brand page para confirmar que aparecen:
      curl -sL "http://localhost:3000/en?brand=<Marca>"

4.4 Reporte FINAL en este formato exacto, en un solo mensaje:

```
✅ Importados (N):
   - wharfedale-aura-1   (Aura 1, bookshelf, 386 mm)
   - wharfedale-aura-2   (Aura 2, bookshelf, 560 mm)

⏭ Saltados:
   - wharfedale-aura-3   (id ya existía)

⚠ Datos faltantes / dudas:
   - aura-2: powerHandlingW omitido (no publicado)
   - aura-4: priceUsd ausente

🌐 HTTP:
   - 200 /en/speaker/wharfedale-aura-1
   - 200 /en/speaker/wharfedale-aura-2
   - 200 /en?brand=Wharfedale (ahora N parlantes)

Limpio: data-imports/Wharfedale/ — ¿lo vacío?
```

Esperá respuesta antes de borrar la carpeta.
```

---

## Notas para mantener este prompt

- Si las convenciones de imagen o JSON cambian, actualizá
  `docs/add-speaker-prompt.md` (es la fuente canónica) y este prompt
  solo si afectan el orden del flujo.
- Si las marcas empiezan a usar carpetas con muchos modelos por archivo
  (ej. ZIPs), agregá un paso 1.0 para descomprimir antes de inventariar.
- Si pegás directamente las URLs en el chat (no en un `urls.txt`), el
  prompt acepta ese modo sin cambios — el orden manda.
