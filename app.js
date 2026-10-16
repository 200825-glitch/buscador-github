const API = 'https://api.github.com';

const form       = document.querySelector('#form-buscar');
const input      = document.querySelector('#input-usuario');
const boton      = document.querySelector('#btn-buscar');
const estado     = document.querySelector('#estado');
const perfil     = document.querySelector('#perfil');
const titulo     = document.querySelector('#titulo-repos');
const repos      = document.querySelector('#repos');
const selectOrden   = document.querySelector('#orden');
const contenedorOrden = document.querySelector('#orden-contenedor');
const tituloLenguajes = document.querySelector('#titulo-lenguajes');
const listaLenguajes  = document.querySelector('#lenguajes');
const botonMas   = document.querySelector('#btn-mas');
const pie        = document.querySelector('#pie');

const POR_PAGINA = 5;

// Usuario buscado actualmente (ya codificado para la URL)
let usuarioActual = null;
// Página de repositorios que se está mostrando (empieza en 1)
let paginaActual = 1;

// 1. Petición genérica con traducción de errores HTTP
async function obtenerJSON(url) {
    const res = await fetch(url);

    // Peticiones que quedan en la hora (se lee antes de revisar errores)
    const restantes = res.headers.get('x-ratelimit-remaining');
    if (restantes !== null) {
        pie.textContent = `Peticiones restantes a la API de GitHub: ${restantes}`;
    }

    if (res.status === 404) throw new Error('Usuario no encontrado');
    if (res.status === 403) {
        throw new Error('Límite de peticiones alcanzado');
    }
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    return res.json();
}

// 2. Pintar el perfil
function mostrarPerfil(u) {
    const img = document.createElement('img');
    img.src = u.avatar_url;
    img.alt = `Avatar de ${u.login}`;

    const nombre = document.createElement('h2');
    // si el usuario no registró un nombre, se muestra su login
    nombre.textContent = u.name ?? u.login;

    const datos = document.createElement('p');
    datos.textContent =
        `${u.public_repos} repositorios · ${u.followers} seguidores`;

    const enlace = document.createElement('a');
    enlace.href = u.html_url;
    enlace.target = '_blank';
    enlace.textContent = 'Ver en GitHub';

    const info = document.createElement('div');
    info.append(nombre, datos, enlace);
    perfil.replaceChildren(img, info);
    perfil.classList.remove('oculto');
}

// 3. Pintar la lista de repositorios
function mostrarRepos(lista, anexar = false) {
    // Si no se anexa, se reemplaza la lista; si se anexa, se conserva
    if (!anexar) repos.innerHTML = '';
    lista.forEach(r => {
        const a = document.createElement('a');
        a.href = r.html_url;
        a.target = '_blank';
        a.textContent = r.name;

        const li = document.createElement('li');
        const lenguaje = r.language ?? 'sin lenguaje';
        li.append(a, ` - ${lenguaje} - ★ ${r.stargazers_count}`);
        repos.append(li);
    });
    titulo.classList.remove('oculto');
    contenedorOrden.classList.remove('oculto');

    // Si la API devolvió menos de cinco, ya no hay más páginas
    botonMas.classList.toggle('oculto', lista.length < POR_PAGINA);
}

// 4. Contar repositorios por lenguaje y pintar el resumen
function mostrarLenguajes(lista) {
    const conteo = {};
    lista.forEach(r => {
        const lenguaje = r.language ?? 'sin lenguaje';
        conteo[lenguaje] = (conteo[lenguaje] ?? 0) + 1;
    });

    // De mayor a menor cantidad de repositorios
    const ordenado = Object.entries(conteo).sort((a, b) => b[1] - a[1]);

    listaLenguajes.innerHTML = '';
    ordenado.forEach(([lenguaje, cantidad]) => {
        const li = document.createElement('li');
        li.textContent =
            `${lenguaje}: ${cantidad} ${cantidad === 1 ? 'repositorio' : 'repositorios'}`;
        listaLenguajes.append(li);
    });
    tituloLenguajes.classList.remove('oculto');
}

// 5. Construir la URL de una página de repositorios con el orden elegido
function urlRepos(usuario, pagina = 1) {
    const params = new URLSearchParams({
        sort: selectOrden.value,
        per_page: POR_PAGINA,
        page: pagina
    });
    return `${API}/users/${usuario}/repos?${params}`;
}

// 6. Ocultar todo ante un error
function limpiarResultados() {
    perfil.classList.add('oculto');
    titulo.classList.add('oculto');
    tituloLenguajes.classList.add('oculto');
    contenedorOrden.classList.add('oculto');
    botonMas.classList.add('oculto');
    repos.innerHTML = '';
    listaLenguajes.innerHTML = '';
}

// 7. Evento submit: tres peticiones en paralelo
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usuario = encodeURIComponent(input.value.trim());
    if (!usuario) return;

    // Hasta 100 repositorios (máximo permitido) para el resumen de lenguajes
    const paramsTodos = new URLSearchParams({ per_page: 100 });

    boton.disabled = true;
    estado.className = '';
    estado.textContent = 'Buscando...';

    try {
        const [datosUsuario, datosRepos, todosRepos] = await Promise.all([
            obtenerJSON(`${API}/users/${usuario}`),
            obtenerJSON(urlRepos(usuario)),
            obtenerJSON(`${API}/users/${usuario}/repos?${paramsTodos}`)
        ]);
        usuarioActual = usuario;
        paginaActual = 1;
        mostrarPerfil(datosUsuario);
        mostrarLenguajes(todosRepos);
        mostrarRepos(datosRepos);
        estado.textContent = '';
    } catch (error) {
        usuarioActual = null;
        limpiarResultados();
        estado.className = 'error';
        estado.textContent = error.message;
    } finally {
        boton.disabled = false;
    }
});

// 8. Cambiar el orden: solo se vuelve a pedir la lista de 5 repositorios
selectOrden.addEventListener('change', async () => {
    if (!usuarioActual) return;

    selectOrden.disabled = true;
    estado.className = '';
    estado.textContent = 'Ordenando...';

    try {
        paginaActual = 1;
        const datosRepos = await obtenerJSON(urlRepos(usuarioActual, 1));
        mostrarRepos(datosRepos);
        estado.textContent = '';
    } catch (error) {
        estado.className = 'error';
        estado.textContent = error.message;
    } finally {
        selectOrden.disabled = false;
    }
});

// 9. Botón "Cargar más": trae la siguiente página y la añade a la lista
botonMas.addEventListener('click', async () => {
    if (!usuarioActual) return;

    botonMas.disabled = true;
    estado.className = '';
    estado.textContent = 'Cargando más...';

    try {
        const siguiente = paginaActual + 1;
        const datosRepos = await obtenerJSON(urlRepos(usuarioActual, siguiente));
        paginaActual = siguiente;
        mostrarRepos(datosRepos, true);   // true = no borrar los anteriores
        estado.textContent = '';
    } catch (error) {
        estado.className = 'error';
        estado.textContent = error.message;
    } finally {
        botonMas.disabled = false;
    }
});