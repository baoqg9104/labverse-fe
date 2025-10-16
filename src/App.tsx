import { useState } from "react";
import { AuthProvider } from "./contexts/AuthProvider";
import { AppRoutes } from "./routes/AppRoutes";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import ChatWidget from "./components/chat/ChatWidget";
import DailyLoginRewardOverlay from "./components/DailyLoginRewardOverlay";
import { useContext } from "react";
import { AuthContext } from "./contexts/AuthContext";

async function loadPreline() {
  return import("preline/dist/index.js");
}

function AppContent() {
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);
  const { dailyReward, dismissDailyReward, user, isAuthLoading } =
    useContext(AuthContext);

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
    <>
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
        {!isAuthLoading && user && user.role !== 2 && <ChatWidget />}
      </div>
      <DailyLoginRewardOverlay
        visible={Boolean(dailyReward?.visible)}
        points={dailyReward?.points ?? 0}
        message={dailyReward?.message}
        onClose={dismissDailyReward}
      />
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
