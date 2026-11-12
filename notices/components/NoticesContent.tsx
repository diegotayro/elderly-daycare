import { requireTeamUser } from "@/auth/require-user";
import { mockNotices } from "../mock-notices";
import { NoticesView } from "./NoticesView";

export async function NoticesContent() {
  await requireTeamUser();

  return <NoticesView notices={mockNotices} />;
}
