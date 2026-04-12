import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">BuilderMap</h1>
          <p className="mt-2 text-muted-foreground">
            Find hackathons, builders & teams
          </p>
        </div>

        <div className="flex justify-center">
          <SignIn
            appearance={{
              variables: {
                colorBackground: "#09090b",
                colorText: "#fafafa",
                colorPrimary: "#fafafa",
                colorInputBackground: "#18181b",
                colorInputText: "#fafafa",
              },
            }}
            routing="hash"
          />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to appear on the builder map and be
          discoverable by other builders.
        </p>
      </div>
    </div>
  );
}
