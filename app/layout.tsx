// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'Healtbite App',
  description: 'Web-приложение с постами и ИИ-помощником',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}