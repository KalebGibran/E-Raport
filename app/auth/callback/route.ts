import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";

  // Placeholder callback endpoint.
  // Nanti kita isi code exchange Supabase Auth di sini.
  return NextResponse.redirect(`${origin}${next}`);
}
