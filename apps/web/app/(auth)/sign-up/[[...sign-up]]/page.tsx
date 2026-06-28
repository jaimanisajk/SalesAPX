import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Get started with <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">ApexSDR</span>
          </h1>
          <p className="text-sm text-slate-400">
            Create an account to deploy your first AI outbound sequence
          </p>
        </div>
        <div className="flex justify-center">
          <SignUp
            appearance={{
              variables: {
                colorPrimary: "#6366f1",
                colorBackground: "#0f172a",
                colorInputBackground: "#1e293b",
                colorText: "#f8fafc",
                colorTextSecondary: "#94a3b8",
                colorInputText: "#f8fafc",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
