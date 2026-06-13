import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err: unknown) {
      // Backend now returns { error: "Invalid credentials" } on 401. Surface it
      // verbatim if present, fall back to the localized generic message.
      const status = (err as { response?: { status?: number; data?: { error?: string } } })?.response?.status;
      const apiMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (status === 401 && apiMessage) {
        setError(apiMessage);
      } else {
        setError(t('admin.login.invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-card border border-border p-10 space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl tracking-[0.3em] text-primary">
            ESTORIA
          </h1>
          <p className="text-sm tracking-widest uppercase text-muted-foreground">
            {t('admin.login.portalTitle')}
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <Label className="text-foreground text-xs tracking-wider uppercase">{t('admin.login.emailLabel')}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 bg-background border-input text-foreground"
              autoFocus
            />
          </div>

          <div>
            <Label className="text-foreground text-xs tracking-wider uppercase">{t('admin.login.passwordLabel')}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 bg-background border-input text-foreground"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wider uppercase"
          >
            {loading ? t('admin.login.signingIn') : t('admin.login.signIn')}
          </Button>
        </div>
      </form>
    </div>
  );
}
