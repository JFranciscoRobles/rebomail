# Qué es Rebomail

Rebomail es un editor de correos para el navegador, con motor propio. Un correo son bloques uno debajo de otro, acomodados en secciones y columnas que contienen otros bloques, y convertidos al HTML que leen todas las bandejas. Se hizo para vivir dentro de otra aplicación, un CRM que escribe campañas a sus contactos, por eso viene en paquetes que tomas uno a uno.

<demo name="editor" />

## Qué obtienes {#what-you-get}

- **Un correo que se escribe sobre sí mismo.** Das clic en un bloque y escribes donde se ven sus palabras; `⌘B`, `⌘I` y `⌘K` para negritas, cursivas y ligas. Lo que no son palabras (ligas, imágenes, colores) va en un panel al lado.
- **Secciones y columnas.** Arrastra bloques a una sección con fondo, o a dos o tres columnas que se apilan en el celular. Una línea marca dónde cae cada uno.
- **Bloques propios.** Un producto, una propiedad, la firma de quien lo envía: se registran con cómo se ven, qué piden y su HTML. Rebomail no sabe nada de lo que vendes.
- **HTML que lee toda bandeja.** Tablas, estilo en cada elemento, 600 pixeles, columnas que se apilan y el texto plano al lado. El HTML escrito a mano se limpia de scripts, iframes y formularios.
- **Revisión antes de enviar.** Sin asunto, una columna vacía, un botón que no va a ningún lado, una variable que nadie llena: cada cosa con un código, y en palabras en inglés o español.
- **Envío y seguimiento.** Resend o cualquier servidor SMTP; aperturas y clics contados con ligas firmadas; baja en un clic, como piden Gmail y Yahoo.
- **Deshacer y rehacer, inglés y español, claro y oscuro.** Sin más dependencias que React para el editor, y ninguna para el motor.

## Los paquetes {#the-packages}

| Paquete | Tómalo cuando |
| --- | --- |
| `@rebomail/react` | Tienes una aplicación de React o Next.js y quieres el editor en una pantalla. |
| `@rebomail/core` | Haces correos en código: generar el HTML y el texto, cambiar el árbol de bloques, revisar qué falta. |
| `@rebomail/server` | Los envías: Resend o SMTP, aperturas y clics, bajas, los webhooks de Resend. |

[Paquetes](/docs/packages/) dice qué contiene cada uno y de qué depende.

## Qué no es {#what-it-is-not}

- **No es un servicio de envío.** No hay nada a qué registrarse. Es código que tú corres; los correos salen por tu cuenta de Resend o tu servidor SMTP.
- **No administra listas.** Quiénes son los destinatarios, quién se dio de baja y qué se abrió lo guarda tu aplicación: Rebomail le avisa cada cosa cuando pasa.
- **No está terminado.** Es la versión 0.1: el motor, el editor y el envío escritos y probados, nada en npm todavía. [Estado y hoja de ruta](/docs/status/) dice qué está comprobado y qué falta.

## Licencia {#license}

MIT. Cualquiera puede usarlo para lo que sea, también de forma comercial, sin garantía.
