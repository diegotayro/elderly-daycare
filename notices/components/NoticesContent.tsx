import { requireTeamUser } from "@/auth/require-user";
import { fetchNotices } from "../fetch-notices";
import { NoticesView } from "./NoticesView";

export async function NoticesContent() {
  const user = await requireTeamUser();
  const notices = await fetchNotices(user);

  return <NoticesView notices={notices} />;
}
