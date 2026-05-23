/**
 * Script one-time para obtener el refresh_token de Google Calendar.
 *
 * Uso:
 *   node scripts/google-auth.js
 *
 * Va a:
 *  1. Abrir tu navegador en la pantalla de autorización de Google
 *  2. Pedirte login con la cuenta de Tasha (beautytashasalon@gmail.com)
 *  3. Tasha autoriza acceso a Calendar
 *  4. Google redirige a localhost:4280/oauth-callback con un code
 *  5. El script intercambia el code por tokens
 *  6. Imprime el refresh_token (guardar en .env.local como GOOGLE_OAUTH_REFRESH_TOKEN)
 */

const http = require("http");
const { URL } = require("url");
const { exec } = require("child_process");

// Lee credenciales del .env.local
require("dotenv").config({ path: ".env.local" });

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:4280/oauth-callback";
const SCOPE = "https://www.googleapis.com/auth/calendar";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Faltan GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET en .env.local");
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline"); // Para obtener refresh_token
authUrl.searchParams.set("prompt", "consent"); // Forzar pantalla de consent (necesario para refresh_token)

console.log("\n🚀 Abriendo navegador para autorización...");
console.log("\n📋 IMPORTANTE: Inicia sesión con la cuenta de Tasha:");
console.log("   beautytashasalon@gmail.com\n");
console.log("Si no se abre solo, copia esta URL en tu navegador:");
console.log(authUrl.toString(), "\n");

// Abrir browser (Windows)
const openCmd = process.platform === "win32" ? "start" :
                process.platform === "darwin" ? "open" : "xdg-open";
exec(`${openCmd} "${authUrl.toString()}"`);

// Servidor local para capturar el callback
const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/oauth-callback")) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:4280`);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h1>❌ Error: ${error}</h1>`);
    console.error("\n❌ Autorización rechazada:", error);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>No code received</h1>");
    return;
  }

  // Intercambiar code por tokens
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code"
      })
    });

    const tokens = await tokenRes.json();

    if (!tokens.refresh_token) {
      res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h1>⚠️ No se recibió refresh_token</h1>
        <p>Esto pasa si ya autorizaste antes. Ve a
        <a href="https://myaccount.google.com/permissions" target="_blank">myaccount.google.com/permissions</a>,
        elimina "Beauty Tasha Salón" y vuelve a correr el script.</p>`);
      console.error("\n⚠️  No refresh_token. Respuesta:", JSON.stringify(tokens, null, 2));
      server.close();
      return;
    }

    // ✅ Éxito
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <!DOCTYPE html>
      <html><head><title>✓ Autorización exitosa</title>
      <style>
        body { font-family: system-ui; max-width: 600px; margin: 40px auto; padding: 20px;
               background: linear-gradient(135deg, #EADCF0, #D9BDF8); min-height: 90vh; }
        .card { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 20px 60px -20px rgba(139,92,246,0.25); }
        h1 { color: #2D1B4E; }
        .check { font-size: 64px; }
      </style></head><body>
      <div class="card">
        <div class="check">✨</div>
        <h1>¡Listo, Tasha!</h1>
        <p>Autorizaste exitosamente la conexión con Beauty Tasha Salón.</p>
        <p>Ya podés cerrar esta pestaña.</p>
      </div></body></html>
    `);

    console.log("\n✅ ¡ÉXITO! refresh_token obtenido:\n");
    console.log("─".repeat(70));
    console.log(tokens.refresh_token);
    console.log("─".repeat(70));
    console.log("\n📝 Próximos pasos:");
    console.log("1. Copia el token de arriba");
    console.log("2. Pégalo en .env.local reemplazando 'PENDIENTE' en GOOGLE_OAUTH_REFRESH_TOKEN=");
    console.log("3. Avísale a Claude que ya está\n");

    setTimeout(() => {
      server.close();
      process.exit(0);
    }, 500);
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h1>Error: ${e.message}</h1>`);
    console.error("\n❌ Error intercambiando token:", e);
    server.close();
    process.exit(1);
  }
});

server.listen(4280, () => {
  console.log("⏳ Esperando autorización en http://localhost:4280/oauth-callback ...");
});
