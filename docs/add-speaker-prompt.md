# Prompt: agregar un parlante al catálogo

Copialo entero y reemplazá `<URL>` por el link a la página oficial del
producto (ej. `https://www.dali-speakers.com/en/products/kore/dali-kore/`).
Pegalo en una sesión nueva de Claude Code.

---

```
Agregá un nuevo parlante al catálogo de HiFi-Sise desde esta página oficial del fabricante:

URL: <URL>

Seguí este proceso:

1. **Scrape** la página con WebFetch y extraé las especificaciones reales —
   no inventes valores. Si algún dato no está, dejalo como `undefined`
   (campo opcional). Si el fabricante no publica un dato crítico (dimensiones,
   tipo de driver, respuesta en frecuencia), buscá en una segunda fuente
   (retailer reconocido como Crutchfield, What HiFi, manual oficial PDF) y
   citá la URL en un comentario al final del JSON.

2. **Imágenes** — esta es la parte más importante para que el comparador
   funcione bien. Necesitás DOS imágenes con propósitos distintos:

   **a) Imagen `hero` (decorativa)**
   - Vista 3/4 o frontal con sombra, lo que se vea más atractivo
   - Aparece en las cards del catálogo y como imagen grande en la página
     de detalle
   - Guardar en `/public/speakers/<id>-hero.jpg` o `<id>-hero.png`
     (siempre con sufijo `-hero` — sin sufijo es legacy, no lo uses)

   **b) Imagen `front` (CRÍTICA — debe ser una vista frontal pura)**
   - El parlante debe estar **perfectamente de frente, sin ángulo, sin
     perspectiva 3/4**. Esta imagen se renderiza a escala real en el
     comparador, así que cualquier rotación distorsiona la silueta.
   - Cómo verificar que es realmente frontal:
     • Los lados del cabinete deben ser invisibles (ancho = solo el
       frente)
     • Los drivers deben verse perfectamente circulares (no elípticos)
     • El plinto/footprint inferior se ve simétrico, sin uno de los
       costados expuesto
   - Guardar en `/public/speakers/<id>-front.png`

   **Estrategia para encontrar la imagen frontal pura:**

   1. **Listá TODAS las variantes de imagen del producto en la página
      oficial.** Ejecutá un curl + grep para extraer todas las URLs de
      imagen del producto:
      `curl -sL "<URL>" | grep -oE 'https?://[^"]*<modelo>[^"]*\.(png|jpg|webp)'`
      Buscá nombres con sufijos como `_front`, `_face`, `front_view`,
      `straight`, `plain`, o números de vista (`_01` suele ser frontal).
      Las marcas suelen tener varias vistas: 3/4 default, _front, _side,
      _rear, _cutthrough.

   2. **Si no hay vista frontal en el sitio del fabricante**, probá en
      orden:
      a. Hi-res image database de press kit del fabricante (suele estar
         en `/press`, `/media`, `/dealers`)
      b. Retailers premium que publican fotos planas de catálogo:
         Crutchfield, B&H, Audio Advice, World Wide Stereo, HiFi-Voice,
         Bay Bloor Radio
      c. Wikipedia / Wikimedia Commons si es un modelo emblemático
      d. Búsqueda inversa en Google Images con WebSearch:
         "<brand> <model> front view straight" o
         "<brand> <model> studio shot front"

   3. **Si después de las búsquedas anteriores NO hay vista frontal pura
      disponible**, frená y avisame con un mensaje claro:
      "No encontré una imagen frontal pura del <modelo>. Las opciones que
      vi son: <lista las que sí existen>. ¿Podés conseguirla vos o
      preferís que use la 3/4 como fallback?"
      No uses la 3/4 como front sin avisar — ensucia el comparador.

   **Después de descargar:**
   - Trimmeá los márgenes con ImageMagick:
     `magick <file> -fuzz 5% -trim +repage <file>`
     Para PNGs con fondo transparente:
     `magick <file> -channel A -threshold 50% +channel -trim +repage <file>`
   - Mostrame las DOS imágenes con la herramienta Read para que las
     verifique antes de seguir.
   - Cuando me las muestres, decime explícitamente:
     "Hero: [nombre archivo, vista 3/4/frontal con sombra/etc]
      Front: [nombre archivo, vista frontal pura, X×Y px, aspect Z]"
     Así reviso rápido sin tener que volver a abrir las imágenes.

3. **JSON**: creá `src/data/speakers/<id>.json` siguiendo EXACTAMENTE la
   estructura de un archivo existente como `dali-rubicon-2.json` o
   `monitor-audio-bronze-50-7g.json`. No agregues ni renombres campos —
   el tipo `Speaker` está en `src/lib/types.ts`.

   Convenciones obligatorias:
   - `id`: `<brand-slug>-<model-slug>` todo minúscula con guiones, ej.
     `dali-oberon-3` o `monitor-audio-platinum-100-3g`. Tiene que coincidir
     con el nombre del archivo JSON.
   - `brand`: tal como aparece en otros archivos (`"Monitor Audio"` o
     `"Dali"` con D mayúscula nada más). Si es una marca nueva, avisame
     para agregarla a `BRAND_LOGOS` y `BRAND_INFO` en `src/lib/brands.ts`.
   - `model`: el modelo solo, sin la marca (ej. `"Rubicon 6"`).
   - `generation`: la generación si aplica (ej. `"7G"`, `"6G"`, `"3G"`).
     Si no hay, omitilo.
   - `series`: la línea o familia tal como la nombra el fabricante, **sin
     sufijos descriptivos** como `"Series"`, `"Collection"` o el sufijo de
     generación (ej. `"Bronze"` no `"Bronze Series"`, `"Heritage"` no
     `"Heritage Collection"`, `"Contour"` no `"Contour i"`). El sufijo de
     generación va en `generation`.
   - `type`: `"bookshelf"` (estantería) o `"floorstander"` (de piso).
   - `powerType`: `"passive"` salvo que el fabricante explícitamente diga
     que es activo/powered.
   - `dimensions`:
     - `heightMm`, `depthMm`, `weightKg`: usar los valores oficiales del
       fabricante (con plinto/spikes incluidos).
     - `widthMm`: **NO uses ciegamente el ancho de la spec sheet.**
       Calculalo a partir del aspect de la imagen frontal trimeada:
       `widthMm = round(heightMm × (imgWidth / imgHeight))`
       Esto evita que la imagen se distorsione al renderizarse con
       `objectFit: fill` en el comparador. Si el resultado difiere mucho
       (>15%) del ancho oficial, es señal de que la imagen tiene shadow
       o plinth extendido — informalo en un comentario al final del JSON.
   - `drivers`: array; cada uno con `role`
     (`"tweeter"|"super-tweeter"|"midrange"|"mid-bass"|"woofer"`),
     `sizeMm` (numérico, 0 si es ribbon/AMT sin diámetro), `quantity`
     (default 1), `material` opcional como string.
     Convenciones de `material`:
     - **Hyphenate compuestos**: `"wood-fibre cone"` (no `"wood fibre cone"`),
       `"glass-fibre matrix cone"`, `"C-CAM RST II"`.
     - **Mantené espacio entre nombre propio y número**: `"Esotar 3"` (no
       `"Esotar3"`), `"Esotar 2i"`, `"MPD III"`, `"RDT III"`.
     - **Incluí el tipo de transductor cuando el nombre solo no lo describe**:
       `"MPD III planar ribbon"` (no `"MPD III"` solo), `"RDT III C-CAM"`,
       `"Esotar 3 soft dome"`. Si el `material` ya describe el tipo, no
       hace falta repetirlo.
   - `enclosure`: `"sealed" | "bass-reflex-rear" | "bass-reflex-front" |
     "bass-reflex-down" | "passive-radiator" | "transmission-line"`.
     Si la página oficial no lo deja claro, descargá la imagen trasera
     (`_rear` en el CDN del fabricante) para confirmar dónde están los
     puertos.
   - `frequencyResponseHz`: `{ min, max }`. Si el fabricante da varios
     valores (-3dB y -6dB), usá el más conservador (-3dB) y poné la
     tolerancia en `frequencyResponseToleranceDb`.
   - `sensitivityDb`, `impedanceOhm`, `impedanceMinOhm`,
     `powerHandlingW`, `recommendedAmpW`, `priceUsd` — todos opcionales.
     Para `powerHandlingW` y `recommendedAmpW`, `min` también es opcional:
     **omití `min` cuando el fabricante no lo publica**, no uses `0` como
     placeholder. Ej: `"powerHandlingW": { "max": 250 }` si solo hay máximo.
   - `sourceUrl`: la URL exacta de la página oficial del producto.

4. **Verificación**: después de crear el JSON, levantá el dev server si no
   está corriendo y abrí la página de catálogo. Confirmá que:
   - El nuevo parlante aparece en la home y en su brand page
   - La página individual `/[locale]/speaker/<id>` se renderiza sin 404
   - En el comparador (`/compare?a=<id>&b=<otro>`) la silueta aparece
     simétrica, vertical, con drivers circulares (no elípticos) — esto
     confirma que la vista frontal es realmente frontal y el `widthMm`
     coincide con el aspect de la imagen.

Antes de comenzar, mostrame un resumen de lo que vas a hacer (modelo,
marca, tipo, dimensiones aproximadas) y esperá mi confirmación antes de
crear archivos.
```

---

## Notas para mantener este prompt

- Si agregás campos nuevos al tipo `Speaker` (en `src/lib/types.ts`),
  acordate de actualizar la sección "Convenciones obligatorias" arriba.
- Si encontrás un patrón nuevo de manufacturer URL/CDN que vale la pena
  para futuras búsquedas, sumalo a la lista de retailers en el paso 2.
- Si la convención de `widthMm` (aspect de imagen vs spec real) cambia,
  acordate de revisar también `dali-oberon-7.json` y `dali-kore.json`,
  que ya usan ese patrón.
