import "server-only";
import { getAcceptInviteUrl } from "./get-accept-invite-url";

type InvitedStaff = {
  firstName: string;
  lastName: string;
  daycareId: string;
};

// role y daycare_id los fija el servidor, nunca el formulario
export function buildStaffInvitationOptions(staff: InvitedStaff) {
  return {
    redirectTo: getAcceptInviteUrl(),
    data: {
      first_name: staff.firstName,
      last_name: staff.lastName,
      role: "staff",
      daycare_id: staff.daycareId,
    },
  };
}
