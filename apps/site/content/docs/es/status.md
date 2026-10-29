# Estado y hoja de ruta

Rebomail está en la versión 0.1. Esta página dice claramente qué está comprobado, qué no, y qué sigue.

## Qué está comprobado {#what-is-checked}

- **El motor**: cada bloque dibujado en HTML y texto; el árbol (insertar, mover entre columnas y secciones, quitar, copiar); leer lo guardado; la revisión; limpiar el HTML escrito a mano.
- **El editor**: en un DOM hecho por happy-dom, la paleta, elegir, escribir con las marcas, el panel, el historial, las teclas y los bloques propios.
- **El servidor**: preparar un mensaje y sus encabezados; la API de lotes de Resend contra un `fetch` falso; el cliente SMTP contra un servidor en un socket real (STARTTLS rechazado, autenticación, una dirección rechazada, dot-stuffing); las firmas del rastreador; cada ruta del manejador; las firmas de Svix; el adaptador de Node.
- Tipos y Biome en todo; el playground y este sitio compilados.

## Qué no {#what-is-not}

- **Arrastrar en un navegador real.** Las pruebas cubren el estado; la mano de una persona con un mouse o una pantalla táctil no la ha probado una máquina.
- **Enviar de verdad.** Todavía no se le ha escrito a una cuenta real de Resend ni a un servidor SMTP real.
- **Las bandejas.** El HTML sigue lo que se sabe que funciona en Gmail, Outlook y Apple Mail, pero no se ha visto en cada una con un servicio como Litmus.

## Límites conocidos {#known-limits}

- Las fuentes son solo las que tiene toda computadora; las bandejas no cargan ninguna.
- Un video es una imagen y una liga: ninguna bandeja lo reproduce.
- Las columnas son dos o tres; una columna no contiene diseños.
- Las aperturas se cuentan con una imagen, que algunas bandejas cargan solas y otras nunca.

## Hoja de ruta {#roadmap}

- **`@rebomail/mcp`**: correos escritos por asistentes de IA, bloque por bloque, con la misma revisión.
- **Dentro de ReboCRM**, la aplicación para la que se hizo: sus propiedades y las firmas de sus asesores como bloques propios.
- **En npm.**

## Contribuir {#contributing}

Abre un issue o un pull request en el [repositorio](https://github.com/JFranciscoRobles/rebomail). Corre `npm test`, `npm run typecheck` y `npm run lint` antes; un cambio en lo que recibe una bandeja necesita una prueba de su HTML.

## Licencia {#license}

MIT.
