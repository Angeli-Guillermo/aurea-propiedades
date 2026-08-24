# Consultora Internacional de Negocios Inmobiliarios — One-page premium (CABA)

One-page de alta conversión para una inmobiliaria de producto exclusivo, construida con el stack
de referencia de 2026: **React 19 + Vite 7 + TypeScript + Tailwind CSS 4 + Motion (Framer Motion) +
TanStack Query + React Hook Form + Zod + Google Maps**.

El proyecto viene con datos mock realistas, así que **arranca y funciona sin ninguna API key**.
El mapa muestra un fallback elegante hasta que configures Google Maps, y el formulario simula el
envío hasta que le pongas un endpoint real.

---

## 1. Puesta en marcha

```bash
npm install
cp .env.example .env.local     # en Windows: copy .env.example .env.local
npm run dev                    # http://localhost:5173
```

Otros comandos:

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Typecheck (`tsc --noEmit`) + build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción en local |
| `npm run typecheck` | Sólo comprobación de tipos |

Requiere Node 20.19+ o 22.12+ (requisito de Vite 7).

---

## 2. Configurar la Google Maps API Key

### 2.1 Crear la key

1. Entrá en [Google Cloud Console](https://console.cloud.google.com/) y creá un proyecto
   (o seleccioná uno existente).
2. **Facturación → vincular una cuenta de facturación.** Google exige tarjeta aunque el uso
   caiga dentro del tramo gratuito mensual; sin facturación el mapa se ve con marca de agua
   *"solo para fines de desarrollo"*.
3. **APIs y servicios → Biblioteca** → buscá y habilitá **Maps JavaScript API**.
   (Si más adelante añadís buscador de direcciones, habilitá también *Places API* y *Geocoding API*.)
4. **APIs y servicios → Credenciales → Crear credenciales → Clave de API**. Copiá la clave.

### 2.2 Restringir la key (importante — la key viaja al navegador)

Una key de Maps JavaScript **siempre es pública**: se ve en el bundle. La protección no es
esconderla, es restringirla.

En la ficha de la clave:

- **Restricciones de aplicación → Sitios web (referentes HTTP).** Añadí:
  ```
  http://localhost:5173/*
  http://localhost:4173/*
  https://tudominio.com/*
  https://*.tudominio.com/*
  ```
- **Restricciones de API → Restringir clave → Maps JavaScript API** (y sólo las que uses).
- **Facturación → Presupuestos y alertas:** creá una alerta para enterarte si alguien abusa.

### 2.3 Pegarla en el proyecto

En `.env.local`:

```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...tu_clave
```

Reiniciá el servidor de desarrollo: **Vite sólo lee las variables de entorno al arrancar.**

### 2.4 (Opcional) Estilo de mapa gestionado en la nube — `mapId`

El proyecto trae un estilo JSON propio en
[`src/components/map/mapStyles.ts`](src/components/map/mapStyles.ts): neutro cálido, POIs ocultos y
etiquetas muy desaturadas para que sólo destaquen los pines.

Si preferís gestionar el estilo desde Google Cloud (**Map Management → Crear estilo de mapa**),
copiá el Map ID y ponelo en:

```env
VITE_GOOGLE_MAPS_MAP_ID=8f2b...
```

> Cuando hay `mapId`, **Google ignora los estilos JSON locales**. Es uno u otro, no ambos.
> El código ya contempla las dos rutas: mirá el `useMemo` de `options` en
> [`PropertiesMap.tsx`](src/components/map/PropertiesMap.tsx).

### 2.5 Si algo falla

| Síntoma | Causa habitual |
| --- | --- |
| Panel *"Mapa no configurado"* | Falta `VITE_GOOGLE_MAPS_API_KEY` o no reiniciaste el dev server |
| Mapa gris + `RefererNotAllowedMapError` en consola | El dominio actual no está en las restricciones de referente |
| Marca de agua *"solo para desarrollo"* | Falta vincular facturación al proyecto |
| Los estilos JSON no se aplican | Tenés un `mapId` definido (ver 2.4) |

---

## 3. Conectar una API real de propiedades

Todo el acceso a datos vive en un único archivo:
[`src/api/properties.ts`](src/api/properties.ts).

### 3.1 Caso fácil: tu API ya devuelve el shape esperado

Basta con una variable de entorno:

```env
VITE_PROPERTIES_API_URL=https://api.tu-inmobiliaria.com/v1
```

El cliente hará `GET https://api.tu-inmobiliaria.com/v1/properties` y aceptará cualquiera de estos
tres envoltorios sin tocar código:

```jsonc
[ { ...propiedad } ]                 // array pelado
{ "data":    [ { ...propiedad } ] }  // envelope "data"
{ "results": [ { ...propiedad } ] }  // envelope "results"
```

El shape de cada propiedad está definido en
[`src/types/property.ts`](src/types/property.ts):

```ts
{
  id: string; slug: string; title: string; description: string;
  price: number;            // entero, sin centavos
  currency: string;         // "USD" (convención del mercado argentino)
  status: 'venta' | 'alquiler';
  type: 'piso' | 'atico' | 'duplex' | 'casa';
  neighborhood: string; city: string; address: string;
  bedrooms: number; bathrooms: number; area: number; parking: number;
  year?: number; featured: boolean;
  image: string; gallery: string[]; features: string[];
  lat: number; lng: number;
}
```

### 3.2 Caso normal: tu API usa otros nombres de campo

No toques el resto de la app. Adaptá **sólo** la función `normalize()` de `src/api/properties.ts`:

```ts
function normalize(item: unknown): Property {
  const raw = item as Record<string, any>;
  return propertySchema.parse({
    id: String(raw.propertyId),
    slug: raw.seo_slug,
    title: raw.headline,
    description: raw.long_description ?? '',
    price: raw.price_cents / 100,
    type: mapType(raw.property_type),        // tu propio mapeo
    neighborhood: raw.location.district,
    city: raw.location.city,
    address: raw.location.street,
    bedrooms: raw.rooms,
    bathrooms: raw.baths,
    area: raw.built_area_m2,
    image: raw.photos[0]?.url,
    gallery: raw.photos.map((p: any) => p.url),
    lat: raw.location.coordinates[1],
    lng: raw.location.coordinates[0],
    featured: Boolean(raw.is_highlighted),
  });
}
```

Zod valida en el borde: si el backend cambia y rompe el contrato, te enterás con un error claro
en la UI, no con un `undefined` tres componentes más abajo.

### 3.3 Si necesitás cabeceras, auth o paginación

- **Endpoint distinto:** cambiá la constante `PROPERTIES_ENDPOINT`.
- **Token:** añadilo en el `headers` del `fetch` dentro de `getProperties()`.
- **Paginación / filtros server-side:** convertí `propertiesQueryOptions` en una función
  `propertiesQueryOptions(filters)` y pasá los filtros a la query key. La sección de destacadas y
  el mapa consumen ambas el mismo helper, así que se actualizan juntas.

### 3.4 El formulario de leads

Mismo patrón, en [`src/api/leads.ts`](src/api/leads.ts):

```env
VITE_LEADS_API_URL=https://api.tu-inmobiliaria.com/v1/leads
```

Hace `POST` con este JSON:

```json
{
  "name": "...", "email": "...", "phone": "...",
  "intent": "vender | valorar | comprar",
  "location": "...", "message": "...", "consent": true,
  "source": "landing", "submittedAt": "2026-07-31T10:00:00.000Z"
}
```

Sin la variable (caso por defecto), ambos formularios —tasación/contacto y newsletter del
footer— usan [Netlify Forms](https://docs.netlify.com/manage/forms/setup/): no hace falta
backend propio. Las respuestas quedan en el panel del proyecto en Netlify (**Forms**), donde
también se pueden configurar notificaciones por email sin tocar código.

Esto depende de dos formularios "espejo" declarados de forma estática en `index.html`
(`name="contacto"` y `name="newsletter"`, con los mismos campos que React envía por `fetch`) —
Netlify sólo detecta formularios parseando el HTML servido en el build, no lo que una SPA
renderiza en el cliente. Si agregás o renombrás un campo en `ValuationForm.tsx` o
`NewsletterSignup.tsx`, actualizá también el formulario espejo correspondiente o Netlify lo
va a rechazar como campo desconocido.

---

## 4. Cambiar la marca

Un único archivo: [`src/data/site.ts`](src/data/site.ts) — nombre, claim, teléfono, WhatsApp,
email, dirección, redes, centro por defecto del mapa y enlaces del menú.

Después:

- **Copy editorial** (métricas, servicios, equipo, testimonios): [`src/data/content.ts`](src/data/content.ts)
- **Paleta y tipografía**: bloque `@theme` de [`src/index.css`](src/index.css)
- **Meta tags, Open Graph y JSON-LD**: [`index.html`](index.html)
- **Favicon**: [`public/favicon.svg`](public/favicon.svg)

Las fuentes (Fraunces + Inter) se cargan desde Google Fonts en `index.html`. Para autohospedarlas,
sustituí el `<link>` por `@font-face` locales y actualizá `--font-display` / `--font-sans`.

---

## 5. Estructura

```
src/
├── api/                      # Clientes HTTP + esquemas de payload
│   ├── properties.ts         #   ← punto único para conectar tu API
│   └── leads.ts
├── components/
│   ├── forms/ValuationForm.tsx
│   ├── layout/               # Header sticky, Footer, botón flotante de WhatsApp
│   ├── map/                  # Mapa (lazy) + estilos JSON
│   ├── properties/           # Card, skeleton, filtros, modal de detalle
│   ├── sections/             # Las 10 secciones de la página
│   └── ui/                   # Button, Container, Modal, LazyImage, Skeleton…
├── data/                     # site.ts (marca), content.ts (copy), properties.mock.ts
├── hooks/                    # useInViewOnce, useLockBodyScroll
├── lib/                      # cn, format (Intl), motion (variants), scroll
├── types/property.ts         # Esquema Zod + tipo del dominio
├── App.tsx
├── main.tsx
└── index.css                 # Design tokens (@theme) + base + utilidades
```

Estructura de la página: Header → Hero → Cifras clave → Propiedades → Servicios → Nosotros →
Opiniones → Mapa → Contacto → Footer.

---

## 6. Decisiones de performance

Resultado del build actual (`npm run build`):

| Chunk | Bruto | Gzip | Cuándo se carga |
| --- | --- | --- | --- |
| `index` | 194 kB | 61 kB | Inicial |
| `vendor-react` | 180 kB | 57 kB | Inicial |
| `vendor-motion` | 101 kB | 34 kB | Inicial |
| `vendor-query` | 44 kB | 14 kB | Inicial |
| `vendor-maps` | 153 kB | 34 kB | **Diferido** — al acercarse la sección de mapa |
| `vendor-forms` + `ValuationForm` | 38 kB | 14 kB | **Diferido** — al llegar al formulario |
| CSS | 53 kB | 10 kB | Inicial |

**~166 kB gzip de JS inicial.** Si necesitás bajar de 150 kB, la palanca más rentable es sacar
Zod del cliente de propiedades (`normalize()` a mano) y dejarlo sólo en el formulario, que ya es
un chunk diferido: son unos ~20 kB gzip.

Otras medidas aplicadas:

- **Imagen LCP** del hero precargada en `index.html` con `fetchpriority="high"`; el resto de
  imágenes con `loading="lazy"` + `decoding="async"` y `width`/`height` explícitos → **CLS 0**.
- **Google Maps** no entra en el bundle inicial: `React.lazy` + `IntersectionObserver`
  (`useInViewOnce`, con 300 px de margen para que no se note el salto).
- **Skeleton loaders** con la misma silueta que las tarjetas reales.
- **Animaciones sólo con `transform` y `opacity`**; nada que provoque layout.
- **`prefers-reduced-motion`** respetado en tres capas: `<MotionConfig reducedMotion="user">`,
  media query global en CSS y comprobación explícita en el contador animado y el scroll suave.
- **Una sola petición de datos**: destacadas y mapa comparten la query `['properties']` de
  TanStack Query (`staleTime` 5 min).

---

## 7. Accesibilidad

- HTML semántico (`header` / `main` / `section` / `figure` / `dl`) y jerarquía de encabezados real.
- Enlace "Saltar al contenido" visible sólo al tabular.
- Modal con `role="dialog"`, `aria-modal`, cierre con `Escape`, click fuera, **trampa de foco** y
  devolución del foco al elemento que lo abrió.
- Estados de foco visibles y homogéneos (`:focus-visible` con el acento dorado).
- Formulario con `<label>` asociados, `aria-invalid`, errores con `role="alert"` y resumen
  `aria-live` para lectores de pantalla.
- Contadores y filtros con `aria-live` / `aria-pressed`.
- Iconografía decorativa marcada con `aria-hidden`.

---

## 8. Notas de contenido

Las 8 propiedades de ejemplo usan **coordenadas reales de CABA** (Palermo Chico, Recoleta,
Puerto Madero, Belgrano, Las Cañitas, San Isidro, Núñez y San Telmo). Los precios están en dólares
(USD), que es la moneda en la que se publica la vivienda de reventa en Argentina. Las fotografías
son de Unsplash y están pensadas como marcador de posición: **reemplazalas por las de tu cartera
antes de publicar**. Los nombres de los testimonios y del equipo son ficticios.

---

## 9. Despliegue

Build estático puro (`dist/`): sirve en Vercel, Netlify, Cloudflare Pages o cualquier hosting
estático sin configuración adicional.

Antes de publicar:

1. Añadí el dominio de producción a las restricciones de referente de la API Key de Google.
2. Definí `VITE_GOOGLE_MAPS_API_KEY`, `VITE_PROPERTIES_API_URL` y `VITE_LEADS_API_URL` en las
   variables de entorno del hosting (se inyectan en tiempo de build, no de ejecución).
3. Actualizá la URL canónica y las de Open Graph en `index.html`.
4. Sustituí los enlaces `href="#"` de Aviso legal / Privacidad / Cookies en el footer por páginas
   reales — en Argentina aplica la Ley de Protección de Datos Personales N.º 25.326.
