# Hotel Las Vicuñas - Recepcion & Housekeeping v4.3

## Descripcion
Sistema central de operaciones del Hotel Las Vicuñas (Putre, Chile - 3,500 msnm). Gestiona recepcion, reservas, disponibilidad de habitaciones, check-in/check-out, housekeeping, registro INE de pasajeros, cotizaciones y finanzas. Es la app mas critica del ecosistema.

## Arquitectura
- Single-file HTML (index.html) - ~6,000 lineas
- Frontend vanilla JS + Supabase como backend cloud
- Offline-first: localStorage como fallback, sync con Supabase cuando hay conexion
- Real-time sync entre dispositivos via PostgreSQL LISTEN/NOTIFY
- SPA con navegacion por tabs y modales

## Tech Stack
- HTML5 / CSS3 (custom properties, Grid, Flexbox)
- JavaScript vanilla ES6+
- Supabase v2 (@supabase/supabase-js) - PostgreSQL cloud
- XLSX.js - importacion de Excel/CSV
- Anthropic Claude Vision API - extraccion de datos desde fotos de reservas
- Web APIs: FileReader, Blob, localStorage, Canvas

## Supabase - Tabla y Claves
- Tabla principal: `hotel_data` (JSONB key-value store)
- Claves de datos:
  - `hv_reservas` - Reservas directas
  - `hv_booking` - Reservas importadas de Booking.com
  - `hv_registros` - Registros INE de pasajeros
  - `hv_sucias` - Habitaciones sucias
  - `hv_limpias_hoy` - Limpiezas completadas hoy
  - `hv_papelera` - Reservas eliminadas (papelera)
  - `hv_historial_limpieza` - Historial de limpiezas
  - `hv_proact_log` - Log de tareas proactivas housekeeping
  - `hv_proact_disclaimer` - Aceptacion de disclaimer HK

## Modelo de Datos

### Reserva
```json
{
  "id": "string (UUID)",
  "roomNum": "number (102-229)",
  "checkin": "YYYY-MM-DD",
  "checkout": "YYYY-MM-DD",
  "nombre": "string",
  "noches": "number",
  "pax": "number",
  "tipo": "single|doble|matrimonial|triple|familiar|flex",
  "fuente": "booking|directo|cuaderno",
  "precio": "string (CLP)",
  "telefono": "string",
  "numReserva": "string",
  "cancelada": "boolean",
  "pais": "string",
  "docType": "boleta|factura|exento",
  "datosFaltantes": "boolean"
}
```

### Registro INE
```json
{
  "id": "UUID",
  "timestamp": "ISO8601",
  "bookingId": "string (optional)",
  "nombre": "string",
  "doc": "string (RUT/pasaporte/DNI)",
  "tipodoc": "RUT|Pasaporte|DNI",
  "nacionalidad": "string",
  "residencia": "string",
  "ciudad": "string",
  "checkin": "YYYY-MM-DD",
  "checkout": "YYYY-MM-DD",
  "noches": "number",
  "habitacion": "string",
  "telefono": "string",
  "medio": "string (fuente de reserva)",
  "patente": "string (placa vehiculo)",
  "totalPax": "number"
}
```

### Habitaciones del Hotel
- 29 habitaciones fisicas: 102, 103, 104, 109-117, 118-121, 202-204, 214-221, 227-229
- Tipos y precios base (CLP/noche):
  - Single: 1 pax, $50,000
  - Doble: 2 pax, $59,500
  - Matrimonial: 2 pax, $65,450
  - Triple: 3 pax, $77,350
  - Familiar: 3 pax, $90,000
  - Flex: variable
- Extra por huesped adicional: +$20,000/noche

## Modulos y Funcionalidades

### 1. Recepcion (Dashboard principal)
- Calendario de disponibilidad (diario/semanal/mensual)
- Estado de habitaciones en tiempo real (ocupada/disponible/sucia)
- Alertas de check-in/check-out del dia
- Asignacion de habitaciones

### 2. Cotizaciones
- Generador multi-idioma (ES, EN, PT, FR, DE, IT, ZH)
- Selector de tipo de habitacion con calculo de precios
- Calculo automatico de noches y pax adicionales
- Generacion y exportacion a PDF
- Calculo de IVA segun tipo de documento (boleta/factura/exento)
- Numeracion de facturas
- Datos bancarios para transferencia

### 3. Importacion Booking.com
- Importacion desde CSV/Excel
- Importacion desde foto con Claude Vision AI
- Entrada manual de reservas
- Asignacion automatica de habitaciones
- Tracking de estado (confirmada/cancelada)
- Tracking de fuente (booking.com, directo, cuaderno)

### 4. Reservas Directas (Cuaderno)
- Sistema de entrada manual para reservas directas
- Validacion de datos incompletos
- Conversion a reserva formal

### 5. Registro INE
- Registro de pasajeros para gobierno
- Tipos de documento: RUT, pasaporte, DNI
- Nacionalidad y residencia
- Sync automatico desde Booking.com y cuaderno
- Modal de datos faltantes con formulario multi-campo
- Alertas de datos incompletos

### 6. Housekeeping
- Login de personal con PIN
- Checklist de limpieza por habitacion
- Checklist de amenities/suministros
- Sistema de tareas proactivas
- Disclaimer/aceptacion de responsabilidad
- Recordatorios semanales
- Cards de habitacion con indicador de estado

### 7. Finanzas
- Generador de facturas con precios por tipo de habitacion
- Moneda: CLP (peso chileno)
- Reportes financieros mensuales con comparativa
- Tracking de ingresos por mes
- Analiticas de huespedes
- Documentos tributarios: boleta vs exento

### 8. Calendario de Disponibilidad
- Vista de 30 dias con scroll
- Ocupacion por habitacion con nombre de huesped
- Indicador de fuente de reserva (colores)
- Indicador de habitaciones sucias
- Navegacion dia a dia

### 9. Administracion
- Acceso con password ("administracion")
- Backup/export completo a JSON
- Importacion desde backup
- Papelera de reservas eliminadas
- Restauracion desde papelera
- Gestion de personal de housekeeping

## Roles y Acceso
- **Admin**: acceso completo con password
- **Vista Huesped**: solo lectura de disponibilidad
- **Housekeeping**: login con PIN (personal: Luisa, Nacha)

## Funciones JS Principales
- `doLogin()` - autenticacion admin
- `doGuest()` - modo vista huesped
- `doHousekeeping()` - login HK con PIN
- `importarCSV()` - importar Excel/CSV de booking
- `importarFotoCuaderno()` - extraccion AI de fotos
- `syncBookingINE()` - sync Booking -> INE
- `syncCuadernoINE()` - sync cuaderno -> INE
- `renderHK()` - render interfaz housekeeping
- `hkMarcarLimpia()` - marcar habitacion limpia
- `rDisp()` - render calendario disponibilidad
- `rFin()` - render reportes financieros
- `pushLocalToSupabase()` - sync local -> cloud
- `setupRealtimeListeners()` - activar sync real-time

## Design System
- Tema con soporte dark mode (toggle persistente en localStorage)
- Paleta tierra: tonos crema, cafe, dorado (identidad HLV)
- Tabs como navegacion principal
- Modales para formularios y datos
- Cards para habitaciones
- Toast notifications
- Badge de estado de sync con Supabase
- Responsive mobile-first

## Bugs Conocidos
- BUG 6: estilos dark mode para elementos de proactividad
- BUG 15: comparativa mes a mes solo contra mes anterior del calendario
- BUG 18: no restaurar hv_limpias_hoy desde backup (datos con scope de fecha)

## Roadmap de Mejoras Sugeridas

### Prioridad Alta
- [ ] Separar en modulos JS (actualmente todo en un archivo de 6000 lineas)
- [ ] Dashboard con KPIs en tiempo real (ocupacion %, ingresos del dia, check-ins pendientes)
- [ ] Notificaciones push para check-ins del dia y habitaciones listas
- [ ] Mejorar sistema de autenticacion (reemplazar password hardcodeado)
- [ ] Corregir bugs 6, 15 y 18 documentados

### Prioridad Media
- [ ] Integracion con Bodega: alertar stock bajo de amenities al hacer check-in
- [ ] Integracion con Traductor: enlace directo desde ficha de huesped
- [ ] Calendario drag-and-drop para mover/extender reservas
- [ ] Exportar registro INE en formato oficial del gobierno
- [ ] Historial de precios y revenue management basico
- [ ] Sistema de notas por habitacion/huesped

### Prioridad Baja
- [ ] PWA completa con service worker para uso offline total
- [ ] Panel de analytics avanzado (ocupacion por temporada, ADR, RevPAR)
- [ ] Integracion con channel manager (no solo Booking.com)
- [ ] Sistema de reviews/feedback de huespedes
- [ ] QR code para check-in express
