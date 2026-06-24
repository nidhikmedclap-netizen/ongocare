import Providers from "@/components/Providers";
import { siteFont } from "@/lib/typography/site-font";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});
export const metadata = {
  title: "GLP-1 Weight Loss Program",
  description: "Doctor-led GLP-1 weight loss plans built around you.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className={siteFont.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
