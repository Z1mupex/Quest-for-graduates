import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Unbounded } from "next/font/google";
import "./globals.css";
import { AppChrome } from "@/components/AppChrome";
import { Providers } from "@/components/providers";
import { getServerSession } from "@/lib/auth";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
  weight: ["700", "800", "900"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Квест 2025",
  description: "Выпускной квест и скавендж-хант",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${unbounded.variable} ${jetbrains.variable} ${manrope.variable} flex min-h-full flex-col bg-background font-sans antialiased`}
      >
        <Providers>
          <AppChrome session={session}>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
