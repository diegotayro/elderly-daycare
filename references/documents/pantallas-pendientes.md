# Pantallas pendientes por maquetar

Lista de pantallas, modales y componentes que faltan. Marcar cada uno al terminarlo.

---

## A. Tienen mockup, falta implementarlas

### Staff/Admin

- [x] **1. Avisos** (`avisos.dc.html`): lista de actividad (comentarios, reacciones, cuentas activadas, recordatorios). Ruta `/notices` (SPEC 07, datos mock).
- [x] **2. Mi cuenta (staff)** (`mi-cuenta.dc.html`): perfil, notificaciones, cambiar contraseña, ayuda y cerrar sesión. Ruta `/account` (SPEC 08, datos mock).

### Familiar (relative)

- [x] **3. Feed familiar** (`familia-feed.dc.html`): saludo, filtro por adulto mayor (Luis / Carmen / Todos) y posts. Tiene un menú propio: Feed, Resumen del día, Mi cuenta. Ruta `/family` (SPEC 18, datos mock).
- [ ] **4. Detalle de publicación** (`detalle-publicacion.dc.html`): post completo, "Me encanta", comentarios y caja para comentar.
- [ ] **5. Foto a pantalla completa** (`foto.dc.html`): visor oscuro con los datos del post.
- [x] **6. Mi cuenta familiar** (`familia-cuenta.dc.html`): sus adultos mayores con el estado de fotos (solo lectura) y sus notificaciones. Ruta `/family/account` (SPEC 18, datos mock).
- [x] **7. Resumen del día** (`resumen-dia.dc.html`): el esquema dice que **todavía no** se construye. Solo se crea la tabla. Ruta `/family/summary` (SPEC 18, datos mock).

---

## B. Sin mockup (hay que diseñarlas)

### Gestión de personal (admin)

- [ ] **8. Pantalla "Personal"**: lista del staff con su estado (Pendiente / Activo / Archivado) y acciones de reenviar invitación, archivar y reactivar. (SPEC 20, UI con datos mock)
- [ ] **9. Modal "Agregar personal"**: nombres, apellidos y email (flujo Staff, paso 1). (SPEC 20, UI con datos mock)
- [ ] **10. Modal de confirmación para archivar o reactivar**: sirve para staff y familiares. Al archivar a un staff, avisa qué adultos mayores quedan sin cuidador.
- [ ] **11. Asignar staff ↔ adulto mayor** (`staff_elderly`): no hay ninguna UI para esto. Puede ser una sección "Personal asignado" en el perfil del adulto mayor, o en el detalle del staff, con un modal para asignar o quitar. (SPEC 20, UI con datos mock)

### Adultos mayores (admin)

- [ ] **12. Modal "Editar adulto mayor"**: el botón "Editar" del perfil existe, pero no hay pantalla. Incluye cambiar la habitación y el `photo_consent`, que solo puede cambiar el admin.
- [ ] **13. Archivar / reactivar adulto mayor y ver los archivados**: la lista solo muestra "ACTIVOS".
- [ ] **14. Gestión de familiares e invitaciones**: en "Familiares vinculados" faltan las acciones cancelar invitación, generar una nueva si venció (estado "Vencida"), desvincular (borrar en `guardian_elderly`) y archivar al familiar.

### Habitaciones (admin)

- [ ] **15. Pantalla o modal "Habitaciones"**: crear, renombrar y eliminar. "Temporal" se puede renombrar, pero no eliminar. No existe nada.

### Publicaciones

- [ ] **16. Modal "Editar publicación"**: el botón "Editar" del post existe. Puede reusar el de crear, pero con la audiencia bloqueada y al menos un etiquetado.
- [ ] **17. Confirmaciones de borrado**: eliminar un post, quitar una foto y que el admin borre un comentario (moderación).
- [ ] **18. Advertencia de consentimiento de fotos**: al subir fotos a un post `room` o `daycare`, mostrar qué adultos mayores no tienen consentimiento.
- [ ] **19. Editar y eliminar comentario propio**: el detalle solo muestra cómo se crean.

### Auth / cuenta

- [ ] **20. `/crear-contrasena`**: donde el staff llega desde el correo de invitación (flujo Staff, paso 4).
- [ ] **21. "Vincular adulto mayor"**: para un familiar que ya tiene cuenta. Pide código y consentimiento.
- [ ] **22. Recuperar contraseña**: el login tiene "¿Olvidaste tu contraseña?", pero falta la pantalla para pedir el correo y la de nueva contraseña.
- [ ] **23. Modales "Cambiar contraseña" y "Editar perfil" (avatar)**: los abren los botones de "Mi cuenta".
- [ ] **24. Mi cuenta del admin**: solo existe el mockup de staff. Supuesto: el admin agrega aquí la edición del nombre de la guardería (`daycares.update`).

### Familiar

- [ ] **25. Menú "Staff" del familiar**: el esquema lo menciona en `staff_elderly` ("quién cuida a su familiar"), pero el menú del mockup no lo tiene.

### Pendiente para después

- [ ] **26. Formulario del resumen diario (staff)**: el staff puede escribir en `daily_summaries`, pero eso quedó para una implementación posterior.

---

## Inconsistencias por resolver

- [ ] **Notificaciones**: las de `mi-cuenta` (staff) son "Nuevos comentarios de familias" y "Recordatorio 17:00", pero la DB solo tiene `notify_on_post` y `daily_summary_enabled` (19:00). Hay que decidir cuál ajustar.
- [ ] **Familiar que ya tiene cuenta**: según la nota de "Activar cuenta", si el email ya tiene cuenta debe aparecer un mensaje que lo mande a "Vincular adulto mayor" (punto 21). Ese estado no está en el mockup.
