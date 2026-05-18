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

6. **Flujo de Olvidé mi Contraseña:**
   - Integrado directamente dentro del modal de inicio de sesión (`Header.tsx`).
   - Uso de `sendPasswordResetEmail` de Firebase Auth para un flujo seguro y rápido.
   - Mensajes de validación de estado integrados en la UI.

---

## 🟡 Lo Pendiente (Próximos Pasos Recomendados)

Nuestra aplicación front-end base ya está lista en términos de UI y UX. **NOTA IMPORTANTE:** La versión actual (rama v2-development sincronizada con origin/main en el commit cdbd2de) ha sido marcada como la **versión final de base** y no utilizaremos otra por el momento. Ahora nos enfocaremos en flujos de backend y operaciones:

1. **Panel Administrador - Eliminación de Usuarios:**
   - REVEN cuenta con admisión. Falta crear el dashboard `/admin` o el flujo donde ustedes puedan entrar, ver qué "nuevas concesionarias" se han registrado y pasarles el estado de `pending` a `approved`.
   - **NUEVO REQUISITO:** Incluir la opción en el admin para poder eliminar un usuario de modo que pueda volver a registrarse.

3. **Conectar Flujo de Registro al 100%:** 
   - Armar el ciclo definitivo de registro de usuarios y de las nuevas concesionarias que pasan a estar 'pending'.
   
4. **Componente de "Publicar" (`Publish.tsx`):**
   - Necesitas un formulario de subida que use nuestra nueva Base de Datos (`vehicle-catalog.ts`), tome las fotos y guarde la información a la colección `vehicles` de Firebase utilizando Cloud Storage.

5. **Subida a Producción (Vercel/Firebase final):**
   - Validar variables de entorno, dominios y comprobaciones finales.

> **Tip para el asistente de IA o el Socio:** Si quieres retomar inmediatamente después de leer esto, arranca trabajando en el flujo de **Registro de usuarios y "Olvidé mi contraseña"**.

## 🚀 Despliegue (Deploy)
Cada vez que se realicen cambios importantes, se debe ejecutar el siguiente flujo para actualizar la plataforma:
1. `npm run build` (Genera la carpeta `dist`)
2. `firebase deploy` (Sube el hosting, reglas de Firestore y Storage)
