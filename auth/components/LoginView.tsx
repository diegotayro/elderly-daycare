import { AuthBrandMark } from "./AuthBrandMark";
import { LoginForm } from "./LoginForm";
import { LoginHero } from "./LoginHero";

export function LoginView() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <LoginHero />
      <div className="flex flex-col items-center justify-center p-4 lg:p-10">
        <div className="mb-8 flex w-full max-w-[392px] items-center gap-3 lg:hidden">
          <AuthBrandMark />
          <span className="font-display text-[21px] font-semibold tracking-[0.5px] text-ink">
            Casa Nogal
          </span>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
