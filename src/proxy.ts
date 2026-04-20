import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/bootstrap' ||
    pathname.startsWith('/auth/')

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirect = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirect.cookies.set(c.name, c.value)
    })
    return redirect
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    const redirect = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirect.cookies.set(c.name, c.value)
    })
    return redirect
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
