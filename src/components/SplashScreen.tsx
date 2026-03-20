import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1500);
    const exitTimer = setTimeout(() => onComplete(), 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="w-24 h-24 rounded-2xl bg-yellow-500 flex items-center justify-center shadow-lg">
          <Building2 className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-2xl font-bold">
          Alehegne Sewnet Apartment
        </h1>

        <p className="text-xl font-semibold text-yellow-600">
          AS Apt.
        </p>

        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
};

export default SplashScreen;