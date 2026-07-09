# CLAUDE.md — Contexto del proyecto HLV Recepción & Housekeeping

> Documento de contexto permanente. Si sos Claude (o cualquier asistente IA) leyendo esto:
> acá está todo lo que necesitás saber del proyecto antes de tocar nada.
> Última actualización: **2026-07-04** (Build 20260704).

---

## Qué es

App web **single-file** (`index.html`, ~12.700 líneas HTML+CSS+JS, sin build step) para la
gestión operativa del **Hotel Las Vicuñas** (Baquedano 100, Putre, Chile, 3.500 msnm):
reservas, disponibilidad de 29 habitaciones, registros INE, cotizaciones multiidioma,
finanzas (IVA/KPIs) y housekeeping. Funciona **offline** con localStorage y sincroniza en
tiempo real entre dispositivos vía **Supabase** (tabla única key/JSONB).

Dueño del proyecto: nik (nkgnwork@gmail.com). Uso interno del hotel, 5 roles con PIN:
Dueño / Gerente / Recepción / Contabilidad / Housekeeping. PIN inicial de todos: `0000`.

## Archivos de esta carpeta

| Archivo | Qué es |
|---|---|
| `index.html` | LA app completa. Todo el código vive acá. |
| `config.js` | Credenciales Supabase del entorno. Se sube al hosting junto a index.html. NO commitear a repo público. |
| `.env.example` | Solo documentación de variables. La app NUNCA lee .env (ver abajo). |
| `CLAUDE.md` | Este documento. |
| `README.md` | Manual de deploy + changelog. |
| `Manual_Uso_HLV_Recepcion_v4.3.docx` | Manual del usuario final (recepcionistas). |
| `tests/` | Harness de pruebas del import Booking (ver sección Testing). |

Existe una copia de trabajo con git en `Desktop/recepcion opus 4ocho/` (mismo Build base,
repo GitHub `nkgnwork/RECEPCION-HOUSEKEEPING`, GitHub Pages). **La carpeta canónica de
deploy es ESTA.** Si se editan ambas, hay que reconciliar.

## .env vs config.js — explicación simple

- La app es 100% frontend: el navegador **no puede leer archivos .env**. Ignoralos si te confunden.
- Lo ÚNICO que importa en producción es **`config.js`**: define `window.HLV_CONFIG` con
  `SUPABASE_URL` y `SUPABASE_ANON_KEY`. `index.html` lo carga con un `<script src>` normal.
- `.env.example` existe solo como plantilla/documentación para el día que haya CI o más entornos.
- Regla práctica: **subí al hosting `index.html` + `config.js` y listo.** Nada más que configurar.
- Sin `config.js`, la app corre igual pero solo-local (badge "Falta config.js"), y puede
  configurarse desde el modal de sincronización dentro de la app.

## Backend Supabase (verificado E2E el 2026-07-04)

- Proyecto: **HLV RECEPCION & HOUSEKEEPING**, ref `nozambkjwkmvusvuqyiu`, región `sa-east-1` (São Paulo).
- URL y anon key: en `config.js` (la anon key es pública por diseño; la "seguridad" es la RLS).
- Esquema: una sola tabla `hotel_data (key TEXT PK, value JSONB, updated_at TIMESTAMPTZ)`.
- RLS habilitada con policy `public_access` (ALL, USING true) — **deliberadamente abierta**,
  app de uso interno. Hardening opcional futuro: policy con JWT + Edge Function (ver README).
- Realtime: publicación `supabase_realtime` incluye `hotel_data`. Probado E2E: suscripción +
  INSERT/UPDATE/DELETE + evento recibido ✓ (con anon key, igual que el browser).
- **⚠️ Plan free: el proyecto se PAUSA tras ~1 semana sin uso.** Síntoma: la app queda
  "Sin conexión" y solo-local. Solución: restaurarlo desde el dashboard de Supabase
  (o pedírselo a Claude, que tiene MCP de Supabase conectado). Los datos NO se pierden
  al pausar; el primer dispositivo que conecte además re-sube su localStorage.
- La nube ya tiene datos reales del hotel (reservas, booking, usuarios, auditoría, etc.).

## Arquitectura de datos

- Todo el estado vive en localStorage bajo keys `hv_*` (y `hlv_*`): `hv_reservas`,
  `hv_booking`, `hv_registros` (INE), `hv_papelera`, `hv_users`, `hv_audit`,
  `hv_room_states`, `hv_sucias`, `hv_hk_sup_<fecha>_<hab>`, etc.
- Sync: `sbSet(key, value)` con **optimistic locking** (UPDATE condicional por
  `updated_at` + merge y 3 reintentos en conflicto). Al conectar: `pushLocalToSupabase()`
  hace merge local↔server. Listeners realtime actualizan la UI de otros dispositivos.
- Habitaciones: `ROOMS` — familiares 102/103/202, triples 118-121, matrimonial 228,
  resto "flex" con prioridad `FLEX_PRI`.

## Import de reservas Booking (el corazón sensible — testeado a fondo)

Tres vías: `importarCSV()` (archivo del extranet), `importarICS()` (iCal), `importarFotoCuaderno()`
(OCR con Claude Vision, requiere API key Anthropic que cada usuario pega en la app).

`importarCSV()` — decisiones de diseño validadas por tests (2026-07-04):

- Acepta CSV (coma o punto y coma, con/sin BOM) y Excel .xls/.xlsx.
- Columnas detectadas por substring, EN y ES. Check-in reconoce: check-in/checkin/arrival/
  llegada/**entrada**/**ingreso**. (El export ES del extranet usa "Entrada"/"Salida" — antes
  del fix importaba 0 filas.)
- Parser CSV propio con soporte real de comillas: comas, saltos de línea y `""` escapadas
  dentro de campos (los remarks de Booking los traen).
- `no_show` / `no show` / `cancelled_*` / `Cancelada` ⇒ `cancelada:true` (no ocupan
  habitación, no van a INE ni finanzas).
- Precios normalizados a dígitos CLP al importar: "CLP 119,000.00" y "119.000 CLP" → `119000`.
  "N/A" → vacío.
- Reservas grupales (mismo book number, una fila por habitación): se importan todas con
  sufijo `_2`, `_3`… Filas 100% idénticas se descartan como duplicado.
- Filas con fechas inválidas se cuentan y se avisan en el toast ("N filas omitidas").
- NO usar claves de columna cortas tipo "id" en `getCol` — hacen match parcial
  ("sal**id**a", "un**id**ad"). Ya mordió una vez.
- Chile/cl ⇒ docType `boleta`; extranjero ⇒ `exento` (IVA).
- La planilla histórica propia (`RESERVAS HLV 2025-2026.xlsx`, columnas "Fecha Ingreso/
  Nombres/Red...") también importa, PERO marca todo como canal Booking — usar solo como
  migración consciente.

## Testing (carpeta `tests/`)

El harness ejecuta el **código real** extraído de `index.html` en Node (sin browser):

```bash
cd tests
npm init -y && npm install xlsx@0.18.5        # una vez
INDEX_PATH="../index.html" TEST_DIR="." \
TEST_FILES='[["booking_en.csv","EN",4],["booking_es.csv","ES",3],["booking_group.csv","Grupal",2],["edge_status.csv","Estados",4],["edge_fechas.csv","Fechas",4],["edge_overflow.csv","Overflow",35],["edge_en_semicolon.csv","Semicolon",1]]' \
node harness.js
```

(En Windows, definir las variables con `set` o correrlo desde Git Bash. `gen_tests.js`
regenera los archivos de prueba, incluido el .xlsx.) El error `fmtFC is not defined` que
aparece al final de cada caso es un artefacto del harness, no un bug de la app.
**Regla: después de CUALQUIER cambio a importarCSV, correr esta suite.**

## Hardening de seguridad (2026-07-08) — IMPORTANTE

Antes de este build, la tabla `hotel_data` tenía RLS `USING(true)` — cualquiera con la
anon key (visible en `config.js`, público por diseño) podía leer/escribir TODO
(reservas, registros INE con datos de pasajeros, hashes de usuarios) directo contra
la API REST de Supabase, sin pasar por el login/PIN de la app. Se corrigió así:

1. **RLS**: policy `public_access` reemplazada por `authenticated_only`
   (`auth.role() = 'authenticated'`). Verificado con curl: anon key sola → 0 filas
   en lectura, 401 en escritura. Con sesión válida → acceso normal.
2. **Edge Function `hlv-session`** (nueva, proyecto `nozambkjwkmvusvuqyiu`): recibe
   `{mode:"main", username, secret}` o `{mode:"hk", hkIndex, secret}`, valida el
   password/PIN contra `hv_users` (o el array hardcodeado `HK_USERS`) usando el
   service_role key (bypassa RLS), y si coincide devuelve una sesión real de
   Supabase Auth (cuenta puente `hlv-session-bridge@hlv-recepcion.internal`, no es
   un usuario real). Rate limit best-effort: 20 intentos/min por instancia.
3. **index.html**: `hlvEstablishSession()` (cerca de `initSupabase`) llama a la
   Edge Function tras un login local exitoso y hace `sbClient.auth.setSession(...)`.
   Enganchado en `doLogin()` (login principal) y `hkLoginConfirm()` (Housekeeping).
   `authLogout()` y `doLogoutHK()` ahora también hacen `sbClient.auth.signOut()`.
4. **Modo "Invitado / Solo disponibilidad" eliminado** (daba lectura sin login;
   confirmado con el dueño que no se usaba).

Pendiente de mayor hardening (no bloquea, pero queda anotado):
- El PIN de Housekeeping (`HK_USERS`, "0000" para ambas) está hardcodeado en el
  HTML público — cualquiera que vea el código fuente lo conoce. No es secreto real.
  Ideal: migrar Housekeeping a `hv_users` como los demás roles.
- El password/PIN del dueño sigue en su valor default (`administracion` / `0000`)
  en la base de producción — recomendar cambiarlo cuanto antes desde la app.
- Rate limit de `hlv-session` es best-effort en memoria (se resetea si la función
  se recicla); para un hotel esto es aceptable, pero no es un límite duro.

## Estado de verificación (2026-07-04)

✓ Suite import: 11/11 casos verdes (EN/ES/BOM/XLSX/grupal/no-show/basura/fechas/overflow/semicolon)
✓ Sintaxis de los 3 bloques `<script>` validada con Node
✓ Supabase: REST select/upsert/update/delete con anon key ✓, realtime E2E ✓, advisors limpios
  (queda solo el warning esperado de la policy pública), tabla `_temp_transfer` insegura eliminada
✓ Sin bytes NUL en archivos (hubo un incidente de sync de mount que los inyectó una vez — revisar
  con `tr -cd '\000' < archivo | wc -c` tras ediciones grandes)

## Auditoría visual (2026-07-04)

Se levantó la app en Chrome headless (sandbox, copia offline sin config.js para no tocar
datos reales) y se capturaron 22 pantallas: login, dashboard, cotización, disponibilidad,
INE, finanzas, dark mode, housekeeping y mobile 390px. Fixes aplicados: logo roto
(clase `.ls-logo` inexistente → usar `_getLogoHLV()`), contraste del badge de sync en claro,
overlap del topbar en mobile, capitalización de fechas, aviso falso de disponibilidad en
cotización, sistema de botones unificado (.bexp/.bexp-primary), leyenda de habitaciones
discreta, botón HK violeta → verde, links Booking legibles en dark.
Receta para re-capturar: `/tmp/appview/shoot2.js` (sesión Claude) — requiere chrome-headless-shell
+ libXdamage extraída localmente; login de prueba se siembra en localStorage con sha256("0000").
OJO: el password real del dueño NO es el PIN 0000; `hv_users.passwordHash` viene del hash legacy.

## Pendientes / mejoras conocidas (no bloquean deploy)

1. OCR cuaderno: la API key Anthropic vive en localStorage del cliente. Para producción
   seria: Edge Function `ocr-cuaderno` (receta completa en README) — nadie la creó aún.
2. El modelo del OCR (`claude-sonnet-4-20250514` en `importarFotoCuaderno`) convendría
   actualizarlo a uno vigente.
3. RLS abierta: aceptable para uso interno; endurecer si la URL se hace pública.
4. `RESERVAS_CUADERNO` hardcodeado en index.html (fotos de marzo-abril 2026) — datos
   históricos embebidos, candidato a limpieza futura.
5. Fechas ambiguas MM/DD/YYYY (formato USA) se interpretan como DD/MM — Booking no exporta
   así, pero ojo con archivos manuales.

## Cómo deployar (resumen)

1. Subir `index.html` + `config.js` (+ opcionalmente README/manual) a hosting estático
   (Netlify/Vercel/Cloudflare Pages drag&drop, o GitHub Pages).
2. Abrir la URL → login con rol + PIN `0000` → cambiar PIN.
3. Confirmar badge **"Sincronizado ✓"** en la topbar. Si dice "Falta config.js", el
   config.js no se subió o no está junto al index.
4. Probar un import real de Booking apenas se tenga un export a mano.
