import { LoginFooter } from "@/components/auth/login/LoginFooter";
import { LoginForm } from "@/components/auth/login/LoginForm";
import { LoginHeader } from "@/components/auth/login/LoginHeader";
import { LoginShowcase } from "@/components/auth/login/LoginShowcase";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#f6f6f8] text-slate-900">
      <div className="flex h-full grow flex-col">
        <LoginHeader />

        <main className="flex flex-1 items-center justify-center p-4 md:p-10">
          <div className="grid w-full max-w-[960px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl md:grid-cols-2">
            <LoginShowcase />
            <LoginForm />
          </div>
        </main>

        <LoginFooter />
      </div>
    </div>
  );
}
