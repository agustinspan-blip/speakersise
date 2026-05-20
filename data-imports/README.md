# Data imports

Carpeta de **staging**. Dejá acá un Excel con las specs + las imágenes del
parlante, y después pedime "importá los archivos de `data-imports`".

## Formato esperado

### 1. Excel (`.xlsx`) con las specs

Una fila por parlante. Las columnas pueden ir en cualquier orden y con
mayúsculas/minúsculas/acentos como te resulten cómodos — yo las parseo. Las
columnas que reconozco:

**Obligatorias**
- `Marca` / `Brand`
- `Modelo` / `Model`
- `Tipo` / `Type` — `bookshelf` o `floorstander`
- `Alto` / `Height` (mm)
- `Ancho` / `Width` (mm)
- `Profundidad` / `Depth` (mm)
- `Frecuencia mínima` (Hz) y `Frecuencia máxima` (Hz)
  (alternativamente una sola columna `Frecuencia` con formato `38–22000`)
- `Drivers` — texto libre, ej. `1× tweeter 28mm soft dome; 2× woofer 180mm MSP`
- `URL del producto` / `Source URL`

**Recomendadas**
- `Peso` / `Weight` (kg)
- `Tolerancia FR` (dB) — ej. `3` para ±3 dB
- `Sensibilidad` (dB)
- `Impedancia` (Ω) y `Impedancia mínima` (Ω)
- `Power handling` — ej. `50–250 W`
- `Power amp recomendado` — ej. `50–500 W`
- `Tipo de caja` / `Enclosure` — `bass-reflex-rear`, `bass-reflex-front`, `bass-reflex-down`, `sealed`, `passive-radiator`, `transmission-line`
- `Tuning del puerto` (Hz)
- `Año` / `Year`
- `Serie` / `Series` — ej. `Confidence`, `Reference`, `Heritage`
- `Power type` — `passive` (default) o `active`
- `Descripción ES` y `Descripción EN` — 2–3 oraciones cada una

**Si la marca es nueva**, agregá una segunda hoja llamada `Marca` (o `Brand`)
con una sola fila:
- `Marca`, `País` (ISO 3166-1 alpha-2 ej. `DK`), `Año fundación`, `Sitio web`
- `Color principal` (opcional, ej. `red`, `orange`, `stone-900`) para el tema
- `Descripción ES`, `Descripción EN`

### 2. Imágenes

Una o dos imágenes por parlante, en la misma carpeta:

- `<marca>-<modelo>-front.png` (o `.jpg`) — vista frontal pura, fondo blanco
  o transparente, parlante derecho, **sin stand si es bookshelf**
  (el comparador TrueScale necesita esta imagen para escala real).
- `<marca>-<modelo>-hero.png` (o `.jpg`) — opcional. Vista 3/4 / perspectiva
  para la página de detalle. Si no la pasás, uso el front.

Yo me encargo de:
- Recortar márgenes, hacer fondos transparentes si tienen blanco sólido
- Convertir formatos a PNG cuando hace falta
- Mover los archivos a `public/speakers/<id>-front.png` y `<id>-hero.png`

## Workflow típico

1. Dejá el Excel + las imágenes en `data-imports/`
2. Decime "importá data-imports"
3. Yo:
   - Leo el Excel (con la skill xlsx)
   - Creo un JSON por fila en `src/data/speakers/<id>.json`
   - Proceso y muevo las imágenes a `public/speakers/`
   - Si hay marca nueva, la registro en `src/lib/brands.ts` + i18n + tema
   - Corro `npx tsc --noEmit` y smoke-test las URLs nuevas
   - Te reporto: qué se importó, qué specs no pude verificar, qué imágenes
     necesitaron ajuste
4. Vos confirmás → vaciás la carpeta (o la dejo limpia yo)

## Ejemplo de fila Excel

| Marca | Modelo | Tipo | Alto | Ancho | Profundidad | Peso | Frec min | Frec max | Tol FR | Sensibilidad | Impedancia | Imp min | Power max | Drivers | Enclosure | URL |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KEF | R3 Meta | bookshelf | 422 | 200 | 335 | 12.5 | 38 | 50000 | 3 | 87 | 8 | 3.2 | 180 | 1× tweeter 25mm aluminium dome (Uni-Q with MAT); 1× midrange 125mm aluminium cone (Uni-Q); 1× woofer 165mm hybrid aluminium cone | bass-reflex-rear | https://us.kef.com/products/r3-meta-bookshelf-speaker |
