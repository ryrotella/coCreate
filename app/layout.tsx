import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { StreamProvider } from "@/contexts/StreamContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bubble Network",
  description: "A collaborative social neural network in 3D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <StreamProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </StreamProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
