import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "SViam | AI-Powered Hiring for India",
  description:
    "Where India's best talent meets the companies that need them. AI interviews and instant job matching. One platform, both sides of the table.",
  metadataBase: new URL("https://sviam.in"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "SViam | AI-Powered Hiring for India",
    description:
      "AI job matching, resume building, and interview prep. One platform for candidates and companies.",
    url: "https://sviam.in",
    siteName: "SViam",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SViam | AI-Powered Hiring for India",
    description:
      "AI job matching, resume building, and interview prep. One platform for candidates and companies.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('sviam-theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-bg">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
