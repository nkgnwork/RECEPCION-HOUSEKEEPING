# Hotel Las Vicuñas — Recepción & Housekeeping

**Versión:** v4.3 · Build 20260510
**Ubicación:** Baquedano 100, Putre, Arica y Parinacota, Chile (3.500 msnm)

App web single-file (HTML+JS+CSS) para gestión de reservas, disponibilidad, INE y housekeeping. Funciona offline (localStorage) y sincroniza en tiempo real entre dispositivos vía Supabase.

---

## Contenido del paquete de deploy

| Archivo | Descripción |
|---|---|
| `index.html` | La aplicación principal. **No contiene credenciales.** |
| `config.js` | Credenciales del entorno (Supabase). **No commitear al repo público.** |
| `.env.example` | Plantilla de variables — copiá a `.env` para nuevos deploys. |
| `.gitignore` | Bloquea commits accidentales de `config.js` y `.env`. |
| `Manual_Uso_HLV_Recepcion_v4.3.docx` | Manual de usuario para recepción. |
| `README.md` | Este archivo. |

> ⚠️ **Importante**: subí los 4 archivos del root (incluyendo `config.js`) al hosting. Sin `config.js` la app corre offline (solo localStorage) hasta que el dueño configure las credenciales manualmente desde el modal.

---

## Requisitos

- Navegador moderno (Chrome 120+, Edge 120+, Firefox 120+, Safari 17+).
- Conexión a Internet (para CDN de Supabase y XLSX, y para sincronización real-time). En modo offline, la app sigue funcionando con localStorage.
- Cuenta de Supabase (gratis, sin tarjeta). Las credenciales de producción vienen hardcodeadas en `index.html` hacia el final, sección `SB_HARDCODED`.

## CDNs externos cargados

- `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` — cliente Supabase
- `https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js` — SheetJS (import Booking CSV/Excel)

Si deployás en red cerrada, descargá estos dos archivos y reemplazá los `<script src="...">` correspondientes por rutas locales.

---

## Opciones de despliegue

### 1) Uso local directo (más simple)
Abrí `index.html` en el navegador con doble click, o arrastrala a Chrome. La app corre 100 % en el cliente. Datos persisten en localStorage del navegador.

### 2) Servir como sitio web estático
Subí `index.html` a cualquier hosting estático:

- **Netlify / Vercel / Cloudflare Pages:** drag & drop de `index.html`.
- **GitHub Pages:** commit del archivo en un repo y activá Pages.
- **Servidor propio:** cualquier Nginx / Apache / caddy sirve el archivo.

Ejemplo rápido local:
```bash
cd "Apps en Deploy/RECEPCION HOUSEKEEPING"
python3 -m http.server 8080
# Luego abrir http://localhost:8080/index.html
```

### 3) Dominio propio
Apuntá un dominio (ej. `recepcion.hotellasvicunas.cl`) al hosting y dejá `index.html` como `index` del sitio. Ya está — no hay backend ni build step.

---

## Primer arranque

1. Abrir la app.
2. Splash pide rol: **Dueño / Gerente / Recepción / Contabilidad / Housekeeping**.
3. **PIN por defecto de todos los roles en el primer ingreso: `0000`**.
   - La app pide cambiarlo apenas entrás por primera vez.
   - El dueño puede resetear todos los PIN al valor `0000` desde "Usuarios" si lo necesita.
4. Una vez dentro, la app sincroniza con Supabase automáticamente (indicador de sync en la topbar). Si no hay red o Supabase cae, sigue funcionando con localStorage.

---

## Configuración de credenciales (config.js)

Las credenciales viven **fuera** de `index.html`, en `config.js`. Esto permite:

- Cambiar el proyecto de Supabase sin tocar el código.
- Subir `index.html` a un repo público sin exponer keys.
- Tener distintos `config.js` por entorno (dev / staging / prod).

### A) Editar config.js
Abrí `config.js` y completá los valores:
```js
window.HLV_CONFIG = {
  SUPABASE_URL:      "https://TU-PROYECTO.supabase.co",
  SUPABASE_ANON_KEY: "TU-ANON-KEY",
  ANTHROPIC_API_KEY: ""  // opcional, ver sección "Anthropic API"
};
```

### Workflow para entornos nuevos
1. Copiá `.env.example` → `.env` (no commitear).
2. Completá `.env` con los valores reales.
3. Generá `config.js` manualmente o con un script:
   ```bash
   # ejemplo de generador simple
   source .env
   cat > config.js <<EOF
   window.HLV_CONFIG = {
     SUPABASE_URL: "$SUPABASE_URL",
     SUPABASE_ANON_KEY: "$SUPABASE_ANON_KEY",
     ANTHROPIC_API_KEY: ""
   };
   EOF
   ```
4. Subí `index.html` + `config.js` al hosting.
5. **Nunca** subas `config.js` ni `.env` al repo público — están bloqueados por `.gitignore`.

### B) SQL inicial (una sola vez en el SQL Editor de Supabase)
```sql
CREATE TABLE hotel_data (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE hotel_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON hotel_data FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE hotel_data;
```

> La política "public_access" usa la **anon key** desde el cliente; la app es de uso interno del hotel y no expone la base a terceros. Si necesitás restringir acceso, cambiá la policy a una que valide JWT de usuarios autenticados.

---

## Claves de la app

- **PIN por defecto:** `0000` (todos los roles, primer ingreso).
- **Roles:** Dueño (full control), Gerente, Recepción, Contabilidad, Housekeeping.
- **Datos que persisten:** reservas, registros INE, Booking import, housekeeping, papelera, auditoría, usuarios, estados de habitación.
- **Formato INE:** Excel oficial exportable con 22 columnas del template SII / turismo.
- **Compatibilidad Booking:** CSV y Excel (`.xlsx`) con detección automática de columnas EN/ES.

---

## Ediciones recientes (Build 20260510)

**Bugfixes operativos (10 may 2026):**
- Pre-registro: rate limit ahora persiste en localStorage (no se resetea al recargar la página).
- Auto-import del cuaderno: throttle de 24h para no saturar el audit log si la app se abre/cierra muchas veces.
- Audit log: aviso preventivo a 4500 entradas + resumen de eventos archivados al rotar el corte de 5000.
- `fmtFC()` ahora valida fechas reales: rechaza `2026-13-45` y similares en lugar de formatearlos.
- Tooltip de Booking: el precio se normaliza a "$X.XXX" antes de mostrarse, evitando UI rota con valores NaN o strings raros.
- Copiar link de pre-registro: fallback con `<textarea>` invisible en lugar del `prompt()` deprecated.

**Build 20260430 — Hardening + Mobile:**
- Hardening XSS: todos los campos provenientes de Booking import / OCR de cuaderno (patente, número de reserva, país, canal, número de documento, etc.) se escapan correctamente al renderizarse en pantalla y en impresiones.
- `sha256()` con fallback determinista para entornos `file://` o HTTP donde `crypto.subtle` no está disponible — evita romper login.
- Housekeeping: layout responsive completo para teléfonos (≤480px y ≤360px). Cards, supplies y modales con padding y tipografía adaptados.

**Build 20260423:**
- Booking → INE: email / remarks / notas / booked-on / método de pago propagados automáticamente a cada ficha de pasajero.
- Modal "Pasajeros faltantes" con campos extra (email, teléfono, patente) para el titular.
- INE: tabla agrupada por mes-año con cabeceras colapsables. Filtro de meses dinámico YYYY-MM.
- Papelera: agrupada por mes de eliminación con cabeceras colapsables.
- Cotización: stepper +/- para noches (el check-out se recalcula solo; ya no hay que escribir la fecha).
- Unificación de logos y cabeceras en ficha individual, ficha grupal y confirmación impresa.
- Reset masivo de PINs al default `0000` (desde "Usuarios" del dueño).

---

## Anthropic API (opcional, para OCR de cuaderno)

La función "Importar foto de cuaderno" usa la API de Anthropic Claude Vision. Hay dos modos:

### Modo cliente (default)
Cada usuario pega su API key personal en localStorage al primer uso. La key vive solo en su browser. Simple, pero la key queda accesible en DevTools.

### Modo server-side (recomendado para producción real)
Crear una **Edge Function** de Supabase que reciba la imagen y haga el llamado a Anthropic con la key guardada en los secretos del proyecto:

```ts
// supabase/functions/ocr-cuaderno/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { image_base64, prompt } = await req.json()
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")  // secreto del proyecto

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image_base64 } },
          { type: "text", text: prompt }
        ]
      }]
    })
  })
  return new Response(await r.text(), { headers: { "Content-Type": "application/json" } })
})
```

Deploy:
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy ocr-cuaderno
```

Después modificás `importarFotoCuaderno()` en `index.html` para llamar a `${SUPABASE_URL}/functions/v1/ocr-cuaderno` con el JWT del usuario en lugar de llamar a Anthropic directamente.

---

## Soporte

- Manual de usuario: `Manual_Uso_HLV_Recepcion_v4.3.docx`.
- Problemas o bugs: anotar en el diagnóstico del hotel. Backup automático de localStorage se guarda dentro de la app (botón "Exportar backup" en ajustes de dueño).

---

## Respaldo y restauración

- **Exportar backup:** Ajustes del dueño → Exportar JSON (contiene reservas + registros + booking + papelera).
- **Importar backup:** mismo panel → Importar JSON.
- **Migración a otro dispositivo:** basta con tener la misma URL de Supabase configurada; los datos se sincronizan automáticamente al loguearse.
