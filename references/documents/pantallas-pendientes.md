# Pantallas pendientes por maquetar

Lista de pantallas, modales y componentes que faltan. Marcar cada uno al terminarlo.

---

## A. Tienen mockup, falta implementarlas

### Staff/Admin

- [x] **1. Avisos** (`avisos.dc.html`): lista de actividad (comentarios, reacciones, cuentas activadas, recordatorios). Ruta `/notices` (SPEC 07, datos mock).
- [x] **2. Mi cuenta (staff)** (`mi-cuenta.dc.html`): perfil, notificaciones, cambiar contraseña, ayuda y cerrar sesión. Ruta `/account` (SPEC 08, datos mock; foto, preferencias de notificaciones guardadas en la DB y "Editar perfil" del admin desde SPEC 31).

### Familiar (relative)

- [x] **3. Feed familiar** (`familia-feed.dc.html`): saludo, filtro por adulto mayor (Luis / Carmen / Todos) y posts. Tiene un menú propio: Feed, Resumen del día, Mi cuenta. Ruta `/family` (SPEC 18, datos mock).
- [ ] **4. Detalle de publicación** (`detalle-publicacion.dc.html`): post completo, "Me encanta", comentarios y caja para comentar.
- [x] **5. Foto a pantalla completa** (`foto.dc.html`): visor oscuro con los datos del post. Capa `<dialog>` sobre el feed y el detalle (SPEC 30).
- [x] **6. Mi cuenta familiar** (`familia-cuenta.dc.html`): sus adultos mayores con el estado de fotos (solo lectura) y sus notificaciones. Ruta `/family/account` (SPEC 18, datos mock; desde SPEC 31 con datos reales, foto y sin la tarjeta de notificaciones).
- [x] **7. Resumen del día** (`resumen-dia.dc.html`): la tabla `daily_summaries` y `list_summary_posts` existen desde SPEC 37. Ruta `/family/summary` con datos reales (SPEC 38); el equipo la ve en `/elderly/[id]/summary`.

---

## B. Sin mockup (hay que diseñarlas)

### Gestión de personal (admin)

- [x] **8. Pantalla "Personal"**: lista del staff con su estado (Pendiente / Activo / Archivado) y acciones de reenviar invitación, archivar y reactivar. (SPEC 20, datos mock; reenviar invitación: SPEC 21; archivar y reactivar: SPEC 23)
- [x] **9. Modal "Agregar personal"**: nombres, apellidos y email (flujo Staff, paso 1). (SPEC 20, UI; SPEC 21, invitación real)
- [ ] **10. Modal de confirmación para archivar o reactivar**: sirve para staff y familiares. Al archivar a un staff, avisa qué adultos mayores quedan sin cuidador.
- [x] **11. Asignar staff ↔ adulto mayor** (`staff_elderly`): desde el detalle del staff, con un modal para vincular y otro para desvincular. (SPEC 20, UI; SPEC 21, datos reales)

### Adultos mayores (admin)

- [x] **12. Modal "Editar adulto mayor"**: el botón "Editar" del perfil abre un modal con el mismo formulario del alta, precargado; solo el admin y solo en adultos mayores `active`. Guarda únicamente lo que cambió e incluye la habitación (el `photo_consent` se cambia desde el perfil, SPEC 32). (SPEC 33)
- [x] **13. Archivar / reactivar adulto mayor y ver los archivados**: la sección "ARCHIVADOS" de `/elderly` existe desde SPEC 16; los botones "Archivar" (con confirmación) y "Reactivar" del perfil, solo para el admin, llegan en SPEC 34.
- [ ] **14. Gestión de familiares e invitaciones**: en "Familiares vinculados" faltan las acciones cancelar invitación, generar una nueva si venció (estado "Vencida"), desvincular (borrar en `guardian_elderly`) y archivar al familiar.
- [x] **27. Perfil del familiar para el admin** (`/relatives/[id]`): foto, nombre, email, parentesco y sus adultos mayores (con "Archivado" y consentimiento de fotos en solo lectura), con "Cambiar foto" y "Editar". Se entra desde "Familiares vinculados" de `/elderly/[id]`. (SPEC 31)

### Habitaciones (admin)

- [ ] **15. Pantalla o modal "Habitaciones"**: crear, renombrar y eliminar. "Temporal" se puede renombrar, pero no eliminar. No existe nada.

### Publicaciones

- [x] **16. Modal "Editar publicación"**: resuelto en SPEC 36. Reusa el formulario de crear; por decisión del usuario la audiencia se puede cambiar (siempre con al menos un etiquetado si es `elderly`).
- [ ] **17. Confirmaciones de borrado**: eliminar un post, quitar una foto y que el admin borre un comentario (moderación). Eliminar un post: resuelto en SPEC 35. Quitar una foto: resuelto en SPEC 36 (en el modal de edición).
- [ ] **18. Advertencia de consentimiento de fotos**: al subir fotos a un post `room` o `daycare`, mostrar qué adultos mayores no tienen consentimiento.
- [ ] **19. Editar y eliminar comentario propio**: el detalle solo muestra cómo se crean.

### Auth / cuenta

- [x] **20. `/create-password`**: donde el staff llega desde el correo de invitación, pasando por `/accept-invite` (flujo Staff, paso 4). (SPEC 21)
- [x] **21. "Vincular adulto mayor"**: para un familiar que ya tiene cuenta. Pide código y consentimiento. (resuelto por SPEC 17: es el modo "INGRESE SU CONTRASEÑA" de `/activate-account`)
- [ ] **22. Recuperar contraseña**: el login tiene "¿Olvidaste tu contraseña?", pero falta la pantalla para pedir el correo y la de nueva contraseña.
- [ ] **23. Modal "Cambiar contraseña"**: lo abre el botón de "Mi cuenta". "Editar perfil" (foto y nombre) se resolvió en SPEC 31: "Cambiar foto" para todos y "Editar" para el admin.
- [ ] **24. Mi cuenta del admin**: solo existe el mockup de staff. Supuesto: el admin agrega aquí la edición del nombre de la guardería (`daycares.update`).

### Familiar

- [ ] **25. Menú "Staff" del familiar**: el esquema lo menciona en `staff_elderly` ("quién cuida a su familiar"), pero el menú del mockup no lo tiene.

### Pendiente para después

- [x] **26. Formulario del resumen diario (staff)**: modal "Resumen del día" en `/elderly/[id]/summary` (SPEC 38).

---

## Inconsistencias por resolver

- [x] **Notificaciones**: las de `mi-cuenta` (staff) son "Nuevos comentarios de familias" y "Recordatorio 17:00", pero la DB solo tiene `notify_on_post` y `daily_summary_enabled` (19:00). Resuelto en SPEC 31: se mantiene el copy del mockup y cada switch guarda su columna en la DB.
