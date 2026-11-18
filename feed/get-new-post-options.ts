import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { createClient } from "@/shared/supabase/server";
import type { Elderly, Room } from "@/shared/database/types";
import { buildNewPostOptions } from "./build-new-post-options";
import type { NewPostOptions } from "./types";

type ServerClient = ReturnType<typeof createClient>;

const NO_OPTIONS: NewPostOptions = {
  elderly: [],
  rooms: [],
  canPostToDaycare: false,
  roomsWithoutPhotoConsent: [],
};

async function findRoomsWithoutPhotoConsent(
  supabase: ServerClient,
  roomIds: string[],
): Promise<string[]> {
  const results = await Promise.all(
    roomIds.map(async (roomId) => {
      const { data, error } = await supabase.rpc(
        "room_has_elderly_without_photo_consent",
        { p_room_id: roomId },
      );
      if (error) throw error;
      return data === true ? roomId : null;
    }),
  );
  return results.filter((roomId) => roomId !== null);
}

export async function getNewPostOptions(): Promise<NewPostOptions> {
  const user = await getCurrentUser();
  if (!user || user.role === "relative") return NO_OPTIONS;

  const supabase = createClient(await cookies());
  const [elderlyResult, roomsResult] = await Promise.all([
    supabase
      .from("elderly")
      .select("*")
      .eq("status", "active")
      .order("first_name"),
    supabase.from("rooms").select("*").order("name"),
  ]);
  if (elderlyResult.error) throw elderlyResult.error;
  if (roomsResult.error) throw roomsResult.error;

  const elderly: Elderly[] = elderlyResult.data;
  const rooms: Room[] = roomsResult.data;
  const options = buildNewPostOptions({ role: user.role, rooms, elderly });
  const roomsWithoutPhotoConsent = await findRoomsWithoutPhotoConsent(
    supabase,
    options.rooms.map((room) => room.id),
  );

  return { ...options, roomsWithoutPhotoConsent };
}
