// ===== STRIPE PAYMENT =====
// La Publishable Key es pública por diseño de Stripe — es seguro tenerla aquí.
// Solo la Secret Key debe mantenerse privada (en .env, nunca en el código).
const STRIPE_PUBLISHABLE_KEY = "pk_test_51T9TAUCdA8vpL5CPo3vCGeOUDXjEg4EaRpLPb6d9qwuklkOJcwd8g2dOb2inyhPjbGSTJWPiOI9aDeo1T22Ek09D00c0UTwgo8";
const BACKEND_URL             = "http://localhost:4242";
const IS_LOCALHOST            = ["localhost", "127.0.0.1"].includes(location.hostname);

const TEST_CARDS = [
  { number: "4242 4242 4242 4242", label: "✅ Pago exitoso"        },
  { number: "4000 0000 0000 0002", label: "❌ Tarjeta rechazada"   },
  { number: "4000 0025 0000 3155", label: "🔐 Requiere 3D Secure"  },
  { number: "4000 0000 0000 9995", label: "❌ Fondos insuficientes" },
];

// Una sola variable de modo: "payment-intent" | "card-only"
let stripeInstance = null;
let stripeElements = null;   // instancia de elements()
let cardEl         = null;   // solo en modo card-only
let stripeMode     = null;
let initialized    = false;

// ── Cargar Stripe.js ─────────────────────────────────────────────
function loadStripeJS() {
  return new Promise((resolve, reject) => {
    if (window.Stripe) { resolve(); return; }
    const s   = document.createElement("script");
    s.src     = "https://js.stripe.com/v3/";
    s.onload  = resolve;
    s.onerror = () => reject(new Error("No se pudo cargar Stripe.js"));
    document.head.appendChild(s);
  });
}

// ── Init ─────────────────────────────────────────────────────────
async function initStripe() {
  if (initialized) return;

  const keyEl = document.getElementById("stripe-key-display");
  keyEl.textContent = "Conectando...";
  showPaymentStatus("loading", "⏳ Conectando con Stripe...");

  try {
    await loadStripeJS();

    // La Publishable Key es segura en el frontend — Stripe la diseñó así.
    // Solo la Secret Key debe estar en el servidor (.env).
    stripeInstance = window.Stripe(STRIPE_PUBLISHABLE_KEY);

    if (IS_LOCALHOST) {
      await setupPaymentIntent();
    } else {
      await setupCardOnly();
    }

    initialized = true;

  } catch (err) {
    keyEl.textContent = "Error";
    showPaymentStatus("error",
      `❌ <b>Error al conectar con Stripe</b><br>
       <small style="color:#ffaaaa">${err.message}</small>`
    );
  }
}

// ── MODO A: PaymentIntent con backend (pago real en Dashboard) ───
async function setupPaymentIntent() {
  showPaymentStatus("loading", "⏳ Creando sesión de pago...");

  // Llamar al backend
  let data;
  try {
    const res = await fetch(`${BACKEND_URL}/create-payment-intent`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ amount: 5000, currency: "usd" }),
    });
    data = await res.json();
  } catch (e) {
    throw new Error("No se pudo contactar el servidor. ¿Está corriendo node server.js?");
  }

  if (data.error) throw new Error(data.error);

  // Ocultar campo de nombre (PaymentElement lo incluye)
  document.getElementById("cardholder-name-group").style.display = "none";

  // Mostrar el wrapper antes de montar
  document.getElementById("stripe-card-wrapper").style.display = "block";

  stripeElements = stripeInstance.elements({
    clientSecret: data.clientSecret,
    appearance: {
      theme: "night",
      variables: {
        colorPrimary:    "#1db954",
        colorBackground: "#0d0d0d",
        colorText:       "#ffffff",
        colorDanger:     "#ff5555",
        fontFamily:      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        borderRadius:    "8px",
      },
    },
  });

  const paymentElement = stripeElements.create("payment");
  paymentElement.mount("#card-element");

  stripeMode = "payment-intent";
  document.getElementById("stripe-key-display").textContent = "localhost:4242 ✓ — Pagos reales activos";
  document.getElementById("submit-payment").disabled = false;
  hidePaymentStatus();
}

// ── MODO B: CardElement sin backend (solo valida) ────────────────
async function setupCardOnly() {
  // Mostrar campo de nombre y wrapper
  document.getElementById("cardholder-name-group").style.display = "block";
  document.getElementById("stripe-card-wrapper").style.display   = "block";

  stripeElements = stripeInstance.elements();

  cardEl = stripeElements.create("card", {
    hidePostalCode: true,
    style: {
      base: {
        color:           "#ffffff",
        backgroundColor: "#0d0d0d",
        fontFamily:      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize:        "16px",
        fontSmoothing:   "antialiased",
        "::placeholder": { color: "#555" },
        iconColor:       "#1db954",
      },
      invalid: { color: "#ff5555", iconColor: "#ff5555" },
    },
  });

  cardEl.mount("#card-element");

  cardEl.on("change", (e) => {
    if (e.error)        showPaymentStatus("error", "⚠️ " + e.error.message);
    else if (e.complete) showPaymentStatus("info", "✔ Tarjeta lista — presiona <b>Pagar</b>.");
    else                hidePaymentStatus();
  });

  stripeMode = "card-only";
  document.getElementById("stripe-key-display").textContent =
    STRIPE_PUBLISHABLE_KEY.slice(0, 20) + "... (sin backend)";
  document.getElementById("submit-payment").disabled = false;
  hidePaymentStatus();
}

// ── Submit ───────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderTestCardsTable();

  document.getElementById("payment-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!stripeInstance || !stripeMode) return;

    const btn        = document.getElementById("submit-payment");
    btn.disabled     = true;
    btn.textContent  = "Procesando...";
    showPaymentStatus("loading", "⏳ Procesando pago con Stripe...");

    try {
      if (stripeMode === "payment-intent") {
        // Confirmar pago real — aparecerá en Stripe Dashboard
        const { error } = await stripeInstance.confirmPayment({
          elements:      stripeElements,
          confirmParams: { return_url: `${BACKEND_URL}?payment=success` },
          redirect:      "if_required",
        });
        if (error) {
          showPaymentStatus("error", buildErrorMessage(error));
        } else {
          showPaymentStatus("success",
            `✅ <b>¡Pago completado!</b><br>
             <small style="color:#7ee8a2">Aparece en tu Stripe Dashboard → Payments.</small>`
          );
          confettiEffect();
        }

      } else {
        // Validar tarjeta sin backend
        const name = document.getElementById("cardholder-name").value.trim() || "Usuario SoundRate";
        const { paymentMethod, error } = await stripeInstance.createPaymentMethod({
          type:             "card",
          card:             cardEl,        // cardEl nunca es null en este modo
          billing_details:  { name },
        });
        if (error) {
          showPaymentStatus("error", buildErrorMessage(error));
        } else {
          showPaymentStatus("success",
            `✅ <b>¡Tarjeta verificada!</b><br>
             ${capitalize(paymentMethod.card.brand)} •••• ${paymentMethod.card.last4}<br>
             <small style="color:#aaa">Inicia el servidor para registrar pagos reales.</small>`
          );
          confettiEffect();
          cardEl.clear();
          document.getElementById("cardholder-name").value = "";
        }
      }

    } catch (err) {
      showPaymentStatus("error", "❌ Error inesperado: " + err.message);
    }

    btn.disabled    = false;
    btn.textContent = "Pagar $50.00";
  });
});

// ── Helpers ──────────────────────────────────────────────────────
function buildErrorMessage(error) {
  const map = {
    card_declined:           "❌ <b>Tarjeta rechazada</b> — El banco no autorizó el pago.",
    insufficient_funds:      "❌ <b>Fondos insuficientes</b> — Sin saldo suficiente.",
    expired_card:            "❌ <b>Tarjeta expirada</b> — Verifica la fecha.",
    incorrect_cvc:           "❌ <b>CVC incorrecto</b> — El código no coincide.",
    incorrect_number:        "❌ <b>Número inválido</b> — Verifica los dígitos.",
    authentication_required: "🔐 <b>Requiere 3D Secure</b> — El banco solicita verificación adicional.",
  };
  return map[error.code] || ("❌ " + (error.message || "Error al procesar."));
}

function showPaymentStatus(type, message) {
  const el         = document.getElementById("payment-status");
  el.className     = "payment-status payment-status--" + type;
  el.innerHTML     = message;
  el.style.display = "block";
}
function hidePaymentStatus() {
  document.getElementById("payment-status").style.display = "none";
}

function renderTestCardsTable() {
  const tbody = document.getElementById("test-cards-body");
  if (!tbody) return;
  tbody.innerHTML = TEST_CARDS.map(c => `
    <tr>
      <td><code class="copy-card" title="Clic para copiar">${c.number}</code></td>
      <td>12/29</td><td>123</td><td>${c.label}</td>
    </tr>`).join("");

  tbody.querySelectorAll(".copy-card").forEach(el => {
    el.style.cursor = "pointer";
    el.addEventListener("click", () => {
      navigator.clipboard.writeText(el.textContent.replace(/\s/g, "")).then(() => {
        const orig = el.textContent;
        el.textContent = "¡Copiado!";
        setTimeout(() => (el.textContent = orig), 1200);
      });
    });
  });
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }

function confettiEffect() {
  const colors = ["#1db954", "#ffffff", "#b3b3b3", "#5edd8a"];
  for (let i = 0; i < 70; i++) {
    const d = document.createElement("div");
    d.style.cssText = `
      position:fixed;pointer-events:none;z-index:9999;border-radius:50%;
      width:${Math.random()*9+4}px;height:${Math.random()*9+4}px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      left:${Math.random()*100}vw;top:-10px;
      animation:fall ${Math.random()*2+1.5}s ease-in forwards;
      animation-delay:${Math.random()*0.6}s;`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 4000);
  }
}

window.initStripePayment = initStripe;
