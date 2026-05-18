import "@/styles/globals.css";
import { useEffect, useState } from "react";
import Head from "next/head";

import { Provider } from "react-redux";
import { store } from "../store";

function AppBootstrapLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "0.75rem",
        backgroundColor: "#FAF7F4",
      }}
    >
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6B3A2A]"></div>
      <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>
        Loading dashboard...
      </p>
    </div>
  );
}

export default function App({ Component, pageProps }) {
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    // This MUST run to clear the loading screen
    setIsClientReady(true);
  }, []);

  return (
    <>
      <Head>
        <title>Leddar Admin</title>
        <link rel="icon" type="image/jpeg" href="/favicon.jpeg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Provider store={store}>
        {/* If client is not ready, show loader, otherwise show the page */}
        {isClientReady ? <Component {...pageProps} /> : <AppBootstrapLoader />}
      </Provider>
    </>
  );
}
