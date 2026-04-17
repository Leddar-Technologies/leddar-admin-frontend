import "@/styles/globals.css";
import { useEffect, useState } from "react";
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
    <Provider store={store}>
      {/* If client is not ready, show loader, otherwise show the page */}
      {isClientReady ? <Component {...pageProps} /> : <AppBootstrapLoader />}
    </Provider>
  );
}
