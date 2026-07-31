import { createClient } from "@/lib/supabase/server";

export default async function TestDatabasePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("seasons")
    .select("*");

  return (
    <main className="min-h-screen bg-[#F5F0DF] p-10">
      <h1 className="text-3xl font-bold text-[#173B2B]">
        Supabase Test
      </h1>

      {error ? (
        <pre className="mt-5 rounded-xl bg-red-100 p-5 text-red-700">
          {JSON.stringify(error, null, 2)}
        </pre>
      ) : (
        <pre className="mt-5 rounded-xl bg-white p-5">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}