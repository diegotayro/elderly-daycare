export const relativeInvitationMessages = {
  firstNameRequired: "Ingresa los nombres.",
  lastNameRequired: "Ingresa los apellidos.",
  emailRequired: "Ingresa el email.",
  emailInvalid: "Ingresa un email válido.",
  emailAlreadyLinked: (elderlyFirstName: string) =>
    `Este email ya está vinculado a ${elderlyFirstName}.`,
  emailBelongsToTeam: "Este email pertenece al personal.",
  pendingReplaceWarning:
    "Este familiar ya tiene una invitación pendiente. Si continúas, la nueva reemplazará a la anterior y su código dejará de funcionar.",
  relationshipRequired: "Elige el parentesco.",
} as const;
