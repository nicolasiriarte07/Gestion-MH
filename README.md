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

Una vez logueado, andá a **Inventario → Importar productos** y subí tu
planilla de stock/productos (**.xlsx o .csv**). Solo son obligatorias las
columnas **Código**, **Descripción** y **P. Contado** (filas sin alguna de
estas tres se omiten); si además trae Stock, Costo, P. Web, Unidad de
Negocio, Categoría Madre, Subcategoría o Publicado, se usan también:

`Código, Descripción, Stock, Costo, P. Contado, P. Web, Unidad de Negocio, Categoría Madre, Subcategoría, Publicado`

- Los productos se identifican por **Código**: si ya existe se actualiza,
  si no existe se crea.
- **P. Contado** es el precio de venta normal (`price_cash` en la base) y
  **P. Web** el precio publicado en la web (`price_web`); son dos precios
  independientes.
- **Publicado** (o su alias viejo "En Web") acepta `TRUE`/`FALSE`, `Sí/No`,
  `1/0`, etc.
- Las columnas opcionales que falten (Costo, Unidad de Negocio, Categoría
  Madre, Subcategoría, Publicado) **no se borran ni se pisan** en un
  producto que ya existe: se preserva el valor que ya tenía cargado. Si el
  producto es nuevo, quedan vacías/sin asignar/sin publicar y se completan
  después a mano desde la tabla editable de Inventario. Si el archivo sí
  trae Unidad de Negocio pero con un valor que no coincide con
  `MUNDO HOGAR` o `EQUIPAMIENTOS MH`, esa fila se omite (para no asignar
  una unidad equivocada). Esto permite subir después archivos más chicos,
  solo con `Código, Descripción, Stock, P. Contado, P. Web`, para
  actualizar stock y precios sin tocar el resto de lo ya cargado.
- **Categoría Madre** y **Subcategoría** se crean automáticamente si no
  existen.
- Al terminar, la pantalla muestra cuántas filas se crearon, actualizaron u
  omitieron (con el motivo).
- **Marca** no viene del archivo: todos los productos quedan "Sin marca" al
  importar (o reimportar, sin pisar lo que ya tenía asignado) y se elige a
  mano desde el desplegable de esa columna en la tabla.
- El .csv puede venir separado por comas o por punto y coma, y en UTF-8 o
  en la codificación que usa Excel en español (Windows-1252/ISO-8859-1):
  se detectan solos.

## 5. Importar el histórico de ventas

En **Ventas → Importar ventas**, subí tu archivo de facturas (.xlsx o
.csv; columnas Tipo_Comprobante, Fecha, Dia, Cliente, Forma_Pago, Articulo,
Descripcion, Categoria, Cantidad, IVA_Monto, Monto_con_IVA_ars o
Subtotal_con_IVA, Monto_con_IVA_usd, Vertical, y opcionalmente
Nombre_PDF — el orden no importa). Cada fila es una línea de venta:

- Si la fila trae **Articulo** (código de producto) y ese código existe en
  el inventario, se vincula automáticamente (confianza 100%).
- El resto queda con estado "pendiente" para revisar a mano en
  **Ventas → Revisar coincidencias**, que agrupa por descripción distinta
  (no fila por fila) y sugiere el producto más parecido del catálogo según
  similitud de texto. Vos confirmás, elegís otro producto del desplegable,
  o marcás "sin coincidencia" — nada se asume solo.
- **Podés resubir el mismo archivo sin duplicar**: cada fila se identifica
  por su contenido (fecha, cliente, descripción, cantidad, monto y
  comprobante); si ya existe una igual, se omite en silencio. Así que para
  cargar ventas nuevas alcanza con resubir el archivo actualizado (con las
  filas nuevas agregadas al final, por ejemplo). La casilla "Reemplazar
  ventas existentes" sigue estando para el caso de recargar el histórico
  completo desde cero (ej. si agregaste una columna nueva y querés
  completarla en filas viejas).

La página **Ventas** es un dashboard con control de período (presets como
"Últimos 30 días", "Este mes", "Este año", o un rango personalizado):
total vendido, cantidad de ventas (líneas del archivo que caen en el
período — no depende de que venga cargado Nombre_PDF), ticket promedio,
unidades vendidas, clientes únicos (cuenta valores distintos de la columna
Cliente, sin importar cuántas líneas/artículos compró cada uno), evolución
en el tiempo (gráfico de líneas), ventas por día de la semana (gráfico de
barras, usando la columna Dia del archivo tal cual viene, no calculado a
partir de la fecha), desgloses por tipo de comprobante, unidad de negocio
y forma de pago (gráficos de torta; en unidad de negocio, MUNDO HOGAR
siempre en rosa y EQUIPAMIENTOS MH en violeta; A/B/X en tipo de
comprobante — X son ventas en negro, se incluyen en los totales pero se
ven aparte), categoría y producto (columna Descripcion, gráfico de
barras), y un ranking Top 10 clientes (columna Cliente) según la métrica
elegida.

**Comparar períodos**: activado por defecto, compara las 5 tarjetas de
arriba contra el **período anterior** (mismo largo de días, inmediatamente
antes) — se puede cambiar a **mismo período del año anterior**, o
desactivar la comparación. Cada tarjeta muestra el % de cambio en verde
(subió) o rojo (bajó); si el período de comparación no tiene datos, no
muestra porcentaje.

Dos selectores controlan qué se grafica: **Ventas / Facturación** (cambia
entre mostrar cantidad de líneas o montos en $) y, cuando está en
Facturación, **ARS / USD** (usa Monto_con_IVA_ars o Monto_con_IVA_usd).

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
  `brands` (catálogo fijo de marcas, se asigna a mano por producto),
  `products`
- **Proveedores**: `suppliers` (datos generales, contacto, datos
  comerciales, condiciones de pago como 8 booleanos + observaciones,
  `is_active`, `internal_notes`), `supplier_brands` (marcas que
  comercializa, N a N con `brands`), `supplier_products` (productos que
  provee, con costo propio del proveedor), `supplier_ledger_entries`
  (cuenta corriente: `kind` compra/pago/ajuste/nota_credito, debe/haber;
  Pagos en la ficha es un filtro `kind = 'pago'` sobre esta misma tabla —
  el saldo se calcula en la app, no se guarda), vista `supplier_balances`
  (saldo/última compra/cantidad de compras agregados por proveedor),
  `supplier_documents` + bucket privado de Supabase Storage
  `supplier-documents` (facturas, notas de crédito, listas de precios),
  `supplier_history` (timeline, poblada por las acciones del servidor).
  `purchases`/`purchase_items` (de la migración inicial, sin uso) quedan
  para un futuro módulo de Compras que va a apoyarse en `suppliers`.
- **Marketing**: pestaña Orgánico con `marketing_posts` (concepto,
  descripción, `business_unit_id`, `publish_date`, `content_type`
  educacional/marca/comercial, `is_scheduled` (Pautado), `is_published`
  (Publicado), `investment_ars`); pestaña Pauta con `ad_campaigns`
  (`campaign_name`, `investment_ars`, `reach`, `start_date`/`end_date` — la
  Duración en días se calcula a partir de esas dos fechas, no se guarda)
- **Ventas**: `sale_items`, con `product_id` nullable y `match_status`
  (`pending` / `confirmed` / `rejected` / `no_match`) para el flujo de
  confirmación manual, más `business_unit_id` y `source_article_code` para
  el matching por código exacto, `category_raw`/`receipt_number` para el
  dashboard (categoría tal cual viene del archivo, e identificador de
  comprobante, hoy informativo), `amount_usd` (columna Monto_con_IVA_usd)
  para el selector de moneda, `weekday_label` (columna Dia) para el
  gráfico de ventas por día de la semana, y `dedupe_key` (columna
  generada, hash del contenido de la fila) con índice único para que
  reimportar el mismo archivo no duplique filas.

RLS está habilitado en todas las tablas: solo usuarios autenticados pueden
leer/escribir, no hay acceso anónimo.

## Estado del proyecto

Implementado:

- [x] Auth (login/logout, rutas protegidas)
- [x] Esquema completo de base de datos (los 4 módulos)
- [x] Inventario, de arriba hacia abajo: KPIs (cantidad de SKUs, Markup,
      COGS y Precio promedio —los tres con selector Promedio/Mediana— y
      Dinero en inventario = stock × costo), buscador y filtros (unidad
      de negocio, categoría, en web), alerta desplegable de stock bajo (0
      o 1 unidad), gráficos de stock por unidad de negocio (torta),
      categoría y marca (barras, con selector Unidades/Dinero) y, por
      último, la tabla editable con alta, baja y edición inline
- [x] Importación del Excel de productos/stock (columnas flexibles, con
      unidad de negocio por defecto)
- [x] Importación del histórico de ventas (.xlsx/.csv), con matching
      automático por código y pantalla de revisión de coincidencias por
      descripción
- [x] Dashboard de ventas con control de período (presets + rango
      personalizado), selector de métrica (Ventas/Facturación) y moneda
      (ARS/USD), KPIs (incluyendo clientes únicos), evolución en gráfico de
      líneas, ventas por día de la semana, desgloses por tipo de
      comprobante (torta), unidad de negocio, categoría, producto y forma
      de pago, y ranking Top 10 clientes
- [x] Opción de reemplazar todas las ventas existentes al reimportar (para
      recargar el histórico completo sin duplicar filas)
- [x] Clientes: buscador por nombre (columna Cliente de las ventas), con
      lista de coincidencias si hay varios clientes parecidos y una vista
      de detalle con el historial completo de compras de cada uno (total
      en ARS/USD, ticket promedio, y el detalle línea por línea)
- [x] Marketing: pestañas Orgánico / Pauta. Orgánico es el cronograma de
      acciones de comunicación agrupado por mes (concepto, descripción,
      vertical, fecha, tipo de contenido, pautado, publicado e
      inversión); Pauta es un cronograma de campañas pagas agrupado por
      mes de inicio (campaña,
      inversión, alcance, fecha de inicio/fin y duración calculada en
      días). Ambos con carga/edición inline y total invertido por mes
- [x] Detección de duplicados al reimportar el histórico de ventas (por
      contenido de la fila, no requiere Nombre_PDF)
- [x] Resumen: pantalla de inicio (`/`) con los números clave del mes
      anterior de los 4 módulos juntos (total vendido, cantidad de ventas,
      productos con stock bajo, inversión en marketing), alertas de stock
      bajo, Top 10 clientes y próximas acciones de marketing programadas
- [x] Proveedores: CRM completo. Listado con KPIs del módulo (cantidad,
      activos, saldo total pendiente, compras del mes, sin compras hace
      +90 días), buscador y filtros (categoría, marca, estado), orden por
      nombre/deuda/última compra; alta y edición con formulario completo
      (datos generales, contacto, datos comerciales, marcas, condiciones
      de pago, estado); ficha con 6 pestañas — Resumen (KPIs, gráfico de
      compras por mes, observaciones internas), Productos (costo/precio/
      margen/stock, agregar producto existente del catálogo), Cuenta
      Corriente (movimientos con saldo corrido), Pagos (registro de
      pagos), Documentos (subida de facturas/listas de precios/imágenes a
      Supabase Storage, vista en galería) e Historial (timeline
      automático de altas, compras, pagos y cambios). No depende de un
      módulo de Compras — es autónomo, y un futuro módulo de Compras se
      apoyaría en este.
Pendiente (próximos pasos):

- [ ] Compras: registro de órdenes de compra que alimenten la cuenta
      corriente de Proveedores
- [ ] Reportes de ventas por producto (requiere que la mayoría de las
      líneas estén vinculadas vía Revisar coincidencias)
