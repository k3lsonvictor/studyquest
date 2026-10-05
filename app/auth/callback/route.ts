import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { confirmationDestination } from "@/lib/auth-callback";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = await confirmationDestination(
    url.searchParams,
    async (code, options) => {
      const db = await supabase();
      return db.auth.exchangeCodeForSession(code, options);
    },
  );
  const response = NextResponse.redirect(new URL(destination, url.origin));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
