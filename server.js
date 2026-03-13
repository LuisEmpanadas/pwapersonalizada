// ===== SOUNDRATE - SERVIDOR DE PAGOS =====
//
// SETUP:
//   1. Crea un archivo llamado  .env  en esta misma carpeta
//   2. Dentro del .env pon una sola línea:
//        STRIPE_SECRET_KEY=sk_test_TU_CLAVE_AQUI
//   3. npm install
//   4. node server.js
//   5. Abre http://localhost:4242
//
// La Secret Key la encuentras en:
//   Stripe Dashboard → Developers → API Keys → Secret key (sk_test_...)

import express           from "express";
import Stripe            from "stripe";
import cors              from "cors";
import path              from "path";
import { readFileSync }  from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Leer .env manualmente (sin dependencia extra) ────────────────
function loadEnv() {
  try {
    const envFile = readFileSync(path.join(__dirname, ".env"), "utf-8");
    for (const line of envFile.split("\n")) {
      const [key, ...rest] = line.split("=");
      if (key && rest.length) {
        process.env[key.trim()] = rest.join("=").trim();
      }
    }
  } catch {
    // .env no existe, usar variables de entorno del sistema si las hay
  }
}
loadEnv();

// ── Secret Key ───────────────────────────────────────────────────
const SECRET_KEY      = process.env.STRIPE_SECRET_KEY      || "";
const PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "";

if (!SECRET_KEY || SECRET_KEY.includes("TU_CLAVE")) {
  console.error(`
╔══════════════════════════════════════════════════════╗
║  ❌  SECRET KEY NO CONFIGURADA                       ║
║                                                      ║
║  1. Crea el archivo  .env  en esta carpeta           ║
║  2. Agrega esta línea dentro:                        ║
║     STRIPE_SECRET_KEY=sk_test_...                    ║
║  3. Guarda y vuelve a correr:  node server.js        ║
╚══════════════════════════════════════════════════════╝
  `);
}

const stripe = SECRET_KEY && !SECRET_KEY.includes("TU_CLAVE")
  ? new Stripe(SECRET_KEY)
  : null;

// ── App ──────────────────────────────────────────────────────────
const app = express();

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", [
    "default-src 'self'",
    "script-src 'self' https://js.stripe.com https://m.stripe.network 'unsafe-inline'",
    "frame-src https://js.stripe.com https://hooks.stripe.com https://m.stripe.network",
    "connect-src 'self' https://api.stripe.com https://m.stripe.network https://q.stripe.com",
    "img-src 'self' https://*.stripe.com https://images.unsplash.com https://via.placeholder.com data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
  ].join("; "));
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ── GET /config — entrega la publishable key al frontend ────────
// Así la clave nunca está hardcodeada en el JS público
app.get("/config", (req, res) => {
  res.json({ publishableKey: PUBLISHABLE_KEY });
});

// ── POST /create-payment-intent ──────────────────────────────────
app.post("/create-payment-intent", async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      error: "Secret Key no configurada. Crea el archivo .env con tu STRIPE_SECRET_KEY y reinicia."
    });
  }
  try {
    const { amount = 5000, currency = "usd" } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { app: "SoundRate", plan: "Premium Anual" },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = 4242;
app.listen(PORT, () => {
  console.log(`\n✅ Servidor corriendo en http://localhost:${PORT}`);
  if (stripe) {
    console.log("   ✓ Stripe configurado correctamente");
    console.log(`   ✓ Secret Key: ${SECRET_KEY.slice(0, 15)}...`);
  } else {
    console.log("   ⚠️  Stripe NO configurado — crea el archivo .env");
  }
  console.log("");
});
