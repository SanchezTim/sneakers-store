"use strict";

const PRODUCTOS_INICIALES = [
  { id: 1, nombre: "Nike Air Max Pulse", precio: 2500, imagen: "images/Nike-air-max.jpg", categoria: "Running", descripcion: "..." }, // Revisa si el archivo se llama exactamente así
  { id: 2, nombre: "Jordan Street One", precio: 3200, imagen: "images/nike1.jpg", categoria: "Lifestyle", descripcion: "..." },
  { id: 3, nombre: "Revolution Runner", precio: 1900, imagen: "images/nike2.jpg", categoria: "Running", descripcion: "..." },
  { id: 4, nombre: "Adidas Street Flex", precio: 2100, imagen: "images/adidas1.jpg", categoria: "Lifestyle", descripcion: "..." },
  { id: 5, nombre: "Puma Pace Pro", precio: 1900, imagen: "images/puma.jpg", categoria: "Training", descripcion: "..." },
  { id: 6, nombre: "New Balance Everyday", precio: 2600, imagen: "images/nike4.jpeg", categoria: "Lifestyle", descripcion: "..." }, // Ojo si es .jpeg
  { id: 7, nombre: "Cloud Walk Lite", precio: 2300, imagen: "images/adidas1.jpg", categoria: "Running", descripcion: "..." },
  { id: 8, nombre: "Court Classic", precio: 1800, imagen: "images/puma.jpg", categoria: "Training", descripcion: "..." }
];

const leerJSON = (clave, alternativa) => {
  try { const valor = JSON.parse(localStorage.getItem(clave)); return valor ?? alternativa; }
  catch { return alternativa; }
};

let almacenamientoDisponible = true;
function escribirJSON(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    almacenamientoDisponible = true;
    return true;
  } catch (error) {
    almacenamientoDisponible = false;
    console.warn(`No se pudo guardar "${clave}" en el almacenamiento local.`, error);
    return false;
  }
}

let productos = leerJSON("productos", null);
if (!Array.isArray(productos) || productos.length === 0) productos = PRODUCTOS_INICIALES.map(p => ({ ...p }));
let carrito = leerJSON("carrito", []);
if (!Array.isArray(carrito)) carrito = [];
let usuario = leerJSON("usuario", null);
if (usuario?.rol !== "admin" && usuario?.rol !== "cliente") usuario = null;
let productoPendienteEliminar = null;
let rolSeleccionado = "cliente";
let categoriaActual = "Todos";
let terminoBusqueda = "";
let ordenarPor = "featured";

const escapar = valor => String(valor ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "'" })[c]);
const precioMXN = valor => Number(valor || 0).toLocaleString("es-MX");
function persistirProductos() { return escribirJSON("productos", productos); }
function guardarCarrito() { return escribirJSON("carrito", carrito); }

function borrarClaveLocal(clave) {
  try { localStorage.removeItem(clave); return true; }
  catch (error) { almacenamientoDisponible = false; console.warn(`No se pudo borrar "${clave}" del almacenamiento local.`, error); return false; }
}

function obtenerRuta(imagen) { return String(imagen || "").trim() || "https://unsplash.com"; }

function cambiarVista(vista) {
  // BLOQUEO DE SEGURIDAD ESTÉTICO
  if (vista === "adminPanel" && (!usuario || usuario.rol !== "admin")) {
    alert("Acceso denegado. Por favor, inicia sesión como administrador.");
    cambiarVista("login");
    return;
  }


  // Código estándar de renderizado de vistas
  document.querySelectorAll("main .view").forEach(seccion => { 
    seccion.hidden = seccion.id !== vista; 
  });
  
  // Buscar el botón correcto comparando el texto directo
  const botones = document.querySelectorAll(".nav-btn");
  botones.forEach(b => {
    b.classList.remove("active");
    if (b.getAttribute("onclick") && b.getAttribute("onclick").includes(vista)) {
      b.classList.add("active");
    }
  });
  
  const mainNav = document.getElementById("mainNav");
  if (mainNav) mainNav.classList.remove("open");
  
  const menuToggle = document.getElementById("menuToggle");
  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  }
  
  if (vista === "productos" && typeof mostrarProductos === "function") mostrarProductos();
  if (vista === "carrito" && typeof verCarrito === "function") verCarrito();
  
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function crearTarjeta(p) {
  const img = escapar(obtenerRuta(p.imagen));
  return `
    <article class="product-card">
      <div class="product-image">
        <img src="${img}" alt="${escapar(p.nombre)}" loading="lazy" onerror="this.style.opacity='.12'">
        <span class="product-tag">${escapar(p.etiqueta || p.categoria || "SNEAKERS")}</span>
      </div>
      <div class="product-info">
        <span class="product-category">${escapar(p.categoria || "Lifestyle")}</span>
        <h3>${escapar(p.nombre)}</h3>
        <p class="product-description">${escapar(p.descripcion || "Un gran par para tu día a día.")}</p>
        
        <div class="product-bottom-store">
          <span class="price">$${precioMXN(p.precio)} <small>MXN</small></span>
          <button class="btn-add-to-cart" onclick="agregar(${Number(p.id)})" aria-label="Agregar ${escapar(p.nombre)} al carrito">
            🛒 Agregar al carrito
          </button>
        </div>
      </div>
    </article>
  `;
}

function filtrarProductos() {
  let resultado = productos.filter(p => (categoriaActual === "Todos" || p.categoria === categoriaActual) && `${p.nombre} ${p.categoria} ${p.descripcion || ""}`.toLowerCase().includes(terminoBusqueda.toLowerCase()));
  if (ordenarPor === "low") resultado.sort((a, b) => Number(a.precio) - Number(b.precio));
  if (ordenarPor === "high") resultado.sort((a, b) => Number(b.precio) - Number(a.precio));
  if (ordenarPor === "name") resultado.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return resultado;
}

function mostrarProductos(lista) {
  const contenedor = document.getElementById("listaProductos");
  if (!contenedor) return;
  const items = lista || filtrarProductos();
  contenedor.innerHTML = items.length ? items.map(crearTarjeta).join("") : `<div class="empty-state">No encontramos productos con esos filtros. Prueba otra búsqueda.</div>`;
  const cuenta = document.getElementById("resultCount");
  if (cuenta) cuenta.textContent = `${items.length} ${items.length === 1 ? "modelo" : "modelos"}`;
}

function mostrarDestacados() {
  const destino = document.getElementById("featuredProducts");
  if (destino) destino.innerHTML = productos.slice(0, 4).map(crearTarjeta).join("");
}

// Vinculación explícita al contexto global
window.cambiarVista = cambiarVista;
window.buscar = buscar;
window.ordenarProductos = ordenarProductos;
window.agregar = agregar;
window.comprarAhora = comprarAhora;
window.eliminarDelCarrito = eliminarDelCarrito;

function buscar(texto) { terminoBusqueda = texto.trim(); mostrarProductos(); }
function ordenarProductos(valor) { ordenarPor = valor; mostrarProductos(); }

function agregar(id) {
  const producto = productos.find(p => Number(p.id) === Number(id));
  if (!producto) return;
  const existente = carrito.find(item => Number(item.id) === Number(id));
  if (existente) existente.cantidad = Number(existente.cantidad || 1) + 1;
  else carrito.push({ ...producto, cantidad: 1 });
  guardarCarrito(); actualizarContadorCarrito(); mostrarToast("Agregado a tu carrito.", "success");
}

function comprarAhora(id) { agregar(id); cambiarVista("carrito"); }

function actualizarContadorCarrito() {
  const total = carrito.reduce((suma, p) => suma + Number(p.cantidad || 1), 0);
  const badge = document.getElementById("cartCount"); if (badge) badge.textContent = total;
}

function verCarrito() {
  const lista = document.getElementById("listaCarrito"); 
  if (!lista) return;
  
  if (!carrito.length) {
    lista.innerHTML = `<li class="empty-cart">Tu carrito está vacío.<br><button class="text-link" onclick="cambiarVista('productos')">Encuentra tu próximo par ↗</button></li>`;
    const resumenContenedor = document.getElementById("resumenCarrito");
    if (resumenContenedor) resumenContenedor.style.display = "none";
  } else {
    const resumenContenedor = document.getElementById("resumenCarrito");
    if (resumenContenedor) resumenContenedor.style.display = "block";

    lista.innerHTML = carrito.map(p => {
      const imgUrl = escapar(obtenerRuta(p.imagen));
      return `
        <li class="cart-item">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img src="${imgUrl}" alt="${escapar(p.nombre)}" style="width: 64px; height: 64px; object-fit: cover; border-radius: 8px; background: #f0efea;">
            <div>
              <strong style="display:block; font-size:15px; font-family:'Manrope';">${escapar(p.nombre)}</strong>
              <small style="color: var(--muted); font-weight:600;">$${precioMXN(p.precio)} MXN</small>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 20px;">
            <span style="font-size:14px;">Cant: <b>${Number(p.cantidad)}</b></span>
            <button class="round-action" onclick="eliminarDelCarrito(${Number(p.id)})" aria-label="Eliminar par" style="border-color:#fcc2c2; color:#d93838; background:#fff5f5; cursor:pointer;">🗑️</button>
          </div>
        </li>
      `;
    }).join("");

    
    const subtotal = carrito.reduce((suma, p) => suma + (Number(p.precio) * Number(p.cantidad)), 0);
    const envio = subtotal >= 2500 ? 0 : 250;
    const total = subtotal + envio;

  
    const textoEnvio = envio === 0 ? '<strong style="color:var(--green)">Gratis</strong>' : `$${precioMXN(envio)} MXN`;

    const destinoResumen = document.getElementById("resumenCarrito");
    if (destinoResumen) {
      destinoResumen.innerHTML = `
        <h3>Resumen de compra</h3>
        <div class="summary-row"><span>Subtotal</span><span>$${precioMXN(subtotal)} MXN</span></div>
        <div class="summary-row"><span>Envío</span><span>${textoEnvio}</span></div>
        <hr>
        <div class="summary-row total-row"><span>Total</span><span>$${precioMXN(total)} MXN</span></div>
        <button class="btn-checkout" onclick="procesarPago()">Proceder al pago</button>
        <button class="btn-clear" onclick="carrito=[]; escribirJSON('carrito', []); verCarrito(); actualizarContadorCarrito();">Vaciar carrito</button>
      `;
    }
  }
  actualizarContadorCarrito();
}

function eliminarDelCarrito(id) {
  const itemIndex = carrito.findIndex(item => Number(item.id) === Number(id));
  if (itemIndex > -1) {
    if (carrito[itemIndex].cantidad > 1) {
      carrito[itemIndex].cantidad -= 1;
    } else {
      carrito.splice(itemIndex, 1);
    }
    guardarCarrito();
    verCarrito();
    actualizarContadorCarrito();
    mostrarToast("Carrito actualizado.", "success");
  }
}

function mostrarToast(mensaje, tipo = "success") {
  console.log(`[${tipo.toUpperCase()}]: ${mensaje}`);
}

function mostrarLogin(rol) {
  console.log(`Login para: ${rol}`);
}

// LÓGICA PARA EL MENÚ RESPONSIVO DE HAMBURGUESA
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const estaAbierto = mainNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", estaAbierto ? "true" : "false");
      menuToggle.textContent = estaAbierto ? "✕" : "☰"; // Cambia el icono a una equis al abrir
    });
  }
});

// FUNCIONES GLOBALES PARA EL MODAL DEL CLUB DE DESCUENTO
function abrirModalClub() {
  const modal = document.getElementById("modalClub");
  if (modal) {
    modal.style.setProperty("display", "flex", "important");
  }
}

function cerrarModalClub() {
  const modal = document.getElementById("modalClub");
  if (modal) {
    modal.style.setProperty("display", "none", "important");
  }
}
function procesarRegistroClub(event) {
  event.preventDefault(); // Detiene la recarga de la página
  const correoInput = document.getElementById("correoClub");
  
  cerrarModalClub(); // Cierra el recuadro
  if (correoInput) correoInput.value = ""; // Limpia el texto escrito
  
  // Mensaje nativo que aparecerá directo en tu pantalla
  alert("¡Registro exitoso! Te enviamos tu 15% de descuento al correo.");
}

// Forzar vinculación al objeto Window del navegador
window.abrirModalClub = abrirModalClub;
window.cerrarModalClub = cerrarModalClub;
window.procesarRegistroClub = procesarRegistroClub;

// PROCESAMIENTO DEL LOGINFORM CON LETRERO DE BIENVENIDA DINÁMICO
function procesarLoginForm(event) {
  event.preventDefault();
  const userField = document.getElementById("loginUsername")?.value.trim();
  const passField = document.getElementById("loginPassword")?.value;

  const btnLogin = document.getElementById("menuLoginBtn");
  const btnAdmin = document.getElementById("menuAdminBtn");

  if (userField.toLowerCase() === "admin" && passField === "admin123") {
    usuario = { nombre: "Administrador", rol: "admin" };
    if (btnAdmin) btnAdmin.style.display = "block";
    if (btnLogin) btnLogin.textContent = "Cerrar Sesión ✕";
    
    // Crear aviso flotante para el Admin
    crearAvisoBienvenida("¡Bienvenido, Administrador!", "var(--orange, #f36b21)");
    cambiarVista("adminPanel");
    
  } else {
    usuario = { nombre: userField, rol: "cliente" };
    if (btnAdmin) btnAdmin.style.display = "none";
    if (btnLogin) btnLogin.textContent = "Cerrar Sesión ✕";
    
    // Crear aviso flotante personalizado con el nombre exacto 
    crearAvisoBienvenida(`¡Bienvenido de vuelta, ${userField}! 👟`, "var(--ink, #111111)");
    cambiarVista("productos");
  }

  if (typeof escribirJSON === "function") escribirJSON("usuario", usuario);

  if (document.getElementById("loginUsername")) document.getElementById("loginUsername").value = "";
  if (document.getElementById("loginPassword")) document.getElementById("loginPassword").value = "";
}

// FUNCIÓN AUXILIAR QUE CREA EL LETRERO ESTÉTICO TEMPORAL
function crearAvisoBienvenida(mensaje, colorFondo) {
  const aviso = document.createElement("div");
  aviso.textContent = mensaje;
  
    Object.assign(aviso.style, {
    position: "fixed",
    top: "24px",
    right: "24px",
    background: colorFondo,
    color: "#ffffff",
    padding: "10px 20px",
    borderRadius: "8px",
    fontFamily: "'Manrope', sans-serif",
    fontSize: "13px",
    fontWeight: "600",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    zIndex: "999999",
    transition: "all 0.4s ease",
    transform: "translateY(-10px)",
    opacity: "0"
  });

  document.body.appendChild(aviso);

  // Animación de entrada suave
  setTimeout(() => {
    aviso.style.transform = "translateY(0)";
    aviso.style.opacity = "1";
  }, 50);

  // Animación de salida y desaparición automática tras 3 segundos
  setTimeout(() => {
    aviso.style.transform = "translateY(-20px)";
    aviso.style.opacity = "0";
    setTimeout(() => aviso.remove(), 400);
  }, 3000);
}

window.procesarLoginForm = procesarLoginForm;

// FUNCIÓN PARA PROCESAR EL PAGO Y MOSTRAR CONFIRMACIÓN ESTÉTICA
function procesarPago() {
  if (carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  // Limpiar el carrito de manera interna y visual
  carrito = [];
  if (typeof escribirJSON === "function") escribirJSON("carrito", carrito);
  if (typeof actualizarContadorCarrito === "function") actualizarContadorCarrito();

  // Cambiar a la vista de éxito premium
  cambiarVista("compraExitosa");
}

window.procesarPago = procesarPago;

// FUNCIÓN INTELIGENTE CORREGIDA PARA ENTRAR O CERRAR SESIÓN
function cerrarSesion() {
  const btnLogin = document.getElementById("menuLoginBtn");
  const btnAdmin = document.getElementById("menuAdminBtn");

  // REGLA INFALIBLE: Si NO hay ningún usuario logueado, abrimos la pantalla de login directamente
  if (!usuario) {
    cambiarVista("login");
    return;
  }

  // Si SÍ hay un usuario activo, procedemos a limpiar la sesión por completo
  usuario = null;
  rolSeleccionado = "cliente";
  if (typeof escribirJSON === "function") escribirJSON("usuario", null);

  // Restaurar el menú superior
  if (btnLogin) btnLogin.innerHTML = "Iniciar Sesión 👤";
  if (btnAdmin) btnAdmin.style.display = "none";

  // Mostrar el letrero flotante naranja premium de despedida
  if (typeof crearAvisoBienvenida === "function") {
    crearAvisoBienvenida("¡Sesión cerrada con éxito! Vuelve pronto.", "var(--orange, #f36b21)");
  }

  cambiarVista("inicio");
}

window.cerrarSesion = cerrarSesion;

// INTERACCIONES Y LÓGICA DEL CHATBOT DE SOPORTE
function alternarChatbot() {
  const windowChat = document.getElementById("chatbotWindow");
  if (windowChat) {
    const estaOculto = windowChat.style.display === "none";
    windowChat.style.display = estaOculto ? "flex" : "none";
  }
}

// 1. FUNCIÓN INTERACTIVA QUE DIBUJA LAS BURBUJAS EN LA PANTALLA
function responderChatbot(opcionTexto) {
  const contenedor = document.getElementById("chatRespuestasContenedor");
  if (!contenedor) return;

  // Limpiar respuestas anteriores para mantener el chat ordenado
  contenedor.innerHTML = "";

  // Crear burbuja con el mensaje enviado (por botón o por texto)
  const msgCliente = document.createElement("div");
  msgCliente.className = "chat-msg user";
  msgCliente.innerHTML = `<p>${opcionTexto}</p>`;
  contenedor.appendChild(msgCliente);

  // OBTENER RESPUESTA INTELIGENTE SEGÚN LA PALABRA CLAVE
  const textoMinusculas = opcionTexto.toLowerCase();
  let respuestaAutomatica = "";

  if (textoMinusculas.includes("hora") || textoMinusculas.includes("horario") || textoMinusculas.includes("atención")) {
    respuestaAutomatica = "Nuestro horario de atención digital es de Lunes a Viernes de 9:00 AM a 6:00 PM y Sábados de 10:00 AM a 2:00 PM.";
  } 
  else if (textoMinusculas.includes("envio") || textoMinusculas.includes("envió") || textoMinusculas.includes("costo") || textoMinusculas.includes("precio") || textoMinusculas.includes("costos")) {
    respuestaAutomatica = "¡El envío es gratis en compras mayores a \$4,500 MXN! Para pedidos menores, el costo estándar es de \$150 MXN con entrega de 3 a 5 días hábiles.";
  } 
  else if (textoMinusculas.includes("original") || textoMinusculas.includes("clon") || textoMinusculas.includes("autentico") || textoMinusculas.includes("productos")) {
    respuestaAutomatica = "¡Garantizado al 100%! Todos nuestros modelos son adquiridos directamente con los distribuidores oficiales de cada marca.";
  } 
  else if (textoMinusculas.includes("cambio") || textoMinusculas.includes("devolucion") || textoMinusculas.includes("talla") || textoMinusculas.includes("devoluciones")) {
    respuestaAutomatica = "Cuentas con 30 días naturales a partir de que recibes tus sneakers para solicitar cualquier cambio de talla o devolución sin costo.";
  }
  else if (textoMinusculas.includes("pedido") || textoMinusculas.includes("rastreo") || textoMinusculas.includes("estatus") || textoMinusculas.includes("estado")) {
    respuestaAutomatica = "Si ya iniciaste sesión como cliente, puedes validar el rastreo de tus compras directas ingresando a tu perfil o con tu código de confirmación.";
  }
  else if (textoMinusculas.includes("asesor") || textoMinusculas.includes("humano") || textoMinusculas.includes("hablar")) {
    respuestaAutomatica = "¡Claro! En breve uno de nuestros agentes se conectará contigo. También puedes dejarnos un mensaje formal en nuestra sección de Contacto.";
  }
  else {
    respuestaAutomatica = "Gracias por tu mensaje. Actualmente soy un asistente de respuestas rápidas; por favor, elige una de las opciones del menú de arriba para darte soporte inmediato o envíanos un correo en el formulario de Contacto.";
  }

  // Crear burbuja de respuesta del bot con simulación de escritura
  const msgBot = document.createElement("div");
  msgBot.className = "chat-msg bot";
  msgBot.innerHTML = `<p>${respuestaAutomatica}</p>`;

  setTimeout(() => {
    contenedor.appendChild(msgBot);
    const bodyChat = document.querySelector(".chatbot-body");
    if (bodyChat) bodyChat.scrollTop = bodyChat.scrollHeight;
  }, 350);
}

// 2. FUNCIÓN PARA EL CUADRO DE TEXTO MANUAL
function enviarMensajeChat(event) {
  event.preventDefault();
  const input = document.getElementById("chatbotInput");
  if (!input || !input.value.trim()) return;

  const textoUsuario = input.value.trim();
  input.value = "";

  // Mandamos el texto al analizador unificado
  responderChatbot(textoUsuario);
}

// Asegurar enlaces globales para clics en el navegador
window.alternarChatbot = alternarChatbot;
window.responderChatbot = responderChatbot;
window.enviarMensajeChat = enviarMensajeChat;

