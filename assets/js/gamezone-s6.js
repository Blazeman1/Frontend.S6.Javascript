/* =========================================================================
   GameZone — Semana 6: Optimizando la lógica y rendimiento de una página
   web con JavaScript (Actividad Sumativa, PFY2201)

   Índice de funciones:
   - formatearPrecio(valor)          -> utilidad de formato CLP
   - cargarProductos()               -> Fetch API + manejo de errores
   - renderizarProductos(lista)      -> manipulación dinámica del DOM
   - crearTarjetaProducto(producto)  -> createElement/appendChild
   - obtenerProductoPorId(id)
   - initEventosCatalogo()           -> delegación de eventos (click)
   - agregarAlCarrito(id)
   - quitarDelCarrito(id)
   - renderizarCarrito()             -> manipulación dinámica del DOM
   - initBotonVaciarCarrito()
   - initFormularioBusqueda()        -> evento submit
   - initFiltroCategorias()          -> evento click
   - mostrarDetalleProducto(id)      -> modal de Bootstrap
   - mostrarToast(mensaje)
   - initPausaCarruselAccesible()    -> accesibilidad (focus/hover)
   ========================================================================= */

// Estado global de la aplicación (en memoria, sin dependencias externas)
let productos = [];          // catálogo completo cargado desde el JSON local
let productosVisibles = [];  // subconjunto actualmente mostrado (según filtro/búsqueda)
let carrito = [];            // [{ id, nombre, precio, cantidad }]
let categoriaActiva = 'todos';

document.addEventListener('DOMContentLoaded', init);

/**
 * Punto de entrada: inicializa todos los módulos de la aplicación.
 */
function init() {
  cargarProductos();
  initEventosCatalogo();
  initBotonVaciarCarrito();
  initFormularioBusqueda();
  initFiltroCategorias();
  initModalAgregar();
  initPausaCarruselAccesible();
  renderizarCarrito();
}

/* =========================== UTILIDADES =========================== */

/** Formatea un número como precio en pesos chilenos (CLP). */
function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(valor);
}

/** Busca un producto por su id dentro del catálogo completo. */
function obtenerProductoPorId(id) {
  return productos.find((p) => p.id === Number(id));
}

/* =========================== FETCH API =========================== */

/**
 * Carga el catálogo de productos desde un archivo JSON LOCAL usando la
 * Fetch API. Se maneja tanto el caso de éxito como el de error (por
 * ejemplo, si el archivo no existe, la ruta es incorrecta o el sitio se
 * abre directamente desde el disco sin servidor, lo que puede bloquear
 * las peticiones fetch por política de CORS del navegador).
 */
function cargarProductos() {
  const estado = document.getElementById('estadoCatalogo');

  fetch('assets/data/productos.json')
    .then((respuesta) => {
      // response.ok es false para códigos de error HTTP (404, 500, etc.)
      if (!respuesta.ok) {
        throw new Error(`No se pudo obtener el catálogo (HTTP ${respuesta.status})`);
      }
      return respuesta.json();
    })
    .then((datos) => {
      productos = datos;
      productosVisibles = [...productos];
      estado.innerHTML = '';
      renderizarProductos(productosVisibles);
    })
    .catch((error) => {
      console.error('Error al cargar el catálogo de productos:', error);
      mostrarErrorCarga(error);
    });
}

/** Muestra un mensaje amigable y un botón de reintento cuando falla la Fetch API. */
function mostrarErrorCarga(error) {
  const estado = document.getElementById('estadoCatalogo');
  estado.innerHTML = '';

  const alerta = document.createElement('div');
  alerta.className = 'alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2';
  alerta.setAttribute('role', 'alert');

  const texto = document.createElement('span');
  texto.innerHTML = '⚠️ No pudimos cargar el catálogo de productos en este momento. Verifica tu conexión o inténtalo nuevamente.';

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn btn-sm btn-outline-danger';
  boton.textContent = 'Reintentar';
  boton.addEventListener('click', () => {
    estado.innerHTML = '<div class="d-flex align-items-center gap-2 text-secondary"><div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div><span>Cargando productos...</span></div>';
    cargarProductos();
  });

  alerta.append(texto, boton);
  estado.appendChild(alerta);
}

/* ===================== RENDERIZADO DEL CATÁLOGO ===================== */

/**
 * Reconstruye el contenedor de productos a partir de una lista dada.
 * Limpia el contenido previo y agrega una tarjeta por cada producto
 * usando manipulación dinámica del DOM (createElement/appendChild).
 */
function renderizarProductos(lista) {
  const contenedor = document.getElementById('contenedorProductos');
  contenedor.innerHTML = '';

  if (lista.length === 0) {
    const vacio = document.createElement('p');
    vacio.className = 'text-secondary';
    vacio.textContent = 'No se encontraron productos para este filtro.';
    contenedor.appendChild(vacio);
    return;
  }

  lista.forEach((producto) => {
    contenedor.appendChild(crearTarjetaProducto(producto));
  });
}

/** Crea el nodo DOM (columna + tarjeta Bootstrap) de un producto. */
function crearTarjetaProducto(producto) {
  const columna = document.createElement('div');
  columna.className = 'col-12 col-sm-6 col-xl-4';

  const tarjeta = document.createElement('div');
  tarjeta.className = 'card producto-card shadow-sm';

  const img = document.createElement('img');
  img.src = producto.imagen;
  img.alt = producto.nombre;
  img.className = 'card-img-top';
  img.loading = 'lazy';

  const cuerpo = document.createElement('div');
  cuerpo.className = 'card-body';

  const badge = document.createElement('span');
  badge.className = 'badge text-bg-secondary align-self-start mb-2';
  badge.textContent = producto.categoria;

  const titulo = document.createElement('h3');
  titulo.className = 'h6';
  titulo.textContent = producto.nombre;

  const precio = document.createElement('p');
  precio.className = 'precio mb-2';
  precio.textContent = formatearPrecio(producto.precio);

  const acciones = document.createElement('div');
  acciones.className = 'acciones';

  const btnDetalle = document.createElement('button');
  btnDetalle.type = 'button';
  btnDetalle.className = 'btn btn-sm btn-outline-light flex-fill accion-detalle';
  btnDetalle.textContent = 'Ver detalle';
  btnDetalle.dataset.id = producto.id;

  const btnAgregar = document.createElement('button');
  btnAgregar.type = 'button';
  btnAgregar.className = 'btn btn-sm btn-warning flex-fill accion-agregar';
  btnAgregar.textContent = 'Agregar al carrito';
  btnAgregar.dataset.id = producto.id;

  acciones.append(btnDetalle, btnAgregar);
  cuerpo.append(badge, titulo, precio, acciones);
  tarjeta.append(img, cuerpo);
  columna.appendChild(tarjeta);

  return columna;
}

/* ========================= EVENTOS: CLICK ========================= */

/**
 * Delegación de eventos: un único listener en el contenedor de
 * productos gestiona los clics de todas las tarjetas (incluso las que
 * se agregan dinámicamente después de la carga inicial).
 */
function initEventosCatalogo() {
  const contenedor = document.getElementById('contenedorProductos');
  contenedor.addEventListener('click', (evento) => {
    const botonAgregar = evento.target.closest('.accion-agregar');
    if (botonAgregar) {
      agregarAlCarrito(botonAgregar.dataset.id);
      return;
    }
    const botonDetalle = evento.target.closest('.accion-detalle');
    if (botonDetalle) {
      mostrarDetalleProducto(botonDetalle.dataset.id);
    }
  });
}

/* ============================ CARRITO ============================ */

/** Agrega un producto al carrito (o incrementa su cantidad si ya existe). */
function agregarAlCarrito(id) {
  const producto = obtenerProductoPorId(id);
  if (!producto) return;

  const itemExistente = carrito.find((item) => item.id === producto.id);
  if (itemExistente) {
    itemExistente.cantidad += 1;
  } else {
    carrito.push({ id: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad: 1 });
  }

  renderizarCarrito(producto.id);
  mostrarToast(`"${producto.nombre}" se agregó al carrito.`);
}

/** Quita por completo un producto del carrito. */
function quitarDelCarrito(id) {
  carrito = carrito.filter((item) => item.id !== Number(id));
  renderizarCarrito();
}

/**
 * Reconstruye dinámicamente el resumen del carrito: lista de ítems,
 * subtotal y contador del navbar. Recibe opcionalmente el id recién
 * agregado para aplicarle una animación de feedback visual.
 */
function renderizarCarrito(idRecienAgregado) {
  const lista = document.getElementById('listaCarrito');
  const subtotalEl = document.getElementById('subtotalCarrito');
  const contadorEl = document.getElementById('contadorCarrito');

  lista.innerHTML = '';

  if (carrito.length === 0) {
    const vacio = document.createElement('li');
    vacio.className = 'list-group-item text-secondary';
    vacio.id = 'carritoVacioMsg';
    vacio.textContent = 'Tu carrito está vacío. Agrega productos desde el catálogo.';
    lista.appendChild(vacio);
  } else {
    carrito.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'list-group-item item-carrito';
      if (item.id === Number(idRecienAgregado)) {
        li.classList.add('recien-agregado');
      }

      const info = document.createElement('div');
      const nombre = document.createElement('div');
      nombre.className = 'nombre-item';
      nombre.textContent = item.nombre;
      const detalle = document.createElement('small');
      detalle.textContent = `${item.cantidad} x ${formatearPrecio(item.precio)}`;
      info.append(nombre, detalle);

      const btnQuitar = document.createElement('button');
      btnQuitar.type = 'button';
      btnQuitar.className = 'btn btn-sm btn-outline-danger';
      btnQuitar.setAttribute('aria-label', `Quitar ${item.nombre} del carrito`);
      btnQuitar.textContent = '✕';
      btnQuitar.addEventListener('click', () => quitarDelCarrito(item.id));

      li.append(info, btnQuitar);
      lista.appendChild(li);
    });
  }

  const totalItems = carrito.reduce((suma, item) => suma + item.cantidad, 0);
  const subtotal = carrito.reduce((suma, item) => suma + item.cantidad * item.precio, 0);
  contadorEl.textContent = totalItems;
  subtotalEl.textContent = formatearPrecio(subtotal);
}

/** Vacía completamente el carrito de compras. */
function initBotonVaciarCarrito() {
  document.getElementById('btnVaciarCarrito').addEventListener('click', () => {
    carrito = [];
    renderizarCarrito();
  });
}

/* ======================= EVENTO SUBMIT: BÚSQUEDA ======================= */

/**
 * Procesa el formulario de búsqueda: evita el envío tradicional
 * (preventDefault), valida el texto ingresado y filtra el catálogo
 * mostrando solo los productos cuyo nombre coincide.
 */
function initFormularioBusqueda() {
  const formulario = document.getElementById('formBusqueda');
  const input = document.getElementById('inputBusqueda');
  const resultado = document.getElementById('resultadoBusqueda');

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const termino = input.value.trim().toLowerCase();

    // Restablece el filtro de categoría al buscar en todo el catálogo
    categoriaActiva = 'todos';
    actualizarCategoriaActivaUI();

    if (termino === '') {
      resultado.className = 'alert alert-warning';
      resultado.textContent = 'Escribe el nombre de un producto para buscar.';
      resultado.classList.remove('d-none');
      productosVisibles = [...productos];
      renderizarProductos(productosVisibles);
      return;
    }

    const coincidencias = productos.filter((p) => p.nombre.toLowerCase().includes(termino));
    productosVisibles = coincidencias;

    if (coincidencias.length === 0) {
      resultado.className = 'alert alert-warning';
      resultado.textContent = `No se encontraron productos para "${input.value}".`;
    } else {
      resultado.className = 'alert alert-info';
      resultado.textContent = `${coincidencias.length} producto(s) encontrado(s) para "${input.value}".`;
    }
    resultado.classList.remove('d-none');
    renderizarProductos(productosVisibles);
  });

  // Oculta el mensaje de resultado cuando el usuario vuelve a escribir
  input.addEventListener('input', () => resultado.classList.add('d-none'));
}

/* ===================== EVENTO CLICK: FILTRO POR CATEGORÍA ===================== */

/** Permite filtrar el catálogo haciendo clic en las categorías simuladas del navbar. */
function initFiltroCategorias() {
  document.getElementById('listaCategorias').addEventListener('click', (evento) => {
    const link = evento.target.closest('.categoria-link');
    if (!link) return;
    evento.preventDefault();

    categoriaActiva = link.dataset.categoria;
    actualizarCategoriaActivaUI();

    document.getElementById('resultadoBusqueda').classList.add('d-none');
    document.getElementById('inputBusqueda').value = '';

    productosVisibles = categoriaActiva === 'todos'
      ? [...productos]
      : productos.filter((p) => p.categoria === categoriaActiva);

    renderizarProductos(productosVisibles);
  });
}

/** Sincroniza el estilo "activo" de los enlaces de categoría y el badge informativo. */
function actualizarCategoriaActivaUI() {
  document.querySelectorAll('.categoria-link').forEach((link) => {
    link.classList.toggle('active', link.dataset.categoria === categoriaActiva);
  });
  const nombres = { todos: 'Todos', videojuegos: 'Videojuegos', consolas: 'Consolas', accesorios: 'Accesorios' };
  document.getElementById('badgeCategoriaActiva').textContent = `Mostrando: ${nombres[categoriaActiva] || categoriaActiva}`;
}

/* ========================= MODAL DE DETALLE ========================= */

/** Rellena y muestra el modal de Bootstrap con la información del producto. */
function mostrarDetalleProducto(id) {
  const producto = obtenerProductoPorId(id);
  if (!producto) return;

  document.getElementById('modalProductoLabel').textContent = producto.nombre;
  document.getElementById('modalProductoImg').src = producto.imagen;
  document.getElementById('modalProductoImg').alt = producto.nombre;
  document.getElementById('modalProductoGenero').textContent = producto.genero;
  document.getElementById('modalProductoJugadores').textContent = producto.jugadores;
  document.getElementById('modalProductoDescripcion').textContent = producto.descripcion;
  document.getElementById('modalProductoPrecio').textContent = formatearPrecio(producto.precio);
  document.getElementById('modalBtnAgregar').dataset.id = producto.id;

  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalProducto'));
  modal.show();
}

/** Conecta el botón "Agregar al carrito" del modal con la lógica del carrito. */
function initModalAgregar() {
  document.getElementById('modalBtnAgregar').addEventListener('click', (evento) => {
    agregarAlCarrito(evento.target.dataset.id);
  });
}

/* ============================== TOASTS ============================== */

/** Muestra una notificación temporal (toast) y la elimina del DOM tras 2.5s. */
function mostrarToast(mensaje) {
  const contenedor = document.getElementById('contenedorToasts');

  const toast = document.createElement('div');
  toast.className = 'toast align-items-center text-bg-dark border-0 show';
  toast.setAttribute('role', 'status');

  const flex = document.createElement('div');
  flex.className = 'd-flex';

  const cuerpo = document.createElement('div');
  cuerpo.className = 'toast-body';
  cuerpo.textContent = mensaje;

  flex.appendChild(cuerpo);
  toast.appendChild(flex);
  contenedor.appendChild(toast);

  setTimeout(() => toast.remove(), 2500);
}

/* ==================== ACCESIBILIDAD DEL CARRUSEL ==================== */

/**
 * El carrusel de Bootstrap pausa automáticamente al pasar el mouse por
 * encima (data-bs-pause="hover"), pero no responde al foco de teclado.
 * Esta función agrega esa pausa por foco para que una persona que
 * navega con Tab también pueda detener el avance automático.
 */
function initPausaCarruselAccesible() {
  const carrusel = document.getElementById('carruselGameZone');
  if (!carrusel) return;
  const instancia = bootstrap.Carousel.getOrCreateInstance(carrusel);

  carrusel.addEventListener('focusin', () => {
    instancia.pause();
    carrusel.classList.add('en-pausa');
  });
  carrusel.addEventListener('focusout', (evento) => {
    if (carrusel.contains(evento.relatedTarget)) return;
    instancia.cycle();
    carrusel.classList.remove('en-pausa');
  });
}
