import type { Metadata } from "next";
import AppSidebar from "./AppSidebar";
import StoreProvider from "@/lib/features/StoreProvider";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import QueryProvider from "./QueryProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import "../globals.css";

// export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Eventory",
  description: "Youtube subscribers dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get("firebase_token")?.value);

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`antialiased`}>
        <ThemeProvider
          attribute={"class"}
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <SidebarProvider>
              <StoreProvider isLoggedIn={isLoggedIn}>
                <AppSidebar />
                <main className="w-screen">
                  <div className="p-2">
                    <SidebarTrigger className=""/>
                  </div>
                  {children}
                </main>
                <Toaster />
              </StoreProvider>
            </SidebarProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
