import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'
import type { NextFetchEvent } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/',
  '/onboarding(.*)',
  '/plan(.*)',
  '/tracker(.*)',
  '/chat(.*)',
])

const clerk = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export function proxy(request: NextRequest, event: NextFetchEvent) {
  return clerk(request, event)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for Clerk's auto-proxy path
    '/__clerk/:path*',
    '/(api|trpc)(.*)',
  ],
}
