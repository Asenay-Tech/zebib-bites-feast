import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/components/ui/language-switcher";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  // base login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // forgot/reset state
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // recovery mode (after clicking the email link)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  // detect recovery first (so we don't redirect away)
  useEffect(() => {
    const hash = window.location.hash || "";
    const recovery =
      /type=recovery/.test(hash) || searchParams.get("type") === "recovery";
    setIsRecoveryMode(recovery);
  }, [searchParams]);

  // only redirect if already logged in AND not recovering
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !isRecoveryMode) {
        const redirectTo = searchParams.get("redirect") || "/";
        navigate(redirectTo);
      }
    });
  }, [navigate, searchParams, isRecoveryMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      const redirectTo = searchParams.get("redirect") || "/";
      navigate(redirectTo);
    } catch (err: any) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const redirectTo = `${window.location.origin}/login`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || t("common.error"));
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetLoading(true);
    setResetSent(false);
    try {
      const redirectTo = `${window.location.origin}/login`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        resetEmail,
        { redirectTo }
      );
      if (resetError) throw resetError;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || t("common.error"));
    } finally {
      setResetLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) return setError(t("auth.passwordTooShort"));
    if (newPassword !== confirmNewPassword)
      return setError(t("auth.passwordMismatch"));

    setUpdateLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      window.location.hash = "";
      setIsRecoveryMode(false);
      const redirectTo = searchParams.get("redirect") || "/";
      navigate(redirectTo);
    } catch (err: any) {
      setError(err.message || t("common.error"));
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            {isRecoveryMode ? t("auth.resetPassword") : t("auth.login")}
          </CardTitle>
          <CardDescription className="text-center">
            {isRecoveryMode
              ? t("auth.resetPasswordDescription")
              : t("auth.loginDescription")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {/* Recovery screen: set a new password */}
          {isRecoveryMode ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("auth.newPassword")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder={t("auth.passwordPlaceholder")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">
                  {t("auth.confirmPassword")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={updateLoading}>
                {updateLoading ? t("common.loading") : t("auth.updatePassword")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.location.hash = "";
                  setIsRecoveryMode(false);
                }}
              >
                {t("auth.backToLogin")}
              </Button>
            </form>
          ) : (
            <>
              {/* Email/password login */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("auth.emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.passwordPlaceholder")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgot((s) => !s)}
                      className="text-sm text-accent hover:underline"
                    >
                      {t("auth.forgotPassword")}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("common.loading") : t("auth.login")}
                </Button>
              </form>

              {/* Divider + Google */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px bg-border flex-1" />
                <span className="text-xs text-muted-foreground">{t("auth.or")}</span>
                <div className="h-px bg-border flex-1" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 mr-2">
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.9h5.5c-.2 1.2-1.6 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.6 2.6 14.5 1.8 12 1.8 6.9 1.8 2.8 5.9 2.8 11s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1-.1-1.5H12z"
                  />
                </svg>
                {t("auth.continueWithGoogle")}
              </Button>

              {/* Forgot-password block */}
              {showForgot && (
                <div className="mt-6 border-t pt-6 space-y-3">
                  {resetSent ? (
                    <div className="text-sm rounded-md p-3 bg-green-500/10 text-green-600">
                      {t("auth.resetLinkSent")}
                    </div>
                  ) : (
                    <>
                      <Label htmlFor="resetEmail">{t("auth.resetPasswordHelp")}</Label>
                      <div className="flex gap-2">
                        <Input
                          id="resetEmail"
                          type="email"
                          placeholder={t("auth.emailPlaceholder")}
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={handleSendResetEmail}
                          disabled={resetLoading || !resetEmail}
                        >
                          {resetLoading ? t("common.loading") : t("auth.sendResetLink")}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>

        {!isRecoveryMode && (
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="text-accent hover:underline">
                {t("auth.register")}
              </Link>
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              {t("auth.backToHome")}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default Login;
