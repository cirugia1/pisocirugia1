import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cirugia 1 Piso - Sistema de Ficha Clínica Quirúrgica",
  description: "Sistema integral de gestión clínica para servicios quirúrgicos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} min-h-full bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
