import type { Metadata } from "next";
import { AuthSessionHandler } from "@/components/auth/auth-session-handler";
import { NotificationSseHandler } from "@/components/notifications/notification-sse-handler";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "歧路",
  description: "歧路第一版产品外壳",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <AuthSessionHandler />
          <NotificationSseHandler />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
