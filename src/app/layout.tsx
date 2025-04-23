export const metadata = {
  title: 'BENQI Protocol Agent',
  description: 'AI agent for BENQI DeFi protocols on Avalanche',
  icons: {
    icon: '/benqi.svg',
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
        <link rel="icon" href="/benqi.svg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
