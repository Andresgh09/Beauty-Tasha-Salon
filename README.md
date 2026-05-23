# Beauty Tasha Salón

Landing page premium + sistema de reservas con Google Calendar API.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui pattern
- Google Calendar API (Service Account)
- Zod (validación)
- date-fns (manejo de fechas)
- Lucide (iconos)

## Setup

```bash
cd beauty-tasha-salon
npm install
cp .env.local.example .env.local
# Editar .env.local con credenciales de Google Calendar
npm run dev
```

## Google Calendar API — Setup

1. Ir a https://console.cloud.google.com/
2. Crear proyecto (ej. "beauty-tasha-bookings")
3. Habilitar **Google Calendar API**
4. Crear una **Service Account**:
   - IAM & Admin → Service Accounts → Create
   - Generar key JSON
5. Copiar `client_email` y `private_key` al `.env.local`
6. En Google Calendar (cuenta del salón):
   - Configuración del calendario → Compartir con personas específicas
   - Agregar el `client_email` con permiso "Realizar cambios en eventos"
7. Copiar el ID del calendario en `GOOGLE_CALENDAR_ID`

## Estructura

```
app/
  layout.tsx          ← Fonts + metadata
  page.tsx            ← Composición de secciones
  globals.css         ← Tailwind + utilidades
  api/
    availability/     ← GET slots disponibles
    booking/          ← POST crear reserva
components/
  ui/                 ← Button, Card, Input, Label, Badge
  sections/           ← Navbar, Hero, Services, Gallery, About, Testimonials, Footer
  booking/            ← Sistema de reserva multi-step
lib/
  services.ts         ← Catálogo de servicios
  google-calendar.ts  ← Integración con Calendar API
  utils.ts            ← cn(), formatCRC()
```

## Paleta de marca

| Token | Hex |
|---|---|
| mauve-100 | #EADCF0 |
| mauve-200 | #E2CDF4 |
| mauve-300 | #D9BDF8 |
| mauve-400 | #D1AEFC |
| mauve-500 | #C89EFF (brand) |
| mauve-700 | #8B5CF6 (CTAs) |
| charcoal | #2D1B4E (texto) |
| gold | #C9A961 (acento premium) |

## Deploy

Recomendado: **Vercel** (gratis).

```bash
vercel
```

Configurar variables de entorno en Vercel dashboard.

---

Diseñado por **Pipeline Web Studio**
