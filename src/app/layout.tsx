export const metadata = {
  title: 'BENQI Protocol Agent',
  description: 'BENQI Protocol Agent for Avalanche',
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
