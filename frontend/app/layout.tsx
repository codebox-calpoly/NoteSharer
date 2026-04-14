import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { AuthenticatedAppChrome } from "@/app/components/AuthenticatedAppChrome";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-moo",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Poly Pages",
  description: "Peer note sharing for the Cal Poly community.",
  icons: {
    icon: "https://c.animaapp.com/vYVdVbUl/img/container-8.svg",
    shortcut: "https://c.animaapp.com/vYVdVbUl/img/container-8.svg",
    apple: "https://c.animaapp.com/vYVdVbUl/img/container-8.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var k='poly-pages-theme';var t=localStorage.getItem(k);if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.setAttribute('data-theme','dark');else document.documentElement.setAttribute('data-theme','light');})();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthenticatedAppChrome />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
