"use strict";

const URL_API_LOCAL = "http://localhost:3000/api";

// Guardián Escolar de Seguridad: Evita accesos fraudulentos por URL
document.addEventListener("DOMContentLoaded", () => {
  const sesion = JSON.parse(localStorage.getItem("usuario"));
  if (!sesion || sesion.rol !== "admin") {
    alert("❌ ¡Acceso denegado! Área restringida para administradores.");
    window.location.href = "index.html";
  } else {
    window.cargarDashboardCompleto();
  }
});

window.cargarDashboardCompleto = function() {
  console.log("🔄 Sincronizando datos con el panel MySQL...");

  // 1. Cargar KPIs superiores
  fetch(`${URL_API_LOCAL}/admin/stats`)
    .then(res => res.json())
    .then(res => {
      if (res.exito && res.data) {
        // En algunas configuraciones de mysql2 viene como arreglo o como objeto directo
        const stats = Array.isArray(res.data) ? res.data[0] : res.data;
        document.getElementById("kpi-modelos").textContent = stats.total_modelos || 0;
        document.getElementById("kpi-stock").textContent = `${stats.stock_total || 0} pares`;
        document.getElementById("kpi-alerta").textContent = `${stats.stock_bajo || 0} modelos`;
      }
    })
    .catch(err => console.error("Error al descargar KPIs:", err));
  // 2. Mapear tabla física de inventario
  fetch(`${URL_API_LOCAL}/admin/productos`)
    .then(res => res.json())
    .then(res => {
      const tbody = document.getElementById("tabla-admin-productos");
      if (!tbody) return;
      tbody.innerHTML = "";

      if (res.exito && res.productos) {
        res.productos.forEach(tenis => {
          const alertaStyle = tenis.stock <= 3 ? 'color:#d93838; font-weight:800; background:#fff0f0; padding:2px 6px; border-radius:4px;' : 'font-weight:700;';
          
          tbody.innerHTML += `
            <tr style="border-bottom: 1px solid var(--line);">
              <td style="padding:12px 8px;">#${tenis.id}</td>
              <td style="padding:12px 8px; font-weight:600;">${String(tenis.nombre)}</td>
              <td style="padding:12px 8px;">${String(tenis.marca || 'Sneakers')}</td>
              <td style="padding:12px 8px;">$${Number(tenis.precio).toLocaleString('es-MX')}</td>
              <td style="padding:12px 8px;"><span style="${alertaStyle}">${tenis.stock} u.</span></td>
              <td style="padding:12px 8px; text-align:center;">
                <button onclick="modificarExistenciasPrompt(${tenis.id}, ${tenis.stock}, '${String(tenis.nombre).replace(/'/g, "\\'")}')" style="cursor:pointer; background:none; border:none; font-size:16px;" title="Editar existencias">⚙️</button>
              </td>
            </tr>
          `;
        });
      }
    })
    .catch(err => console.error("Error al descargar inventario:", err));

  // 3. Descargar el historial de la bitácora
  fetch(`${URL_API_LOCAL}/admin/movimientos`)
    .then(res => res.json())
    .then(res => {
      const logBox = document.getElementById("bitacora-movimientos-lista");
      if (!logBox) return;
      logBox.innerHTML = "";

      if (res.exito && res.movimientos && res.movimientos.length > 0) {
        res.movimientos.forEach(log => {
          const hora = new Date(log.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
          logBox.innerHTML += `
            <div style="background:#fbfbfa; border:1px solid var(--line); border-radius:8px; padding:10px 12px; font-size:12px; line-height:1.4;">
              <div style="display:flex; justify-content:space-between; font-weight:700; color:var(--muted); margin-bottom:4px;">
                <span>📝 Transacción</span>
                <span style="font-weight:500; font-size:11px; margin-left:auto;">⏱️ ${hora}</span>
              </div>
              <p style="margin:0; color:var(--ink); font-weight:500;">${String(log.descripcion)}</p>
            </div>
          `;
        });
      } else {
        logBox.innerHTML = `<div style="text-align:center; color:var(--muted); font-size:12px; padding:20px 0;">Sin registros históricos.</div>`;
      }
    })
    .catch(err => console.error("Error al mapear bitácora:", err));
};

window.modificarExistenciasPrompt = function(id, stockActual, nombreProducto) {
  const sesion = JSON.parse(localStorage.getItem("usuario"));
  const adminName = sesion ? sesion.nombre : "Administrador";

  const input = prompt(`Modificar Stock de: "${nombreProducto}"\n\nCantidad actual en XAMPP: ${stockActual} unidades.\nIngresa las nuevas existencias:`, stockActual);
  if (input === null) return;

  const nuevoStock = parseInt(input.trim(), 10);
  if (isNaN(nuevoStock) || nuevoStock < 0) return alert("❌ Cantidad incorrecta.");

  fetch(`${URL_API_LOCAL}/admin/productos/stock`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: id, nuevoStock: nuevoStock, usuarioAdmin: adminName })
  })
  .then(res => res.json())
  .then(data => {
    if (data.exito) window.cargarDashboardCompleto();
    else alert(`Error: ${data.mensaje}`);
  })
  .catch(() => alert("Fallo al actualizar el inventario físico en MySQL."));
};

// FUNCIÓN CRÍTICA CORREGIDA PARA CERRAR SESIÓN DE MANERA SEGURA
window.cerrarSesionAdmin = function() {
  localStorage.removeItem("usuario");
  window.location.href = "index.html"; // Remueve las credenciales y lo bota a la tienda
};
