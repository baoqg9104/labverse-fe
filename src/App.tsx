import { useState } from "react";
import { AuthProvider } from "./contexts/AuthProvider";
import { AppRoutes } from "./routes/AppRoutes";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";

async function loadPreline() {
  return import("preline/dist/index.js");
}

function App() {
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const initPreline = async () => {
      await loadPreline();
      if (
        window.HSStaticMethods &&
        typeof window.HSStaticMethods.autoInit === "function"
      ) {
        window.HSStaticMethods.autoInit();
      }
    };
    initPreline();
  }, [location.pathname]);

  // Hide splash after animation
  const handleSplashFinish = () => setShowSplash(false);

  return (
    <AuthProvider>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <div
        className="flex flex-col min-h-screen"
        style={{
          background: "linear-gradient(120deg, #141e30 60%, #42275a 140%)",
        }}
      >
        <Navbar />
        <main className="flex-grow">
          <AppRoutes />
        </main>
      </div>
      <Footer />
    </AuthProvider>
  );
}

export default App;
