# Buscador de perfiles GitHub

Aplicación web hecha con HTML, CSS y JavaScript puro que consulta la API REST pública de GitHub y muestra el perfil de un usuario junto con sus repositorios.

**Sitio publicado:** https://200825-glitch.github.io/buscador-github/

Práctica de laboratorio #03-D · Desarrollo de Software I · Universidad Nacional San Antonio Abad del Cusco.

## Qué hace

- Busca un usuario de GitHub y muestra su avatar, nombre, número de repositorios y seguidores, con un enlace a su perfil.
- Lista sus repositorios (de 5 en 5) con el lenguaje y la cantidad de estrellas.
- Permite ordenar los repositorios por `updated`, `created` o `full_name`.
- Muestra un resumen de los lenguajes más usados, contando cuántos repositorios hay de cada uno.
- Incluye el botón **Cargar más**, que añade los siguientes cinco repositorios sin borrar los anteriores y se oculta cuando ya no hay más.
- Muestra en el pie de la página cuántas peticiones quedan disponibles (cabecera `x-ratelimit-remaining`).
- Traduce los errores HTTP a mensajes claros: 404 (usuario no encontrado), 403 (límite de peticiones alcanzado) y otros.

## Cómo usarlo

1. Abre el sitio publicado, o descarga el repositorio y abre `index.html` con la extensión **Live Server** de Visual Studio Code.
2. Escribe un nombre de usuario de GitHub (por ejemplo `octocat`) y pulsa **Buscar**.
3. Cambia el orden con el selector o pulsa **Cargar más** para ver más repositorios.

## Tecnologías y conceptos

- `fetch` con `async/await` y `Promise.all` para hacer peticiones en paralelo.
- `URLSearchParams` y `encodeURIComponent` para construir las URLs de forma segura.
- Manejo de códigos de estado HTTP y de cabeceras de respuesta.
- Git para el control de versiones y GitHub Pages para la publicación.

## Estructura

```
buscador-github/
├── index.html
├── app.js
├── README.md
└── .gitignore
```

## Límite de peticiones

La API de GitHub permite **60 peticiones por hora** sin autenticación. Cada búsqueda gasta 3 peticiones (perfil, repositorios y resumen de lenguajes), y cada clic en **Cargar más** o cambio de orden gasta 1. Si se alcanza el límite, la aplicación muestra un aviso y hay que esperar a que se reinicie la hora.

## Seguridad: por qué no se usa un token

Un token de acceso es una clave personal. Todo el código de una página web (`app.js`) es visible para cualquier visitante, y en un repositorio público lo puede leer cualquier persona. Si un token se escribe en el código, queda expuesto y cualquiera podría usar la cuenta del dueño. Por eso GitHub revoca automáticamente los tokens que detecta en repositorios públicos. Los tokens deben guardarse en un servidor (backend) o en variables de entorno, nunca en el frontend. Esta aplicación no usa token y consulta únicamente datos públicos.
