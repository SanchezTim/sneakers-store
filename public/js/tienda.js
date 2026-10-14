"use strict";

const API_URL = "http://localhost:3000/api";

const PRODUCTOS_INICIALES = [
  { id: 3, nombre: "Nike Air Max Pulse", precio: 2500, imagen: "images/Nike air max.jpg", categoria: "Running", descripcion: "Estilo retro icónico con el soporte del mañana.", etiqueta: "NUEVO" },
  { id: 1, nombre: "Adidas Street Flex", precio: 2100, imagen: "images/adidas1.jpg", categoria: "Lifestyle", descripcion: "Amortiguación cómoda para tu ritmo diario.", etiqueta: "MÁS VENDIDO" },
  { id: 2, nombre: "Jordan Street One", precio: 3200, imagen: "images/jordan_one.jpg", categoria: "Lifestyle", descripcion: "Un clásico urbano con mucha personalidad.", etiqueta: "FAVORITO" },
  { id: 4, nombre: "Nike Pulse Red", precio: 2400, imagen: "images/nike_pulse.jpg", categoria: "Running", descripcion: "Energía pura y ligereza en cada pisada.", etiqueta: "NUEVO" },
  { id: 5, nombre: "Nike Revolution Volt", precio: 1900, imagen: "images/nike_revolution.jpg", categoria: "Running", descripcion: "Ligereza y soporte para sumar kilómetros.", etiqueta: "NUEVO" },
  { id: 6, nombre: "Nike Revolution Runner", precio: 1900, imagen: "images/nike1.jpg", categoria: "Running", descripcion: "Diseñado para dominar la pista o el asfalto.", etiqueta: "Lifestyle" },
  { id: 7, nombre: "Nike Court Classic", precio: 1800, imagen: "images/nike2.jpg", categoria: "Training", descripcion: "Diseño clásico para la cancha y la calle.", etiqueta: "Clásico" },
  { id: 8, nombre: "Puma Caracal White", precio: 2200, imagen: "images/puma.jpg", categoria: "Lifestyle", descripcion: "Limpio, atemporal y sumamente versátil.", etiqueta: "Favorito" },
  { id: 9, nombre: "Puma Flex Black", precio: 2150, imagen: "images/puma_flex.jpg", categoria: "Lifestyle", descripcion: "Contraste audaz para un look urbano único.", etiqueta: "NUEVO" }
];

const leerJSON = (clave, alternativa) => {
  try { const valor = JSON.parse(localStorage.getItem(clave)); return valor ?? alternativa; }
  catch { return alternativa; }
};

function escribirJSON(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); return true; }
  catch (error) { return false; }
}

let productos = leerJSON("productos", PRODUCTOS_INICIALES);
let carrito = leerJSON("carrito", []);
let usuario = leerJSON("usuario", null);
let terminoBusqueda = "";
let ordenarPor = "featured";

const escapar = valor => String(valor ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "'" })[c]);
const precioMXN = valor => Number(valor || 0).toLocaleString("es-MX");

function cambiarVista(vista) {
  document.querySelectorAll(".view").forEach(seccion => { 
    seccion.hidden = seccion.id !== vista; 
  });
  if (vista === "productos") mostrarProductos();
  if (vista === "carrito") verCarrito();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function crearTarjeta(p) {
  return `
    <article class="product-card">
      <div class="product-image">
        <img src="${escapar(p.imagen)}" alt="${escapar(p.nombre)}" onerror="this.style.opacity='.12'">
        <span class="product-tag">${escapar(p.etiqueta || "SNEAKERS")}</span>
      </div>
      <div class="product-info">
        <span class="product-category">${escapar(p.categoria || "Lifestyle")}</span>
        <h3>${escapar(p.nombre)}</h3>
        <p class="product-description">${escapar(p.descripcion)}</p>
        <div class="product-bottom-store">
          <span class="price">$${precioMXN(p.precio)} <small>MXN</small></span>
          <button class="btn-add-to-cart" onclick="agregar(${Number(p.id)})">🛒 Agregar al carrito</button>
        </div>
      </div>
    </article>
  `;
}

function filtrarProductos() {
  let resultado = productos.filter(p => `${p.nombre} ${p.categoria}`.toLowerCase().includes(terminoBusqueda.toLowerCase()));
  if (ordenarPor === "low") resultado.sort((a, b) => Number(a.precio) - Number(b.precio));
  if (ordenarPor === "high") resultado.sort((a, b) => Number(b.precio) - Number(a.precio));
  if (ordenarPor === "name") resultado.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return resultado;
}

function mostrarProductos() {
  const contenedor = document.getElementById("listaProductos");
  if (!contenedor) return;
  const items = filtrarProductos();
  contenedor.innerHTML = items.length ? items.map(crearTarjeta).join("") : `<div class="empty-state">No se encontraron modelos.</div>`;
  const cuenta = document.getElementById("resultCount");
  if (cuenta) cuenta.textContent = `${items.length} modelos`;
}

function buscar(texto) { terminoBusqueda = texto.trim(); mostrarProductos(); }
function ordenarProductos(valor) { ordenarPor = valor; mostrarProductos(); }

function agregar(id) {
  const producto = productos.find(p => Number(p.id) === Number(id));
  if (!producto) return;
  const existente = carrito.find(item => Number(item.id) === Number(id));
  if (existente) existente.cantidad = Number(existente.cantidad) + 1;
  else carrito.push({ ...producto, cantidad: 1 });
  escribirJSON("carrito", carrito);
  actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
  const total = carrito.reduce((suma, p) => suma + Number(p.cantidad || 1), 0);
  const badge = document.getElementById("cartCount"); if (badge) badge.textContent = total;
}
function verCarrito() {
  const lista = document.getElementById("listaCarrito"); 
  if (!lista) return;
  
  if (!carrito.length) {
    lista.innerHTML = `
      <li class="empty-cart-premium">
        <div class="empty-cart-icon">🛒</div>
        <h3>Tu carrito está esperando</h3>
        <p>Parece que aún no has añadido ningún par de sneakers a tu colección. Explora los últimos lanzamientos de temporada y encuentra el estilo perfecto para ti.</p>
        <button class="btn-empty-explore" onclick="cambiarVista('productos')">
          Explorar Catálogo ↗
        </button>
      </li>
    `;
    const res = document.getElementById("resumenCarrito"); if (res) res.style.display = "none";
  } else {
    const res = document.getElementById("resumenCarrito"); if (res) res.style.display = "block";
    lista.innerHTML = carrito.map(p => `
      <li class="cart-item">
        <div style="display: flex; align-items: center; gap: 16px;">
          <img src="${escapar(p.imagen)}" style="width: 64px; height: 64px; object-fit: cover; border-radius: 8px;">
          <div><strong>${escapar(p.nombre)}</strong><br><small>$${precioMXN(p.precio)} MXN</small></div>
        </div>
        <div>
          <span>Cant: <b>${p.cantidad}</b></span>
          <button onclick="eliminarDelCarrito(${p.id})" style="color:red; background:none; border:none; margin-left:12px;">🗑️</button>
        </div>
      </li>
    `).join("");

    const subtotal = carrito.reduce((suma, p) => suma + (p.precio * p.cantidad), 0);
    const envio = subtotal >= 4500 ? 0 : 250;
    const total = subtotal + envio;

    const destinoResumen = document.getElementById("resumenCarrito");
    if (destinoResumen) {
      destinoResumen.innerHTML = `
        <h3>Resumen de compra</h3>
        <div class="summary-row"><span>Subtotal</span><span>$${precioMXN(subtotal)} MXN</span></div>
        <div class="summary-row"><span>Envío</span><span>${envio === 0 ? "Gratis" : `\$\${precioMXN(envio)} MXN`}</span></div>
        <hr>
        <div class="summary-row total-row"><span>Total</span><span>$${precioMXN(total)} MXN</span></div>
        <button class="btn-checkout" onclick="procesarPago()">Proceder al pago</button>
      `;
    }
  }
}

function eliminarDelCarrito(id) {
  const idx = carrito.findIndex(item => Number(item.id) === Number(id));
  if (idx > -1) {
    if (carrito[idx].cantidad > 1) carrito[idx].cantidad -= 1;
    else carrito.splice(idx, 1);
    escribirJSON("carrito", carrito); verCarrito(); actualizarContadorCarrito();
  }
}

function procesarLoginForm(event) {
  event.preventDefault();
  const email = document.getElementById("loginUsername")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;

  if (email === "admin" && password === "123") {
    escribirJSON("usuario", { nombre: "Tim Admin", rol: "admin" });
    alert("¡Bienvenido de vuelta, Tim Admin!");
    window.location.href = "admin.html";
    return;
  }

  fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.exito) {
      escribirJSON("usuario", { nombre: data.nombre, rol: data.rol });
      alert(`¡Bienvenido de vuelta, ${data.nombre}!`);
      actualizarNavbarSesion(data.nombre);
      cambiarVista("productos");
    } else { alert(data.mensaje); }
  })
  .catch(() => alert("Error al enlazar con el servidor Node.js."));
}

function actualizarNavbarSesion(nombreUsuario) {
  const loginBtn = document.getElementById("menuLoginBtn");
  if (loginBtn) {
    const primerNombre = nombreUsuario.split(" ")[0];
    loginBtn.textContent = `Salir (${primerNombre}) ✕`;
    loginBtn.style.color = "var(--orange-dark)"; 
    loginBtn.setAttribute("onclick", "ejecutarCerrarSesionCliente()");
  }
}

function ejecutarCerrarSesionCliente() {
  localStorage.removeItem("usuario");
  alert("Sesión finalizada correctamente.");
  const loginBtn = document.getElementById("menuLoginBtn");
  if (loginBtn) {
    loginBtn.textContent = "Iniciar Sesión 👤";
    loginBtn.setAttribute("onclick", "cambiarVista('login')");
  }
  cambiarVista("inicio");
}

function procesarRegistroForm(event) {
  event.preventDefault();
  const nombre = document.getElementById("registroNombre")?.value.trim();
  const email = document.getElementById("registroEmail")?.value.trim();
  const password = document.getElementById("registroPassword")?.value;
  fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.exito) { alert("Cuenta creada con éxito."); cambiarVista("login"); }
    else { alert(data.mensaje); }
  })
  .catch(() => alert("Fallo de red en el servidor."));
}

function procesarPago() {
  if (!carrito.length) return alert("Carrito vacío");
  cambiarVista("checkout");
  const f = new Date();
  const txtFecha = document.getElementById("ticketFecha");
  if (txtFecha) txtFecha.textContent = `Fecha: ${f.toLocaleDateString()} | Hora: ${f.toLocaleTimeString()}`;

  let htmlStr = ""; let sub = 0;
  carrito.forEach(i => {
    htmlStr += `<div style="display:flex; justify-content:space-between;"><span>${i.cantidad}x ${i.nombre}</span><span>$${(i.precio * i.cantidad).toLocaleString()} MXN</span></div>`;
    sub += i.precio * i.cantidad;
  });
  const env = sub >= 4500 ? 0 : 250;
  htmlStr += `<div style="display:flex; justify-content:space-between; font-size:11px; color:#555;"><span>+ Envío</span><span>$${env} MXN</span></div>`;
  document.getElementById("ticketProductosListado").innerHTML = htmlStr;
  document.getElementById("ticketTotalMonto").textContent = `$${(sub + env).toLocaleString()} MXN`;
}

function procesarPagoFinal(event) {
  event.preventDefault();
  alert("Procesando pago seguro con Mercado Pago...");

  const productosComprados = [...carrito];

  carrito = []; 
  escribirJSON("carrito", []); 
  actualizarContadorCarrito();
  cambiarVista("compraExitosa");

  const element = document.getElementById("ticketImprimible");
  const opt = { 
    margin: 12, 
    filename: 'Ticket_SneakersStore.pdf', 
    image: { type: 'jpeg', quality: 0.98 }, 
    html2canvas: { scale: 2, useCORS: true, logging: false }, 
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
  };
  
  html2pdf().set(opt).from(element).save()
    .then(() => console.log("Factura descargada."))
    .catch((err) => console.error("Error PDF:", err));

  productosComprados.forEach(item => {
    fetch(`${API_URL}/admin/productos`)
      .then(res => res.json())
      .then(res => {
        if (res.exito && res.productos) {
          const DBProduct = res.productos.find(p => Number(p.id) === Number(item.id));
          const currentStock = DBProduct ? Number(DBProduct.stock) : 10;
          const nuevoStock = Math.max(0, currentStock - Number(item.cantidad));

          fetch(`${API_URL}/admin/productos/stock`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: item.id,
              nuevoStock: nuevoStock,
              usuarioAdmin: `Venta Sistema (Pedro)`
            })
          }).catch(err => console.error("Error stock PUT:", err));
        }
      }).catch(err => console.error("Error stock GET:", err));
  });
}

function alternarChatbot() {
  const ch = document.getElementById("chatbotWindow");
  if (ch) ch.style.display = ch.style.display === "flex" ? "none" : "flex";
}

function responderChatbot(opc) {
  const box = document.getElementById("chatRespuestasContenedor");
  if (!box) return;
  box.innerHTML = `<div class="chat-msg user"><p>${opc}</p></div>`;
  
  let r = "Actualmente soy un asistente automatizado. Si requieres apoyo personalizado, envíanos un mensaje formal en la sección de 'Contacto'.";
  const t = opc.toLowerCase();
  
  if (t.includes("horario")) {
    r = "⏰ Nuestro horario de atención en línea es de Lunes a Viernes de 9:00 AM a 6:00 PM.";
  } else if (t.includes("tiemp") || t.includes("costo") || t.includes("enví")) {
    r = "🚚 El envío estándar toma de 2 a 5 días hábiles. ¡Es gratis en compras mayores a \$4,500 MXN! De lo contrario, el costo es de \$250 MXN.";
  } else if (t.includes("cambio") || t.includes("devolu")) {
    r = "🔄 Cuentas con 15 días naturales a partir de que recibes tus sneakers para solicitar cualquier cambio de talla o devolución sin costo adicional.";
  } else if (t.includes("original") || t.includes("autén")) {
    r = "💯 Todos nuestros productos son 100% originales, facturados y distribuidos por canales oficiales autorizados.";
  } else if (t.includes("estado") || t.includes("pedido")) {
    r = "📦 Para consultar el estado de tu pedido, introduce tu número de guía en el portal de la paquetería asignada o revisa tu correo.";
  } else if (t.includes("asesor") || t.includes("humano")) {
    r = "👤 Te estamos transfiriendo con un asesor humano. El tiempo estimado de espera es de 3 minutos. Permanecer en el chat.";
  }

  setTimeout(() => {
    box.innerHTML += `<div class="chat-msg bot"><p>${r}</p></div>`;
    const b = document.querySelector(".chatbot-body"); if (b) b.scrollTop = b.scrollHeight;
  }, 300);
}

window.cambiarVista = cambiarVista;
window.buscar = buscar;
window.ordenarProductos = ordenarProductos;
window.agregar = agregar;
window.eliminarDelCarrito = eliminarDelCarrito;
window.procesarLoginForm = procesarLoginForm;
window.procesarRegistroForm = procesarRegistroForm;
window.procesarPago = procesarPago;
window.procesarPagoFinal = procesarPagoFinal;
window.alternarChatbot = alternarChatbot;
window.responderChatbot = responderChatbot;
window.ejecutarCerrarSesionCliente = ejecutarCerrarSesionCliente;

document.addEventListener("DOMContentLoaded", () => {
  actualizarContadorCarrito();
  cambiarVista("inicio");
const userSesion = leerJSON("usuario", null);
if (userSesion && userSesion.rol !== "admin") {
actualizarNavbarSesion(userSesion.nombre);
}
});
document.addEventListener("DOMContentLoaded", () => {
const menuToggle = document.getElementById("menuToggleBtn");
const mainNav = document.getElementById("mainNav");
if (menuToggle && mainNav) {
menuToggle.addEventListener("click", () => {
mainNav.classList.toggle("open");
menuToggle.textContent = mainNav.classList.contains("open") ? "✕" : "☰";
});
}
});
function cerrarMenuMovil(vista) {
const mainNav = document.getElementById("mainNav");
const menuToggle = document.getElementById("menuToggleBtn");
if (mainNav) mainNav.classList.remove("open");
if (menuToggle) menuToggle.textContent = "☰";
cambiarVista(vista);
}
window.cerrarMenuMovil = cerrarMenuMovil;
document.addEventListener("DOMContentLoaded", () => {
const campoFecha = document.querySelector('input[placeholder="MM/AA"]');
if (campoFecha) {
campoFecha.setAttribute("maxlength", "5");
campoFecha.addEventListener("input", (e) => {
let valor = e.target.value.replace(/\D/g, "");
if (valor.length > 2) {
e.target.value = valor.substring(0, 2) + "/" + valor.substring(2, 4);
} else { e.target.value = valor; }
});
}
});
document.addEventListener("DOMContentLoaded", () => {
const campoTarjeta = document.querySelector('input[placeholder="Número de Tarjeta"]');
if (campoTarjeta) {
campoTarjeta.setAttribute("maxlength", "19");
campoTarjeta.addEventListener("input", (e) => {
let valor = e.target.value.replace(/\D/g, "");
let bloques = valor.match(/.{1,4}/g);
if (bloques) { e.target.value = bloques.join(" "); }
else { e.target.value = valor; }
});
}
});