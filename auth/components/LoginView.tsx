import { LoginForm } from "./LoginForm";
import { LoginHero } from "./LoginHero";

export function LoginView() {
  return (
    <div className="grid min-h-screen grid-cols-[1.05fr_1fr]">
      <LoginHero />
      <div className="flex items-center justify-center p-10">
        <LoginForm />
      </div>
    </div>
  );
}
