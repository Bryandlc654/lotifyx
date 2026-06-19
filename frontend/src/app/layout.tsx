import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/layout/session-provider";
import { CartProvider } from "@/lib/cart-context";
import { CartButton } from "@/components/layout/cart-button";
import { CartSidebar } from "@/components/layout/cart-sidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lotifyx",
  description: "Impulsa tu negocio con Lotifyx — facturación, gestión y crecimiento.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProvider>
          <CartProvider>
            {children}
            <CartButton />
            <CartSidebar />
          </CartProvider>
        </SessionProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 5000,
          }}
        />
      </body>
    </html>
  );
}
