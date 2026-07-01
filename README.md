# MUNDO HOGAR — Plataforma de gestión

App interna para gestionar inventario, proveedores, marketing y ventas de
MUNDO HOGAR / EQUIPAMIENTOS MH. Next.js (App Router) + Supabase, pensada
para un solo usuario, accesible desde cualquier lugar.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript
- Supabase (Postgres + Auth email/password)
- Tailwind CSS
- Deploy en Vercel

## 1. Crear el proyecto de Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo.
2. En **SQL Editor**, pegá y ejecutá el contenido de
   `supabase/migrations/0001_init.sql`. Esto crea todas las tablas, los
   índices, las políticas de RLS y las dos unidades de negocio
   (`MUNDO HOGAR`, `EQUIPAMIENTOS MH`).
3. En **Authentication → Providers**, dejá habilitado Email/Password y
   desactivá "Allow new users to sign up" (Settings → Auth) para que nadie
   más pueda registrarse solo.
4. En **Authentication → Users**, creá tu único usuario manualmente (tu
   email + contraseña).
5. En **Project Settings → API**, copiá `Project URL` y `anon public key`.

## 2. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Completá `.env.local` con los valores del paso anterior:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## 3. Correr en local

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Te va a redirigir a
`/login`. Iniciá sesión con el usuario que creaste en Supabase.

## 4. Importar el catálogo inicial

Una vez logueado, andá a **Inventario → Importar Excel maestro** y subí
`MUNDO_HOGAR_maestro_productos.xlsx`. Columnas esperadas (el orden no
importa, los nombres se detectan sin importar mayúsculas/acentos):

`Código, Descripción, Stock, Costo, P. Venta, Unidad de Negocio, Categoría Madre, Subcategoría, En Web`

- Los productos se identifican por **Código**: si ya existe se actualiza,
  si no existe se crea.
- **Unidad de Negocio** debe coincidir (sin importar mayúsculas) con
  `MUNDO HOGAR` o `EQUIPAMIENTOS MH`; si no coincide, la fila se omite y se
  lista en el resumen de importación.
- **Categoría Madre** y **Subcategoría** se crean automáticamente si no
  existen.
- Al terminar, la pantalla muestra cuántas filas se crearon, actualizaron u
  omitieron (con el motivo).

## 5. Deploy en Vercel

1. Conectá el repo en [vercel.com/new](https://vercel.com/new).
2. Cargá las mismas variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en **Project Settings → Environment
   Variables**.
3. Deploy. Vercel detecta Next.js automáticamente, no requiere
   configuración adicional.

## Esquema de base de datos

Ver `supabase/migrations/0001_init.sql`. Resumen de tablas:

- **Inventario**: `business_units`, `categories`, `subcategories`,
  `products`
- **Proveedores**: `suppliers`, `purchases`, `purchase_items`
- **Marketing**: `marketing_posts`, `ad_campaigns`
- **Ventas** (para la importación futura de `Dash1nico.xlsx`):
  `sale_items`, con `product_id` nullable y `match_status` para el flujo de
  confirmación manual de coincidencias por descripción.

RLS está habilitado en todas las tablas: solo usuarios autenticados pueden
leer/escribir, no hay acceso anónimo.

## Estado del proyecto

Implementado:

- [x] Auth (login/logout, rutas protegidas)
- [x] Esquema completo de base de datos (los 4 módulos)
- [x] Inventario: tabla editable con filtros (unidad de negocio, categoría,
      en web, búsqueda), alta, baja y edición inline
- [x] Importación del Excel maestro de productos

Pendiente (próximos pasos):

- [ ] Proveedores: contactos y registro de compras
- [ ] Marketing: calendario de publicaciones y pauta publicitaria
- [ ] Ventas: importación de `Dash1nico.xlsx` con matching aproximado por
      descripción y confirmación manual de casos dudosos
