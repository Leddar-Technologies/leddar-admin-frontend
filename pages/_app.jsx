import '@/styles/globals.css';
import { useEffect, useState } from 'react';

function AppBootstrapLoader() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '0.75rem',
        backgroundColor: '#FAF7F4',
        color: '#1A1A1A',
        fontFamily: 'Manrope, system-ui, sans-serif',
      }}
    >
      <span
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '9999px',
          border: '3px solid rgba(107, 58, 42, 0.2)',
          borderTopColor: '#6B3A2A',
          animation: 'app-loader-spin 0.8s linear infinite',
        }}
      />
      <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Loading dashboard...</p>
      <style jsx global>{`
        @keyframes app-loader-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function App({ Component, pageProps }) {
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  if (!isClientReady) {
    return <AppBootstrapLoader />;
  }

  return <Component {...pageProps} />;
}
