# App Store — Evitar fricción con el review (2024–2025)

La guía oficial es [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/). Lo que sigue resume **malas interpretaciones** sobre “apps hechas con IA” y un **checklist** para FleteYa.

## Qué es lo que Apple sí cuestiona

- **Calidad y utilidad:** apps mínimas, clones, plantillas sin funcionalidad real, pantallas rotas o flujos que no terminan.
- **Metadatos engañosos:** descripciones o capturas que no reflejan la app, keywords basura, promesas falsas.
- **Spam / cuenta duplicada:** muchas apps casi idénticas o “shell” de un sitio web sin valor añadido en nativo.
- **Privacidad y transparencia:** declaración de privacidad (nutrition labels), permisos justificados, coherencia con el uso real de datos.
- **Si la app ofrece IA **al usuario** (chatbots, generación de contenido, etc.):** reglas y etiquetas específicas (divulgación, contenido generado, moderación). FleteYa **no** necesita presentarse como “app de IA” si no expone ese tipo de funciones.

**No** hay una política que diga “rechazamos todo lo desarrollado con herramientas de asistencia”. Lo que filtran los reviewers es la **experiencia del producto** y el **cumplimiento de las guidelines**, no si usaste un editor o un asistente en el código.

## Qué evitar en FleteYa (producto y marketing)

1. **No mencionar en la ficha de la App Store** (ni en la app para el usuario final) herramientas de desarrollo: ChatGPT, Cursor, “creada con IA”, etc.
2. **No vender la app como “IA”** si el valor es marketplace + logística; no uses “powered by AI” en subtítulo o descripción sin una función clara y real.
3. **Descripción, capturas y la app deben coincidir:** mismos flujos (login, pedido, tracking, perfil).
4. **URLs obligatorias:** política de privacidad y página de soporte/contacto accesibles y serias.
5. **Cuenta de prueba** si hay login: preparar usuario demo y notas para el revisor en App Store Connect.
6. **Permisos (ya en `app.json`):** textos de `Info.plist` alineados con el uso real (ubicación, cámara, fotos); no pedir más de lo necesario.

## Checklist antes de enviar

- [ ] Build estable: flujos críticos probados en dispositivo físico iOS.
- [ ] Sin placeholders obvios (“lorem”, “TODO”, botones que no hacen nada) en build de producción.
- [ ] Metadata en español claro, sin buzzwords de IA.
- [ ] Privacy Nutrition completado según datos que **realmente** recolecta la app (ubicación, identificadores, etc.).
- [ ] `App Privacy` y política alineados con Supabase, mapas, notificaciones y cualquier analytics.

## Desarrollo interno (Cursor, Claude, etc.)

Podés usar asistencia para programar **siempre que** el resultado sea código revisado, coherente y vuestro. Eso no es un criterio de publicación. Lo que cuenta es el **binario y la ficha** que ve Apple y el usuario.

Para convenciones del repo (incluido “sin rastros de herramientas en el código” orientado a comentarios basura), ver `.cursorrules`.
