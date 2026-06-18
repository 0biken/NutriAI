import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { Navigation } from "@/components/Navigation";
import { Logo } from "@/components/Logo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NutriAI — Built for Nigerian Bodies",
  description: "Nigeria's first clinical nutrition app. Cycle-aware meal plans, photo-based scanning, and a culturally fluent AI nutritionist.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased pb-20 bg-warm-white`}>
        <ClerkProvider>
          <header className="bg-forest bg-adire-grid border-b border-vitality/10">
            <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
              <Logo size="sm" theme="dark" withTagline />
              <div className="flex items-center gap-2">
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button className="h-9 px-4 rounded-full text-sm font-medium text-warm-white hover:bg-warm-white/10 transition-brand">
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="h-9 px-4 rounded-full text-sm font-semibold bg-vitality text-forest hover:bg-vitality-d transition-brand">
                      Get started
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9 ring-2 ring-vitality/30",
                      },
                    }}
                  />
                </Show>
              </div>
            </div>
          </header>
          <main>{children}</main>
          <Navigation />
          <Analytics />
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}
