import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Rotas que precisam de autenticação
  const protectedRoutes = ['/home', '/minhas-rendex', '/indicacoes', '/catalogo', '/profile'];
  
  const { pathname } = request.nextUrl;
  
  // Verificar se a rota atual é protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Verificar sessão do usuário
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Redirecionar para login com redirect
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/home', '/minhas-rendex', '/indicacoes', '/catalogo', '/profile'],
};
