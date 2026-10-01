import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Shell } from "@/components/shell";
import { RunsProvider } from "@/lib/runs-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AfterMerge",
    template: "%s",
  },
  description:
    "Agentic DevSecOps console for the life after a merge. Simulated GitLab CI for Northline Mechanical's FieldClear.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <RunsProvider>
          <Shell>{children}</Shell>
        </RunsProvider>
      </body>
    </html>
  );
}
