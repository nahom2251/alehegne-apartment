import { Building2 } from "lucide-react";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  // instant exit (no delay blocking)
  setTimeout(onComplete, 500);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-yellow-500 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-bold">AS Apt</h1>
      </div>
    </div>
  );
};

export default SplashScreen;