import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/ui/header";

export const metadata: Metadata = {
  title: "Trajectory EU - See How Small Differences Become Big Futures",
  description: "Compare historical trends and project economic trajectories for Europe vs global peers. Understand how small differences in growth compound to different outcomes.",
  keywords: ["EU economics", "economic projections", "growth trajectories", "policy analysis"],
  authors: [{ name: "Trajectory EU" }],
  openGraph: {
    title: "Trajectory EU - Economic Growth Projections",
    description: "See how small differences in growth compound into big futures across Europe and global economies.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-background-primary text-text-primary antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main id="main-content" className="flex-1" role="main">
            {children}
          </main>
          <footer className="border-t border-border-light bg-background-secondary py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center text-sm text-text-tertiary">
                <p>Prototype • Illustrative projections based on constant rates</p>
                <p className="mt-1">Sources: World Bank, Eurostat</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
