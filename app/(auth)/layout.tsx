export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <div className="min-h-screen bg-auth-bg">{children}</div>;
}
