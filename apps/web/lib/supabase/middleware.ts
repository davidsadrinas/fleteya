import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getEdgeSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) {
    return null;
  }
  return { url: url.trim(), key: key.trim() };
}

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const env = getEdgeSupabaseEnv();
  if (!env) {
    return supabaseResponse;
  }

  let mutableResponse = supabaseResponse;

  try {
    const supabase = createServerClient(env.url, env.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          mutableResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            mutableResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    await supabase.auth.getUser();
  } catch {
    return supabaseResponse;
  }

  return mutableResponse;
}
