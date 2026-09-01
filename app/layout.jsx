import './globals.css';

export const metadata = {
  title: 'Registre des cotisations',
  description: 'Suivi des cotisations par année et par membre',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
