import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Registre des cotisations',
  description: 'Suivi des cotisations par année et par membre',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
