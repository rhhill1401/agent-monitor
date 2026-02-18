export const metadata = {
  title: 'Agent Monitor',
  description: 'Real-time agent status dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>{children}</body>
    </html>
  );
}
