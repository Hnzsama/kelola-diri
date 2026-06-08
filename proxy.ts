import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Proteksi rute privat/internal
  const isPrivateRoute = pathname.startsWith("/dashboard") ||
                         pathname.startsWith("/academic") ||
                         pathname.startsWith("/organizations") ||
                         pathname.startsWith("/career") ||
                         pathname.startsWith("/finance") ||
                         pathname.startsWith("/habits") ||
                         pathname.startsWith("/goals") ||
                         pathname.startsWith("/notes") ||
                         pathname.startsWith("/settings");

  if (isPrivateRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Arahkan pengguna terautentikasi ke /dashboard jika mencoba mengakses halaman login/register/reset/verify
  const isAuthRoute = pathname === "/login" ||
                      pathname === "/register" ||
                      pathname.startsWith("/forgot-password") ||
                      pathname.startsWith("/reset-password") ||
                      pathname.startsWith("/verify-email");

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Cocokkan semua jalur permintaan kecuali untuk yang dimulai dengan:
     * - api (rute API)
     * - _next/static (berkas statis)
     * - _next/image (optimasi gambar)
     * - favicon.ico, sitemap.xml, robots.txt, logo.png (metadata/aset)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|logo.png|itachi.gif).*)",
  ],
};
