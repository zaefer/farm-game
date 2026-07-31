import { login, signup } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#F5F0DF] px-4 py-10">
      <div className="mx-auto max-w-5xl">

        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F6C453] text-3xl">
            🌱
          </div>

          <h1 className="text-3xl font-bold text-[#173B2B]">
            Farm Game
          </h1>

          <p className="mt-2 text-stone-500">
            Grow your farm. Build your world.
          </p>
        </div>

        {params.error && (
          <div className="mx-auto mb-6 max-w-xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {params.error}
          </div>
        )}

        {params.message && (
          <div className="mx-auto mb-6 max-w-xl rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {params.message}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">

          <section className="rounded-[28px] bg-white p-6 shadow-sm md:p-8">
            <span className="mb-3 inline-block rounded-full bg-[#E7F1E9] px-3 py-1 text-xs font-semibold text-[#36734A]">
              WELCOME BACK
            </span>

            <h2 className="text-2xl font-bold text-[#173B2B]">
              Login
            </h2>

            <p className="mt-2 text-sm text-stone-500">
              Continue growing your farm.
            </p>

            <form action={login} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-medium text-stone-700"
                >
                  Email
                </label>

                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="farmer@example.com"
                  className="w-full rounded-2xl border border-stone-200 bg-[#FFFDF7] px-4 py-3 outline-none transition focus:border-[#36734A]"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-sm font-medium text-stone-700"
                >
                  Password
                </label>

                <input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-stone-200 bg-[#FFFDF7] px-4 py-3 outline-none transition focus:border-[#36734A]"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#173B2B] px-5 py-3 font-semibold text-white transition hover:bg-[#24563F]"
              >
                Login
              </button>
            </form>
          </section>

          <section className="rounded-[28px] bg-white p-6 shadow-sm md:p-8">
            <span className="mb-3 inline-block rounded-full bg-[#FFF2C8] px-3 py-1 text-xs font-semibold text-[#8A6612]">
              NEW FARMER
            </span>

            <h2 className="text-2xl font-bold text-[#173B2B]">
              Create Account
            </h2>

            <p className="mt-2 text-sm text-stone-500">
              Start your farm with 100 coins.
            </p>

            <form action={signup} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="register-username"
                  className="mb-2 block text-sm font-medium text-stone-700"
                >
                  Farmer Name
                </label>

                <input
                  id="register-username"
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={20}
                  autoComplete="username"
                  placeholder="berkehan"
                  className="w-full rounded-2xl border border-stone-200 bg-[#FFFDF7] px-4 py-3 outline-none transition focus:border-[#36734A]"
                />
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="mb-2 block text-sm font-medium text-stone-700"
                >
                  Email
                </label>

                <input
                  id="register-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="farmer@example.com"
                  className="w-full rounded-2xl border border-stone-200 bg-[#FFFDF7] px-4 py-3 outline-none transition focus:border-[#36734A]"
                />
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="mb-2 block text-sm font-medium text-stone-700"
                >
                  Password
                </label>

                <input
                  id="register-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-2xl border border-stone-200 bg-[#FFFDF7] px-4 py-3 outline-none transition focus:border-[#36734A]"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#F6C453] px-5 py-3 font-semibold text-[#173B2B] transition hover:bg-[#E9B63D]"
              >
                Create My Farm
              </button>
            </form>
          </section>

        </div>
      </div>
    </main>
  );
}