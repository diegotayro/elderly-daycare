import { requireAdminUser } from "@/auth/require-user";
import { StaffListTitle } from "./StaffListTitle";

export async function StaffListContent() {
  await requireAdminUser();

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <header className="mb-[22px]">
        <StaffListTitle />
      </header>
    </div>
  );
}
