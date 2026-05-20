# Checklist: sumar una marca nueva a SpeakerSise

Imprimible. Una página. Tildá cada paso mientras avanzás.

---

## 1. Antes de empezar — recolectar inputs

- [ ] **Nombre exacto de la marca** tal como la marca lo escribe (ej. `Bowers & Wilkins`, no `B&W`)
- [ ] **Sitio oficial** del fabricante (URL raíz)
- [ ] **País de origen** — código ISO 3166-1 alpha-2 (ej. `DK`, `UK`, `DE`, `US`)
- [ ] **Año de fundación**
- [ ] **Logo** en PNG o SVG con fondo transparente
  - [ ] Si es wordmark monocromo: una versión sirve para light + dark mode
  - [ ] Si es multicolor (rojo, azul, etc.): bajalo tal cual, decidime si querés que se invierta en dark mode
- [ ] **Color principal** de la marca (opcional, ej. `red`, `#c8102e`, `stone-900`)
- [ ] **Descripción corta** en español (1-2 oraciones, no marketing puro — quién son, qué hacen)
- [ ] **Descripción corta** en inglés
- [ ] **Lista de modelos** que querés sumar de arranque (mínimo 1, ideal 3-5)

## 2. Preparar el Excel de parlantes

Una fila por modelo. Columnas con cualquier mayúscula/acento; el orden no importa.

**Obligatorias por fila**

- [ ] `Marca`, `Modelo`, `Tipo` (bookshelf / floorstander)
- [ ] `Alto`, `Ancho`, `Profundidad` (en mm — sin parlante en stand para bookshelf)
- [ ] `Frecuencia mínima` y `Frecuencia máxima` en Hz
- [ ] `Drivers` — texto libre, ej. `1× tweeter 25mm dome; 2× woofer 165mm aluminium`
- [ ] `URL del producto` en el sitio oficial

**Muy recomendadas**

- [ ] `Peso` (kg), `Tolerancia FR` (dB), `Sensibilidad` (dB), `Impedancia` (Ω)
- [ ] `Power handling` (ej. `50–200 W`), `Enclosure` (ej. `bass-reflex-rear`, `sealed`)
- [ ] `Serie` (ej. `800 Diamond`, `Reference`), `Año`
- [ ] `Descripción ES` y `Descripción EN` por modelo (2-3 oraciones)

**Hoja extra `Marca`** en el mismo .xlsx con una sola fila:

- [ ] `Marca`, `País`, `Año fundación`, `Sitio web`, `Color principal`, `Descripción ES`, `Descripción EN`

## 3. Preparar las imágenes

Una carpeta dentro de `data-imports/` o sueltas en `data-imports/`.

Por cada modelo:

- [ ] `<marca>-<modelo>-front.png` — vista frontal pura, parlante **derecho**, fondo blanco o transparente, **sin grilla y sin stand** si es bookshelf (importante: el comparador usa esta imagen para escala real)
- [ ] `<marca>-<modelo>-hero.png` *(opcional)* — vista 3/4 o de perspectiva para la página de detalle

Logo de la marca:

- [ ] `<marca>-logo.png` o `.svg` — fondo transparente, alta resolución

## 4. Disparar la importación

- [ ] Verificar que `data-imports/` tenga: el `.xlsx` + todas las imágenes + el logo
- [ ] Abrir Claude en este directorio: `claude` en la terminal dentro de `SpeakerSise/`
- [ ] Decir: **"importá data-imports"**
- [ ] Claude va a:
  - Parsear el Excel y crear un JSON por parlante en `src/data/speakers/`
  - Procesar imágenes (recortar, transparencia) y moverlas a `public/speakers/`
  - Registrar la marca nueva en `src/lib/brands.ts`
  - Agregar strings i18n en `src/locales/en.json` y `es.json`
  - Mover el logo a `public/brands/`
  - Correr `npm run build` para verificar
  - Reportarte: importado, dudas de specs, ajustes a imágenes

## 5. Revisar antes de hacer commit

- [ ] **Visual**: `npm run dev` y abrir `http://localhost:3000/es` — ¿aparece la marca? ¿se ve bien el logo en light y dark mode?
- [ ] **Detalle**: entrar a un parlante de la marca nueva — ¿specs completas? ¿descripción en ambos idiomas? ¿imagen front sin recortes raros?
- [ ] **Comparador**: ir a `/compare`, elegir un parlante de la marca nueva y otro de Monitor Audio o Dali — ¿las escalas se ven proporcionales?
- [ ] **Brand strip**: bajar al pie de la home — ¿el logo nuevo aparece en la tira inferior?

## 6. Deploy

- [ ] `git status` — revisar archivos cambiados (debería haber: nuevos JSON, nuevas imágenes, edits a `brands.ts` y `locales/*.json`)
- [ ] Para tandas grandes, trabajar en rama:
  ```
  git checkout -b add-<marca>
  git add src/data/speakers public/speakers public/brands src/lib/brands.ts src/locales
  git commit -m "Add <marca>: <N> speakers"
  git push -u origin add-<marca>
  ```
- [ ] Vercel genera **preview URL** automática: revisar ahí antes de mergear
- [ ] Si todo bien: merge a `main` → deploy a producción (~2-4 min)
- [ ] Para tandas chicas (1-2 parlantes), commit directo a `main` funciona igual

## 7. Después del deploy

- [ ] Abrir la URL de producción y verificar la página de la marca y al menos un detalle de parlante
- [ ] **Solo para batches grandes (3+ marcas o 20+ parlantes)**: reenviar sitemap en Google Search Console → `https://speakersise.app/sitemap.xml`
- [ ] Vaciar `data-imports/` (o decir "limpiá data-imports" y Claude lo hace)

---

## Tiempos típicos

| Operación | Tiempo |
|---|---|
| Vos preparando Excel + imágenes (5 modelos) | 30-60 min |
| Claude importando | 5-10 min |
| Tu revisión local | 10 min |
| Build de Vercel | 2-4 min |
| **Total marca nueva con 5 modelos** | **~1.5 h** |

## Si algo falla

- **Build de Vercel rojo**: abrir el log en Vercel → buscar el primer error → mandármelo. Casi siempre es un JSON con campo faltante o un import a algo que no existe.
- **Imagen se ve cortada**: pasamela de nuevo con más padding o sin recortar; yo proceso.
- **Logo se ve invertido en dark mode**: avisame, le pongo `darkInvert: false` en `brands.ts`.
- **Comparador con escala rara**: las dimensiones del Excel estaban mal — verificar en el sitio del fabricante y editamos el JSON.
