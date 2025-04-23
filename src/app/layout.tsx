export const metadata = {
  title: 'BENQI Protocol Agent',
  description: 'AI agent for BENQI DeFi protocols on Avalanche',
  icons: {
    icon: '/benqi-logo.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/benqi-logo.jpg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
