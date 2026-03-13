// ===== CAMBIO DE PESTAÑAS =====
const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");
let stripeInitialized = false;

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    contents.forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");

    // Inicializar Stripe solo la primera vez que se abre la pestaña de pago.
    // requestAnimationFrame garantiza que el tab sea visible antes de que
    // Stripe intente montar el CardElement en el DOM.
    if (tab.dataset.tab === "payment" && !stripeInitialized) {
      stripeInitialized = true;
      requestAnimationFrame(() => {
        if (typeof window.initStripePayment === "function") {
          window.initStripePayment();
        }
      });
    }
  });
});

// ===== CHATBOT =====
const messagesDiv = document.getElementById("chat-messages");
const quickContainer = document.getElementById("quick-questions");

function addMessage(text, isUser = false) {
  const msg = document.createElement("div");
  msg.className = `msg ${isUser ? "msg-user" : "msg-bot"}`;
  msg.innerHTML = text;
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showOptions(buttons) {
  quickContainer.innerHTML = "";
  buttons.forEach(({ label, key }) => {
    const btn = document.createElement("button");
    btn.className = "quick-btn";
    btn.dataset.q = key;
    btn.textContent = label;
    btn.addEventListener("click", handleClick);
    quickContainer.appendChild(btn);
  });
}

// ===== ÁRBOL DE CONVERSACIÓN =====
const tree = {

  // ── MENÚ PRINCIPAL ──────────────────────────────────────────────
  main: {
    options: [
      { label: "No puedo iniciar sesión o olvidé mi contraseña", key: "login" },
      { label: "La página no carga o se queda cargando",         key: "carga" },
      { label: "Problemas con mi perfil (foto, nombre, email)",  key: "perfil" },
      { label: "Aparece un mensaje de error o algo no funciona", key: "error" },
      { label: "Quiero eliminar mi cuenta",                      key: "borrar-cuenta" },
      { label: "Tengo una sugerencia o quiero reportar un bug",  key: "sugerencia" },
      { label: "Otro problema / consulta",                       key: "otro" },
    ],
  },

  // ── LOGIN ────────────────────────────────────────────────────────
  login: {
    reply: "Entendido. ¿Cuál es el problema exacto con tu acceso?",
    options: [
      { label: "Olvidé mi contraseña",                    key: "login-pass" },
      { label: "Mi correo o usuario no es reconocido",    key: "login-email" },
      { label: "La sesión se cierra sola constantemente", key: "login-sesion" },
      { label: "No recibo el correo de verificación",     key: "login-verif" },
      { label: "Volver al menú principal",                key: "volver" },
    ],
  },
  "login-pass": {
    reply: "Ve a la pantalla de inicio de sesión y haz clic en <b>«Olvidé mi contraseña»</b>. Recibirás un enlace en tu correo. Si no aparece, revisa la carpeta de spam o promociones.",
    options: [
      { label: "El correo no llegó ni en spam", key: "login-pass-noemail" },
      { label: "El enlace expiró o da error",   key: "login-pass-expired" },
      { label: "Eso resolvió mi problema ✓",    key: "resuelto" },
      { label: "Volver al menú principal",      key: "volver" },
    ],
  },
  "login-pass-noemail": {
    reply: "Asegúrate de que el correo ingresado sea el mismo con el que te registraste. Si tienes varios correos, pruébalos uno a uno. Si el problema persiste, contáctanos a <b>soporte@soundrate.com</b>.",
    options: [
      { label: "Eso resolvió mi problema ✓", key: "resuelto" },
      { label: "Sigue sin funcionar",        key: "escalar" },
      { label: "Volver al menú principal",   key: "volver" },
    ],
  },
  "login-pass-expired": {
    reply: "Los enlaces de restablecimiento expiran en <b>15 minutos</b>. Solicita uno nuevo desde la pantalla de login y úsalo de inmediato sin cerrar la pestaña.",
    options: [
      { label: "Eso resolvió mi problema ✓", key: "resuelto" },
      { label: "Sigue sin funcionar",        key: "escalar" },
      { label: "Volver al menú principal",   key: "volver" },
    ],
  },
  "login-email": {
    reply: "Puede que te hayas registrado con otra dirección o con Google/Apple. Prueba las opciones de <b>«Continuar con Google»</b> o <b>«Continuar con Apple»</b> en la pantalla de login.",
    options: [
      { label: "Me registré con correo normal", key: "login-email-normal" },
      { label: "Eso resolvió mi problema ✓",    key: "resuelto" },
      { label: "Volver al menú principal",      key: "volver" },
    ],
  },
  "login-email-normal": {
    reply: "En ese caso tu cuenta podría haber sido eliminada o el correo tiene un error tipográfico. Escríbenos a <b>soporte@soundrate.com</b> con tu nombre de usuario y te ayudamos a localizarla.",
    options: [
      { label: "Eso resolvió mi problema ✓", key: "resuelto" },
      { label: "Volver al menú principal",   key: "volver" },
    ],
  },
  "login-sesion": {
    reply: "Esto ocurre cuando el token de sesión expira o hay conflicto con el navegador. Prueba: <b>1)</b> Borrar cookies del sitio. <b>2)</b> Activar «Mantener sesión iniciada» al hacer login. <b>3)</b> Usar un navegador diferente.",
    options: [
      { label: "Eso resolvió mi problema ✓", key: "resuelto" },
      { label: "Sigue cerrando la sesión",   key: "escalar" },
      { label: "Volver al menú principal",   key: "volver" },
    ],
  },
  "login-verif": {
    reply: "Revisa spam y la pestaña de Promociones. Si en 5 minutos no llega, solicita un nuevo correo desde la pantalla de verificación y asegúrate de que el correo no tenga errores tipográficos.",
    options: [
      { label: "Eso resolvió mi problema ✓", key: "resuelto" },
      { label: "Sigue sin llegar",           key: "escalar" },
      { label: "Volver al menú principal",   key: "volver" },
    ],
  },

  // ── CARGA ────────────────────────────────────────────────────────
  carga: {
    reply: "Lamentamos el inconveniente. ¿Cómo se manifiesta el problema de carga?",
    options: [
      { label: "La página completa no carga (pantalla en blanco)", key: "carga-blanco" },
      { label: "Al cambiar de pestaña, las páginas no responden",  key: "carga-tabs" },
      { label: "Las imágenes o álbumes no cargan",                 key: "carga-imagenes" },
      { label: "Carga muy lento pero finalmente aparece",          key: "carga-lento" },
      { label: "Volver al menú principal",                         key: "volver" },
    ],
  },
  "carga-blanco": {
    reply: "Una pantalla en blanco suele indicar un error de JavaScript. Prueba: <b>1)</b> Recargar con Ctrl+Shift+R. <b>2)</b> Abrir en modo incógnito. <b>3)</b> Probar en otro navegador como Chrome o Firefox.",
    options: [
      { label: "Funciona en otro navegador", key: "carga-blanco-otro" },
      { label: "No funciona en ningún lado", key: "escalar" },
      { label: "Eso resolvió mi problema ✓", key: "resuelto" },
      { label: "Volver al menú principal",   key: "volver" },
    ],
  },
  "carga-blanco-otro": {
    reply: "El problema es específico de ese navegador. Ve a <b>Configuración → Privacidad → Borrar datos de navegación</b> y limpia el caché completo. Si persiste, actualiza el navegador.",
    options: [
      { label: "Eso resolvió mi problema ✓", key: "resuelto" },
      { label: "Sigue igual",                key: "escalar" },
      { label: "Volver al menú principal",   key: "volver" },
    ],
  },
  "carga-tabs": {
    reply: "Si al hacer clic en <b>Perfil, Reviews o Soporte</b> el contenido no cambia, puede ser un conflicto con extensiones del navegador o caché corrupta. Prueba en modo incógnito (sin extensiones activas).",
    options: [
      { label: "En incógnito funciona bien", key: "carga-tabs-extension" },
      { label: "En incógnito tampoco",       key: "escalar" },
      { label: "Eso resolvió mi problema ✓", key: "resuelto" },
      { label: "Volver al menú principal",   key: "volver" },
    ],
  },
  "carga-tabs-extension": {
    reply: "Alguna extensión está interfiriendo. Ve a las extensiones del navegador y desactívalas una a una hasta encontrar la culpable. Los bloqueadores de scripts y VPNs suelen ser los responsables.",
    options: [
      { label: "Eso resolvió mi problema ✓", key: "resuelto" },
      { label: "No encontré la extensión",   key: "escalar" },
      { label: "Volver al menú principal",   key: "volver" },
    ],
  },
  "carga-imagenes": {
    reply: "Si las portadas de álbumes no cargan, un bloqueador de contenido puede estar filtrándolas. ¿Tienes algún bloqueador de anuncios activo?",
    options: [
      { label: "Sí, tengo bloqueador de anuncios", key: "carga-imagenes-adblock" },
      { label: "No, no tengo ninguno",              key: "carga-imagenes-red" },
      { label: "Eso resolvió mi problema ✓",        key: "resuelto" },
      { label: "Volver al menú principal",          key: "volver" },
    ],
  },
  "carga-imagenes-adblock": {
    reply: "Añade SoundRate a la <b>lista blanca</b> de tu bloqueador. Esto no activará publicidad, solo permitirá cargar los recursos propios del sitio como imágenes y portadas.",
    options: [
      { label: "Eso resolvió mi problema ✓", key: "resuelto" },
      { label: "Sigue sin cargar",           key: "escalar" },
      { label: "Volver al menú principal",   key: "volver" },
    ],
  },
  "carga-imagenes-red": {
    reply: "Puede ser un problema de red. Prueba desde otra WiFi o con datos móviles. Si solo falla en una red específica, el router o firewall podría estar bloqueando el dominio de imágenes.",
    options: [
      { label: "Eso resolvió mi problema ✓", key: "resuelto" },
      { label: "Falla en todas las redes",   key: "escalar" },
      { label: "Volver al menú principal",   key: "volver" },
    ],
  },
  "carga-lento": {
    reply: "Una carga lenta puede deberse a tu conexión o caché acumulada. Prueba: <b>1)</b> Verificar velocidad en fast.com. <b>2)</b> Borrar la caché del navegador. <b>3)</b> Cerrar otras pestañas que consuman ancho de banda.",
    options: [
      { label: "Eso resolvió mi problema ✓", key: "resuelto" },
      { label: "Sigue muy lento",            key: "escalar" },
      { label: "Volver al menú principal",   key: "volver" },
    ],
  },

  // ── PERFIL ───────────────────────────────────────────────────────
  perfil: {
    reply: "¿Qué parte de tu perfil está dando problemas?",
    options: [
      { label: "No puedo cambiar mi foto de perfil",    key: "perfil-foto" },
      { label: "No puedo cambiar mi nombre o username", key: "perfil-nombre" },
      { label: "No puedo cambiar mi correo",            key: "perfil-email" },
      { label: "Los cambios no se guardan",             key: "perfil-guardado" },
      { label: "Volver al menú principal",              key: "volver" },
    ],
  },
  "perfil-foto": {
    reply: "Ve a <b>Perfil → Editar → Foto</b>. La imagen debe ser JPG o PNG y no pesar más de <b>5 MB</b>. Si el botón no responde, prueba en otro navegador.",
    options: [
      { label: "El archivo cumple los requisitos pero falla", key: "escalar" },
      { label: "Eso resolvió mi problema ✓",                  key: "resuelto" },
      { label: "Volver al menú principal",                    key: "volver" },
    ],
  },
  "perfil-nombre": {
    reply: "Ve a <b>Perfil → Editar → Información básica</b>. Ten en cuenta que el username solo puede cambiarse <b>una vez cada 30 días</b>.",
    options: [
      { label: "No me deja aunque pasaron 30 días", key: "escalar" },
      { label: "Eso resolvió mi problema ✓",        key: "resuelto" },
      { label: "Volver al menú principal",          key: "volver" },
    ],
  },
  "perfil-email": {
    reply: "Ve a <b>Configuración → Cuenta → Correo electrónico</b>. Se enviará un enlace de confirmación al nuevo correo. Debes confirmarlo desde la nueva bandeja.",
    options: [
      { label: "No recibo el correo de confirmación", key: "login-verif" },
      { label: "Eso resolvió mi problema ✓",          key: "resuelto" },
      { label: "Volver al menú principal",            key: "volver" },
    ],
  },
  "perfil-guardado": {
    reply: "Si los cambios no se guardan, puede ser una sesión expirada. Prueba: <b>1)</b> Cerrar sesión y volver a entrar. <b>2)</b> Borrar cookies. <b>3)</b> Usar otro navegador.",
    options: [
      { label: "Aparece un mensaje de error específico", key: "error" },
      { label: "No aparece error pero no guarda",        key: "escalar" },
      { label: "Eso resolvió mi problema ✓",             key: "resuelto" },
      { label: "Volver al menú principal",               key: "volver" },
    ],
  },

  // ── ERROR ────────────────────────────────────────────────────────
  error: {
    reply: "¿Qué tipo de error estás viendo?",
    options: [
      { label: "Error 404 – Página no encontrada",         key: "error-404" },
      { label: "Error 500 o «Error interno del servidor»", key: "error-500" },
      { label: "«Sin conexión» o error de red",            key: "error-red" },
      { label: "Un pop-up de error sin código claro",      key: "error-popup" },
      { label: "Volver al menú principal",                 key: "volver" },
    ],
  },
  "error-404": {
    reply: "El error 404 significa que la página no existe o la URL cambió. Si llegaste desde un enlace guardado puede estar desactualizado. Intenta navegar desde la página de inicio.",
    options: [
      { label: "El error aparece en una sección normal del sitio", key: "escalar" },
      { label: "Eso resolvió mi problema ✓",                       key: "resuelto" },
      { label: "Volver al menú principal",                         key: "volver" },
    ],
  },
  "error-500": {
    reply: "El error 500 es un problema del servidor, no de tu dispositivo. Espera unos minutos y recarga. Si persiste más de 30 minutos, probablemente ya estamos trabajando en ello.",
    options: [
      { label: "Lleva más de una hora con el error", key: "escalar" },
      { label: "Eso resolvió mi problema ✓",         key: "resuelto" },
      { label: "Volver al menú principal",           key: "volver" },
    ],
  },
  "error-red": {
    reply: "Verifica tu conexión a Internet. Si tienes conexión, puede que el servidor sea inaccesible desde tu red. Prueba con una VPN o en otra red WiFi.",
    options: [
      { label: "Tengo conexión y sigue fallando", key: "escalar" },
      { label: "Eso resolvió mi problema ✓",      key: "resuelto" },
      { label: "Volver al menú principal",        key: "volver" },
    ],
  },
  "error-popup": {
    reply: "Describe el texto exacto del mensaje de error para que nuestro equipo pueda reproducirlo y solucionarlo lo antes posible.",
    options: [
      { label: "Enviar reporte al equipo ✉", key: "escalar" },
      { label: "Eso resolvió mi problema ✓", key: "resuelto" },
      { label: "Volver al menú principal",   key: "volver" },
    ],
  },

  // ── BORRAR CUENTA ────────────────────────────────────────────────
  "borrar-cuenta": {
    reply: "Lamentamos que quieras irte. ¿Cuál es tu situación?",
    options: [
      { label: "Quiero eliminar mi cuenta definitivamente",  key: "borrar-definitivo" },
      { label: "Solo quiero desactivarla temporalmente",     key: "borrar-temporal" },
      { label: "Tengo un problema técnico y por eso me voy", key: "main" },
      { label: "Volver al menú principal",                   key: "volver" },
    ],
  },
  "borrar-definitivo": {
    reply: "Ve a <b>Configuración → Cuenta → Eliminar cuenta</b>. Se te pedirá confirmar con tu contraseña. <b>Este proceso es permanente</b>: no podrás recuperar tu historial ni reviews.",
    options: [
      { label: "No encuentro esa opción",          key: "escalar" },
      { label: "Eso resolvió mi problema ✓",        key: "resuelto" },
      { label: "Cambié de opinión, no quiero borrarla", key: "volver" },
    ],
  },
  "borrar-temporal": {
    reply: "Por ahora no contamos con desactivación temporal, pero puedes poner tu perfil en privado: <b>Configuración → Privacidad → Perfil privado</b>. Así nadie podrá verte sin que pierdas tus datos.",
    options: [
      { label: "Eso resolvió mi problema ✓",          key: "resuelto" },
      { label: "De todas formas quiero eliminarla",   key: "borrar-definitivo" },
      { label: "Volver al menú principal",            key: "volver" },
    ],
  },

  // ── SUGERENCIA ───────────────────────────────────────────────────
  sugerencia: {
    reply: "¡Nos encanta recibir feedback! ¿De qué tipo es tu aportación?",
    options: [
      { label: "Quiero sugerir una nueva función",           key: "sug-funcion" },
      { label: "Quiero reportar un bug o error visual",      key: "sug-bug" },
      { label: "Quiero dar feedback sobre el diseño",        key: "sug-diseno" },
      { label: "Volver al menú principal",                   key: "volver" },
    ],
  },
  "sug-funcion": {
    reply: "¡Genial! Las sugerencias de funciones se revisan cada sprint. Cuéntanos qué función te gustaría ver y cómo mejoraría tu experiencia.",
    options: [
      { label: "Enviar sugerencia al equipo ✉", key: "escalar" },
      { label: "Volver al menú principal",      key: "volver" },
    ],
  },
  "sug-bug": {
    reply: "Para reproducirlo necesitamos: <b>1)</b> Qué hiciste justo antes. <b>2)</b> Qué esperabas que pasara. <b>3)</b> Qué pasó realmente. <b>4)</b> Navegador y sistema operativo.",
    options: [
      { label: "Enviar reporte detallado ✉", key: "escalar" },
      { label: "Volver al menú principal",   key: "volver" },
    ],
  },
  "sug-diseno": {
    reply: "Tu opinión sobre el diseño es muy valiosa. ¿Hay algo que te resulte confuso, poco atractivo o que creas que podría fluir mejor?",
    options: [
      { label: "Enviar feedback al equipo ✉", key: "escalar" },
      { label: "Volver al menú principal",    key: "volver" },
    ],
  },

  // ── OTRO ────────────────────────────────────────────────────────
  otro: {
    reply: "Entendido. Selecciona la categoría más cercana a tu consulta:",
    options: [
      { label: "Pregunta sobre mi suscripción o plan",      key: "otro-plan" },
      { label: "Problema con notificaciones",               key: "otro-notif" },
      { label: "Problema al escribir o publicar reviews",   key: "otro-review" },
      { label: "Otro (necesito hablar con un agente)",      key: "escalar" },
      { label: "Volver al menú principal",                  key: "volver" },
    ],
  },
  "otro-plan": {
    reply: "Ve a <b>Configuración → Plan y facturación</b> para ver tu plan actual, historial de pagos y opciones de actualización o cancelación.",
    options: [
      { label: "No veo la sección de facturación", key: "escalar" },
      { label: "Eso resolvió mi problema ✓",       key: "resuelto" },
      { label: "Volver al menú principal",         key: "volver" },
    ],
  },
  "otro-notif": {
    reply: "Las notificaciones se gestionan en <b>Configuración → Notificaciones</b>. Verifica también que el navegador tenga permisos concedidos para este sitio.",
    options: [
      { label: "Están activadas pero no llegan", key: "escalar" },
      { label: "Eso resolvió mi problema ✓",     key: "resuelto" },
      { label: "Volver al menú principal",       key: "volver" },
    ],
  },
  "otro-review": {
    reply: "Para publicar una review ve al álbum y haz clic en <b>«Escribir review»</b>. Asegúrate de tener sesión iniciada y que el texto no supere los 2000 caracteres.",
    options: [
      { label: "El botón de review no aparece",      key: "escalar" },
      { label: "La review no se publica al guardar", key: "escalar" },
      { label: "Eso resolvió mi problema ✓",         key: "resuelto" },
      { label: "Volver al menú principal",           key: "volver" },
    ],
  },

  // ── ESTADOS FINALES ──────────────────────────────────────────────
  resuelto: {
    reply: "¡Perfecto, me alegra que se haya resuelto! 🎉 ¿Hay algo más en lo que pueda ayudarte?",
    options: [
      { label: "Sí, tengo otra consulta",         key: "main" },
      { label: "No, eso es todo. ¡Gracias!",      key: "fin" },
    ],
  },
  escalar: {
    reply: "Entendido. Voy a escalar tu caso a un agente humano. <b>Recibirás una respuesta en tu correo en un plazo de 24–48 horas.</b> Lamentamos los inconvenientes.",
    options: [
      { label: "Tengo otra consulta mientras tanto", key: "main" },
      { label: "De acuerdo, esperaré. ¡Gracias!",    key: "fin" },
    ],
  },
  fin: {
    reply: "¡Hasta pronto! 👋 Si tienes más dudas, siempre puedes volver a este chat. Que disfrutes la música 🎵",
    options: [],
  },
};

// ===== MANEJADOR PRINCIPAL =====
function handleClick(e) {
  const key = e.target.dataset.q;
  const label = e.target.textContent.trim();

  addMessage(label, true);
  quickContainer.innerHTML = "";

  const node = key === "volver" ? tree["main"] : tree[key];
  if (!node) return;

  setTimeout(() => {
    if (node.reply) addMessage(node.reply);
    if (node.options && node.options.length > 0) {
      setTimeout(() => showOptions(node.options), node.reply ? 600 : 0);
    }
  }, 500);
}

// ===== ARRANQUE =====
showOptions(tree.main.options);
