import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const lower = pathname.toLowerCase();

  if (pathname !== lower && !pathname.startsWith("/_next")) {
    const url = request.nextUrl.clone();
    url.pathname = lower;
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/product/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace("/product/", "/products/");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|brand|images).*)"],
};
