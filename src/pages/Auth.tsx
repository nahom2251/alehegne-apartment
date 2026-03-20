import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 🔥 NEW
  const [rememberMe, setRememberMe] = useState(true);
  const [showReset, setShowReset] = useState(false);

  const { signIn, signUp, resetPassword } = useAuth();
  const { t } = useLanguage();

  // 🔐 LOGIN / REGISTER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password, rememberMe);

        if (error) toast.error(error.message);
        else toast.success("Welcome back!");
      } else {
        if (!fullName.trim()) {
          toast.error("Please enter your full name");
          return;
        }

        const { error } = await signUp(email, password, fullName);

        if (error) toast.error(error.message);
        else toast.success("Account created! Check your email.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 🔁 RESET PASSWORD
  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }

    const { error } = await resetPassword(email);

    if (error) toast.error(error.message);
    else toast.success("Password reset email sent!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 gold-gradient flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>

            <CardTitle>{t("app.short")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("app.name")}
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* FULL NAME (REGISTER ONLY) */}
              {!isLogin && (
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("auth.fullName")}
                  required
                />
              )}

              {/* EMAIL */}
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.email")}
                required
              />

              {/* PASSWORD */}
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.password")}
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* 🔥 REMEMBER ME */}
              {isLogin && (
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </div>
              )}

              {/* SUBMIT */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full gold-gradient text-white"
              >
                {submitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isLogin ? t("auth.loginBtn") : t("auth.registerBtn")}
              </Button>
            </form>

            {/* 🔥 FORGOT PASSWORD */}
            {isLogin && (
              <div className="mt-3 text-center">
                <button
                  onClick={handleResetPassword}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* SWITCH */}
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline"
              >
                {isLogin ? t("auth.noAccount") : t("auth.hasAccount")}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="text-center py-3 text-xs border-t">
        {t("app.powered")}
      </footer>
    </div>
  );
};

export default Auth;