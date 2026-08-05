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
- [x] Menú lateral retráctil (botón "Retraer menú" abajo de los enlaces):
      lo deja solo con los íconos para ganar espacio horizontal en pantallas
      chicas; la preferencia se recuerda entre visitas
- [x] Esquema completo de base de datos (los 4 módulos)
- [x] Inventario, rediseñado con el sistema de diseño nuevo (segundo
      módulo migrado después de Inicio; mismo Sidebar/tipografía/colores/
      radios, sin lógica ni consultas nuevas — ver detalle de qué quedó
      afuera más abajo). De arriba hacia abajo: header con "Importar
      Excel" y "Nuevo producto" (abre un formulario modal, ya no agrega
      una fila para cargar inline); 5 KPIs (cantidad de productos, valor
      total del inventario = stock × P. Contado, productos con stock bajo,
      productos sin stock, markup promedio) — se recalculan según los
      filtros activos, igual que antes, pero sin flecha de comparación
      contra el mes anterior: el inventario es una foto del momento, no
      hay una tabla de historial para comparar contra un período pasado
      todavía; 2 tarjetas compactas de alerta (Stock crítico = publicados
      en la web con 0 unidades, Stock bajo = 0 o 1 unidad) con un botón
      que lleva directo a la tabla ya filtrada; barra de búsqueda y
      filtros (categoría, marca, unidad de negocio, estado —traducción
      amigable del rango de stock—, y "Más filtros" con rango de Stock/
      P. Web y en web sí/no); la tabla (estilo Shopify: miniatura,
      producto en negrita con SKU debajo, badges de categoría y estado,
      stock en color según nivel, columnas que se pueden estirar
      arrastrando el borde (para nombres largos), selección múltiple con
      exportar/eliminar en lote, orden por columna, paginación con
      selector de tamaño de página) — hacer clic en una fila abre un
      panel lateral
      (Drawer) con el detalle completo en vez de navegar a otra pantalla,
      con pestañas Resumen/Historial/Movimientos (las dos últimas están
      vacías: no hay todavía una tabla de movimientos de stock en la base)
      y accesos a "Editar producto" (formulario completo) y "Ajustar
      stock" (modal chico de un solo campo, para el uso diario de cargar
      stock rápido); y una grilla final de 4 tarjetas (stock por
      categoría y marcas con mayor inventario en barras horizontales,
      productos con mayor valor inmovilizado en una lista corta, y
      "Últimos movimientos" con el mismo estado vacío honesto de arriba).
      Botón "Exportar" en la tabla baja el mismo .csv completo de antes.
      Quedaron afuera de este rediseño (requieren datos que hoy no
      existen, no se tocó la base para agregarlos): foto real del
      producto (se muestra un ícono), columna/filtro de Proveedor por
      producto, ubicación y código de barras, e historial real de
      movimientos de stock. Los botones "Etiquetas" y "Actualizar
      precios" de la tabla están visualmente listos pero deshabilitados
      (funciones nuevas, no solo de layout)
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
- [x] Clientes: CRM migrado al sistema de diseño nuevo. Importante: no
      existe una tabla `customers` en la base — un "cliente" es
      simplemente un nombre que aparece en las ventas importadas
      (`sale_items.customer_name`), sin ficha propia. Por eso no hay ni
      puede haber CUIT/DNI, teléfono, email, dirección, ciudad, vendedor
      asignado, saldo ni notas reales por cliente — son datos que el
      brief pedía pero que requerirían una tabla de clientes nueva (fuera
      de alcance de un rediseño visual). La lista completa de clientes se
      arma agregando `sale_items` por nombre (paginado, sin el límite de
      25 que tiene la función `search_customers`), igual que "Compras
      acumuladas" en Proveedores. Todo esto sigue excluyendo "Consumidor
      Final" (ventas sin cliente identificado), mismo criterio que ya
      usaban las métricas generales.
      Header con "+ Nuevo cliente" (lleva a Importar ventas: es la única
      forma real de que un cliente nuevo entre al sistema); 5 KPIs
      (clientes totales, nuevos este mes, activos, facturación de
      clientes del mes, ticket promedio); barra de acciones (Exportar
      CSV e Imprimir reales; Importar lleva a la importación de ventas;
      Nueva venta y Enviar campaña quedan deshabilitadas — no existe
      carga manual de una venta puntual ni un sistema de campañas);
      buscador instantáneo (filtra en el momento, sin recargar la
      página) + filtro de Estado + orden — se descartaron los filtros de
      Localidad y Vendedor del brief por falta de datos; tabla estilo
      Shopify (avatar con iniciales, cliente, última compra, cantidad de
      compras, facturación, ticket promedio, estado, selección múltiple)
      — clic en una fila abre un Drawer con el detalle rápido (actividad,
      historial reciente y productos más comprados vía la misma RPC
      `customer_sales_history` de siempre) en vez de navegar; "Ver
      historial completo", "Editar cliente", "Nueva venta", "Enviar
      WhatsApp/Email" quedan como botones deshabilitados salvo el
      primero, que sigue llevando a la vista de historial completo de
      siempre (ver abajo); grilla final de 4 tarjetas (clientes con
      mayor facturación, clientes inactivos hace +90 días con días sin
      comprar, y últimos movimientos combinando altas —primera compra en
      los últimos 30 días— y compras recientes; "Clientes por localidad"
      queda como estado vacío explicado, no hay ese dato).
      Estados de cliente (Activo/Frecuente/Nuevo/Inactivo/VIP, un color
      fijo cada uno) son una segmentación nueva definida sobre estos
      mismos datos: Inactivo = sin comprar hace +90 días, VIP = 10% de
      mayor facturación histórica (entre los activos), Nuevo = primera
      compra hace ≤30 días, Frecuente = 3 o más visitas distintas,
      Activo = el resto.
      Se mantienen sin tocar la lógica ni las 3 tarjetas de métricas
      generales que ya existían (Clientes únicos/% recompra/Recencia
      media, días entre compra N y N+1, ticket promedio USD por número
      de compra) y el flujo completo de búsqueda por nombre exacto
      (`?q=`/`?customer=`) con su vista de historial de compras
      (detalle línea por línea) — solo restyleados, siguen siendo la
      forma de ver el historial completo de un cliente puntual.
- [x] Marketing: centro de planificación migrado al sistema de diseño
      nuevo, con 4 vistas de la misma información (Calendario, Agenda,
      Kanban, Lista) más un panel lateral de resumen y un dashboard
      inferior. Sigue habiendo solo 2 entidades reales en la base:
      `marketing_posts` (Orgánico: concepto, descripción, vertical,
      fecha, tipo de contenido, pautado/publicado, inversión) y
      `ad_campaigns` (Pauta: campaña, inversión, alcance, fecha de
      inicio/fin). No existe una entidad de "promociones" (Descuentos es
      un módulo aparte), ni de "tareas", ni campos de responsable,
      canal, prioridad, checklist, comentarios o archivos adjuntos —
      todo eso lo pedía el brief pero no tiene datos ni tabla detrás, así
      que quedó deshabilitado (con tooltip) u omitido con una nota
      explícita en vez de inventarse.
      El "estado" de cada campaña/publicación (Programada/En
      curso/Finalizada) no es una columna: se calcula a partir de
      `is_published` (Orgánico) o de start/end_date (Pauta) — ver
      `normalize.ts`. "Pausada" no se usa: ninguna de las dos tablas
      tiene un flag de pausa manual.
      Vista Calendario: grid mensual con navegación mes anterior/
      siguiente, cada publicación/campaña como chip de color (rosa
      Orgánico, azul Pauta) en cada día que abarca. Agenda: lista
      cronológica agrupada por día. Kanban: columnas por estado
      derivado. Lista: es literalmente el módulo de antes (las tablas
      editables inline agrupadas por mes, con su acordeón), solo
      restyleada, con las sub-tabs Orgánico/Pauta ahora en el cliente
      para no recargar la página al cambiar de vista. Clic en cualquier
      publicación/campaña (en cualquier vista salvo Lista, que ya era
      editable inline) abre un Drawer editable en vez de navegar, con
      Duplicar (reusa createMarketingPost/createAdCampaign) y Finalizar
      (marca is_published=true o pone end_date=hoy) además de Eliminar.
      Panel derecho: próximas campañas, publicaciones de hoy, próximos
      vencimientos (campañas que terminan en 14 días) y accesos rápidos
      — todo real. Dashboard inferior: estado de campañas (donut, real),
      próximas acciones (timeline, real) y rendimiento mensual
      (campañas iniciadas + publicaciones publicadas por mes, real);
      "Campañas por canal" queda como estado vacío explicado, no hay
      dato de canal.
      5 KPIs: 3 tal cual el brief (campañas activas, publicaciones
      programadas, alcance estimado = suma real de `reach`) y 2
      reemplazados por métricas reales (inversión total del mes y
      acciones del mes) en vez de "promociones vigentes"/"tareas
      pendientes", que no tienen datos.
- [x] Detección de duplicados al reimportar el histórico de ventas (por
      contenido de la fila, no requiere Nombre_PDF)
- [x] Sistema de diseño nuevo ("mh-*" en `src/components/ds/` y
      `globals.css`: Card, KpiCard, Donut, MiniBarChart, AreaLineChart,
      DateRangePicker, NotificationsBell — inspirado en Stripe/Linear/
      Vercel, tipografía Inter, colores rosa/azul MH + grises, sin
      degradados, radio 16px, sombras muy sutiles), aplicado por ahora al
      Sidebar (rosa sólido, ítem activo en blanco, mismo colapso a
      íconos que ya tenía) y a Inicio. El resto de los módulos sigue con
      el estilo anterior (Sora, `--color-brand`) hasta que se migren uno
      por uno.
- [x] Inicio (`/`), rediseñado con el sistema de diseño nuevo: saludo +
      selector de fecha (con período por defecto = mes anterior, presets
      y rango personalizado) + botón "Nueva venta"; 4 KPIs (Ventas
      totales y Cantidad de ventas comparados contra el período anterior
      equivalente con flecha ↑/↓; Productos en stock bajo y Inversión en
      marketing —este último siempre del mes calendario en curso,
      independiente del selector— como foto del momento, sin
      comparación); gráfico de ventas de los últimos 30 días (fijo,
      no depende del selector) con toggle Facturación/Ventas y las
      4 mini-métricas del período debajo (total vendido, ticket
      promedio, unidades vendidas, clientes únicos); Top 10 clientes
      con barra proporcional; y una fila de 4 tarjetas iguales (ventas
      por tipo de comprobante y por unidad de negocio en dona, por día
      de la semana en barras, y accesos rápidos a Nueva venta/Nuevo
      cliente/Ingresar stock/Ver inventario/Ver reportes)
- [x] Ventas, migrado al sistema de diseño nuevo (tercer módulo, después de
      Inicio e Inventario). Cambio puramente visual: mismo Sidebar, misma
      tipografía/colores/radios/sombras del sistema nuevo — sin tocar
      datos, métricas, consultas ni la distribución de secciones. Se
      mantienen exactamente los mismos KPIs (Total vendido, Cantidad de
      ventas, Ticket promedio, Unidades vendidas, Clientes únicos), los
      mismos filtros (período, métrica/moneda, comparación de períodos) y
      los mismos gráficos en el mismo orden (evolución de ventas, por tipo
      de comprobante, por día de la semana, por unidad de negocio, por
      categoría, por producto, por forma de pago, Top 10 clientes). La
      paleta de colores de los gráficos categóricos (torta de comprobante
      y de forma de pago) se redujo a 5 colores validados por contraste y
      daltonismo: azul, rosa, verde, ámbar y rojo, siempre en ese orden;
      "EQUIPAMIENTOS MH" pasó de violeta a azul MH para no salirse de la
      paleta del sistema nuevo. El gráfico de evolución de ventas sumó
      líneas de grilla, valores en el eje Y y relleno de área (mejora
      visual del mismo gráfico, no es un widget nuevo).
- [x] Proveedores: CRM completo, migrado al sistema de diseño nuevo (mismo
      Sidebar/tipografía/colores/radios que Inicio, Inventario y Ventas).
      Header con buscador de la barra de filtros, campanita de
      notificaciones y "+ Nuevo proveedor"; 5 KPIs (cantidad de
      proveedores, activos, saldo total pendiente, compras del mes, sin
      compras hace +90 días) — mismas métricas que antes, con
      "Órdenes abiertas" y "Tiempo promedio de entrega" pedidos en el
      brief pero descartados porque no existe todavía un módulo de
      Compras/OC que los respalde con datos reales; barra de acciones
      rápidas (Nueva compra y Registrar pago con selector de proveedor,
      Exportar CSV, Imprimir — "Importar" queda visualmente listo pero
      deshabilitado, es una funcionalidad nueva por sí misma); buscador y
      filtros (marca, categoría, estado —incluye "Con deuda"/"Al día"
      derivados del saldo, además de Activo/Inactivo—, localidad, orden)
      — se descartó el filtro "Vendedor asignado" del brief por la misma
      razón que las dos KPIs de arriba: no hay ese dato en la base;
      tabla estilo Shopify (avatar con iniciales — no hay campo de logo
      real —, nombre + razón social apilados, CUIT/ciudad/teléfono/email,
      compras acumuladas históricas, saldo, última compra, badge de
      estado, selección múltiple con eliminar en lote) — un clic en una
      fila abre un Drawer lateral con el detalle rápido (contacto,
      dirección, condición de IVA, marcas, condiciones de pago, saldo,
      últimas 5 compras/productos/pagos, observaciones, y accesos a
      Nueva compra/Registrar pago/Editar/"Ver historial completo") en vez
      de navegar a otra página; grilla final de 4 tarjetas (compras por
      proveedor y por categoría en barras horizontales, proveedores con
      saldo pendiente, y últimos movimientos en timeline global — mismo
      timeline de altas/compras/pagos/cambios que ya existía por
      proveedor, acá agregado entre todos). La ficha completa de cada
      proveedor (con sus 6 pestañas — Resumen, Productos, Cuenta
      Corriente, Pagos, Documentos, Historial) sigue existiendo igual que
      antes, solo restyleada, y es donde llevan "Ver historial completo"
      y "Editar producto/movimiento/pago/documento" de cada pestaña. No
      depende de un módulo de Compras — es autónomo, y un futuro módulo
      de Compras se apoyaría en este.
- [x] Simulador Web: simula la rentabilidad de una venta por la web.
      Precio de venta y COGS (%, precargado con el COGS promedio del
      catálogo) editables; Comisión Tiendanube (1%) e IIBB (3%) fijos;
      Costo financiero a elegir entre 6 medios de pago de MercadoPago/GO
      Cuotas/Transferencia, cada uno con su % fijo. Muestra cada concepto
      en % del precio y en monto ($), más el total de costos variables y
      la Ganancia neta (en verde si es positiva, en rojo si da negativa).
      Debajo, punto de equilibrio mensual: costos fijos editables
      (Publicidad, Plan TN, Herramientas digitales) y, a partir de la
      Ganancia neta por unidad, las unidades mínimas por mes para
      cubrirlos y la facturación mínima correspondiente (al ticket
      promedio = precio de venta cargado arriba); si la ganancia neta da
      negativa, avisa que no hay punto de equilibrio posible en vez de
      mostrar un número sin sentido. No guarda nada en la base, es una
      calculadora en vivo.
- [x] Descuentos: simulador de hasta qué % de descuento se puede dar por
      producto sin perder plata. Incluye solo los productos del catálogo
      con Costo cargado (>0), con buscador y paginado. Un único % de
      descuento (editable) se aplica a todos, y la tabla muestra una fila
      por producto (Producto, Costo, P. Web) con una columna por cada
      variante de financiación (MP débito 4,3%, MP 2 cuotas 15,78%, MP 3
      cuotas 18,7%, GO Cuotas 9,9%, Transferencia 10%), ya con la
      comisión Tiendanube (1%) e IIBB (3%) descontados, mostrando la
      Ganancia neta resultante (monto y % de margen neto sobre el precio
      con descuento) en verde o rojo. No guarda nada en la base, es una
      calculadora en vivo.

Pendiente (próximos pasos):

- [ ] Compras: registro de órdenes de compra que alimenten la cuenta
      corriente de Proveedores
- [ ] Reportes de ventas por producto (requiere que la mayoría de las
      líneas estén vinculadas vía Revisar coincidencias)
