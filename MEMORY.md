# REVEN - Memoria y Estado del Proyecto

Este archivo sirve como punto de partida rápido para ti, para tu socio, o para la próxima vez que necesites retomar el proyecto. Aquí puedes ver de un vistazo qué se ha completado y qué quedaría por hacer para tener la aplicación 100% terminada.

## 🟢 Lo que ya hemos completado (Lo Avanzado)

En las últimas sesiones hemos consolidado la infraestructura core y la lógica de negocio:

1. **Marketplace & Filtros Pro:** 
   - Refactorización total de `Marketplace.tsx`.
   - Cascadas de filtros inteligentes y `FilterChips.tsx` para una navegación fluida.
   - Sliders de Kilometraje, Color, Precios (ARS/USD) y Año.

2. **Gestión de Planes y Límites (Estricto):**
   - Implementación de `normalizePlan` para manejar nombres antiguos (Plata, Oro, Platinum) y mapearlos a los actuales (Business, Professional, Enterprise).
   - Aplicación de límites reales: **Business (5 autos / 5 búsquedas)**, **Professional (15 autos / 15 búsquedas)**, **Enterprise (150 autos / 150 búsquedas)**.
   - Feedback visual en el Perfil con barras de progreso de consumo de cuotas.

3. **Formulario de Publicación Completo (`Publish.tsx`):**
   - Integración total con la API de Catálogo (ArgAutos).
   - **Optimizaciones de API:** Uso de `?year=YYYY` y `relations[]=years` para reducir la carga de red y mejorar la velocidad de respuesta en los dropdowns.
   - Soporte para subida de hasta 15 fotos con previsualización y compresión.
   - **Cotizaciones Infoauto (Integradas):** Se implementó la integración con Infoauto (priorizada sobre ACARA). *Nota: Actualmente deshabilitado visualmente en el formulario por solicitud del usuario.*

4. **Analytics y Métricas de Éxito:**
   - Corrección de la lógica de **Conversión de Leads**. Ahora refleja una tasa de cierre real basada en Ventas / Consultas.
   - Visibilidad de métricas habilitada para todos los planes (incluyendo Business).

5. **Bases de Datos & GeoRef:**
   - Integración optimizada con la API de Provincias y Localidades (GeoRef Argentina).
   - Sistema de fallback a base de datos estática para marcas y modelos.

---

## 🟡 Lo Pendiente (Próximos Pasos Recomendados)

1. **Panel Administrador - Gestión de Usuarios:**
   - Creación del dashboard `/admin` para aprobación de nuevas concesionarias (`pending` -> `approved`).
   - Opción para eliminar usuarios y permitir re-registro.

2. **Integración Fiscal (CUIT):**
   - Implementar el sistema de validación de CUIT (Cuitalizer) en el formulario de admisión.

3. **Reactivación de Cotizaciones:**
   - Habilitar nuevamente la sección de **Infoauto** en el formulario de publicación cuando se decida avanzar con esa fuente de referencia.

4. **Optimización de Rendimiento:**
   - Aplicar `manualChunks` en Vite para mejorar el tamaño de los bundles de JS observados en el deploy.
