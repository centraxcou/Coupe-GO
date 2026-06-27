# CouPe Go! — App de Motorizados

Prototipo funcional de la app de motorizados de CouPe (Courier Perú).

## ¿Por qué este proyecto y no solo el artifact del chat?

Dentro del chat de Claude, esta app corre en una vista previa restringida (un
"sandbox") que **bloquea el acceso a la cámara y a `tel:` (llamadas)** por
seguridad del navegador. Por eso "Llamar", "Tomar foto" y "Escanear" no
respondían ahí — no era un error del código, sino una limitación del visor.

Este proyecto es el mismo código, listo para desplegarse como página web real
(igual que tu PWA anterior en `coupe-courierperu.netlify.app`). Ahí esas
funciones sí van a abrir la cámara y el marcador de verdad.

## Cómo subirlo a Netlify (arrastrar y soltar, sin terminal)

1. Entra a [app.netlify.com](https://app.netlify.com) con tu cuenta.
2. Ve a **Sites** → tu sitio existente, o crea uno nuevo.
3. Necesitas generar la carpeta `dist` antes de subirla (ver abajo "Cómo generar dist").
4. Arrastra la carpeta `dist` a la zona de despliegue de Netlify ("Deploy manually" / drag and drop).
5. Netlify te da una URL pública en segundos. Ábrela desde tu celular.

## Cómo generar la carpeta `dist` (necesitas Node.js instalado una sola vez)

Si no tienes Node.js, descárgalo de [nodejs.org](https://nodejs.org) (versión LTS) e instálalo como cualquier programa de Windows/Mac.

Luego, en una terminal dentro de esta carpeta:

```bash
npm install
npm run build
```

Esto crea la carpeta `dist/` — esa es la que arrastras a Netlify.

## Alternativa: Netlify conectado a GitHub (recomendado a futuro)

Si más adelante subes este código a un repositorio de GitHub, puedes conectar
ese repositorio directamente a Netlify y cada vez que subas un cambio se
actualizará la app sola, sin tener que generar `dist` ni arrastrar nada a mano.

## Qué probar una vez desplegado

- **Llamar**: debe abrir el marcador del teléfono con el número ya puesto.
- **Abrir mapa**: debe abrir Google Maps con la ubicación.
- **Tomar foto**: debe pedir permiso de cámara y abrir la cámara trasera.
- **Escanear paquete**: por ahora simula la lectura y permite escribir el
  código manualmente. Conectar lectura real de código de barras con la
  cámara es el siguiente paso una vez confirmes que todo lo demás funciona.

## Qué sigue siendo prototipo (datos de prueba, no backend real)

- El login acepta cualquier usuario/contraseña (no valida contra una base real todavía).
- Las órdenes de entrega y recojo son datos fijos de ejemplo.
- El envío de boleta por correo es un botón sin conexión real a un servicio de correo aún.

Estos tres puntos se conectan cuando definamos el backend (Google Sheets +
Apps Script, o Firebase/Supabase).
