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
2. En **SQL Editor**, ejecutá en orden los archivos de `supabase/migrations/`
   (`0001_init.sql`, `0002_sale_items_import_support.sql`,
   `0003_pending_sale_descriptions.sql`). Crean todas las tablas, índices,
   políticas de RLS, las dos unidades de negocio (`MUNDO HOGAR`,
   `EQUIPAMIENTOS MH`) y la función usada por la pantalla de revisión de
   ventas. Si agregás una migración nueva más adelante, corré solo la que
   falte.
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

Una vez logueado, andá a **Inventario → Importar Excel de productos** y
subí tu planilla de stock/productos. Solo son obligatorias las columnas
**Código**, **Descripción** y **P. Venta** (filas sin alguna de estas tres
se omiten); si además trae Stock, Costo, Unidad de Negocio, Categoría
Madre, Subcategoría o En Web, se usan también:

`Código, Descripción, Stock, Costo, P. Venta, Unidad de Negocio, Categoría Madre, Subcategoría, En Web`

- Los productos se identifican por **Código**: si ya existe se actualiza,
  si no existe se crea.
- Las columnas opcionales que falten (Stock, Costo, Unidad de Negocio,
  Categoría Madre, Subcategoría, En Web) quedan vacías/en 0/sin asignar: se
  completan después a mano desde la tabla editable de Inventario. Si el
  archivo sí trae Unidad de Negocio pero con un valor que no coincide con
  `MUNDO HOGAR` o `EQUIPAMIENTOS MH`, esa fila se omite (para no asignar
  una unidad equivocada).
- **Categoría Madre** y **Subcategoría** se crean automáticamente si no
  existen.
- Al terminar, la pantalla muestra cuántas filas se crearon, actualizaron u
  omitieron (con el motivo).

## 5. Importar el histórico de ventas

En **Ventas → Importar Excel**, subí tu planilla de facturas (columnas
Tipo_Comprobante, Fecha, Cliente, Forma_Pago, Articulo, Descripcion,
Cantidad, IVA_Monto, Monto_con_IVA_ars o Subtotal_con_IVA, Vertical — el
orden no importa). Cada fila es una línea de venta:

- Si la fila trae **Articulo** (código de producto) y ese código existe en
  el inventario, se vincula automáticamente (confianza 100%).
- El resto queda con estado "pendiente" para revisar a mano en
  **Ventas → Revisar coincidencias**, que agrupa por descripción distinta
  (no fila por fila) y sugiere el producto más parecido del catálogo según
  similitud de texto. Vos confirmás, elegís otro producto del desplegable,
  o marcás "sin coincidencia" — nada se asume solo.
- **No hay detección de duplicados todavía**: si subís el mismo archivo dos
  veces, las filas se importan de nuevo.

## 6. Deploy en Vercel

1. Conectá el repo en [vercel.com/new](https://vercel.com/new).
2. Cargá las mismas variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en **Project Settings → Environment
   Variables**.
3. Deploy. Vercel detecta Next.js automáticamente, no requiere
   configuración adicional.

## Esquema de base de datos

Ver `supabase/migrations/`. Resumen de tablas:

- **Inventario**: `business_units`, `categories`, `subcategories`,
  `products`
- **Proveedores**: `suppliers`, `purchases`, `purchase_items`
- **Marketing**: `marketing_posts`, `ad_campaigns`
- **Ventas**: `sale_items`, con `product_id` nullable y `match_status`
  (`pending` / `confirmed` / `rejected` / `no_match`) para el flujo de
  confirmación manual, más `business_unit_id` y `source_article_code` para
  el matching por código exacto.

RLS está habilitado en todas las tablas: solo usuarios autenticados pueden
leer/escribir, no hay acceso anónimo.

## Estado del proyecto

Implementado:

- [x] Auth (login/logout, rutas protegidas)
- [x] Esquema completo de base de datos (los 4 módulos)
- [x] Inventario: tabla editable con filtros (unidad de negocio, categoría,
      en web, búsqueda), alta, baja y edición inline
- [x] Importación del Excel de productos/stock (columnas flexibles, con
      unidad de negocio por defecto)
- [x] Importación del histórico de ventas, con matching automático por
      código y pantalla de revisión de coincidencias por descripción

Pendiente (próximos pasos):

- [ ] Proveedores: contactos y registro de compras
- [ ] Marketing: calendario de publicaciones y pauta publicitaria
- [ ] Detección de duplicados al reimportar el histórico de ventas
- [ ] Reportes de ventas (por producto, categoría, unidad de negocio, con
      tratamiento de notas de crédito/comprobantes tipo X)
