
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider, useTheme } from '@/hooks/use-theme';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <html lang="en" className={theme} style={{ colorScheme: theme }}>
      <head>
        <title>Visual DS</title>
        <meta name="description" content="Visualize data structures and algorithms" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <AppLayout>{children}</AppLayout>
    </ThemeProvider>
  );
}
