import { useMemo, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { api } from '../lib/api';
import { useAppStore } from '../store';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';

interface AuthProps {
  onSuccess: () => void;
}

export function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAppStore((state) => state.setAuth);
  const setWorkspace = useAppStore((state) => state.setWorkspace);

  const passwordStrength = useMemo(() => {
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;

    if (checks <= 1) return { label: 'Debole', tone: 'bg-rose-500', width: '25%' };
    if (checks === 2) return { label: 'Media', tone: 'bg-amber-500', width: '50%' };
    if (checks === 3) return { label: 'Buona', tone: 'bg-sky-500', width: '75%' };
    return { label: 'Ottima', tone: 'bg-emerald-500', width: '100%' };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin && password !== confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    if (!isLogin && password.length < 8) {
      setError('Usa almeno 8 caratteri per una password piu sicura');
      return;
    }

    setLoading(true);

    try {
      const result = isLogin
        ? await api.login(email, password)
        : await api.register(email, password);

      localStorage.setItem('token', result.token);
      setAuth(result.token, result.user);

      const profile = await api.me();
      setAuth(result.token, profile.user);
      setWorkspace(profile.workspace);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Errore durante l operazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.15),_transparent_25%)] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden rounded-[32px] border border-border/60 bg-card/70 p-8 shadow-xl backdrop-blur lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            SaaS-ready finance workspace
          </div>
          <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-tight text-foreground">
            MoneyFlow trasforma i numeri sparsi in decisioni.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
            Budget, obiettivi, trend e alert intelligenti in un unico cockpit pensato per diventare una vera piattaforma.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <BenefitCard
              icon={ShieldCheck}
              title="Accesso piu sicuro"
              body="Validazioni migliori, sessione persistente e UX piu chiara per login e registrazione."
            />
            <BenefitCard
              icon={LockKeyhole}
              title="Dashboard strategica"
              body="Health score, burn rate, insight e priorita operative invece di semplici numeri."
            />
          </div>
        </section>

        <Card className="mx-auto w-full max-w-xl overflow-hidden border-border/70 shadow-2xl">
          <CardHeader className="border-b border-border/70 bg-muted/30 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Wallet className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl">MoneyFlow</CardTitle>
            <p className="text-sm text-muted-foreground">
              {isLogin ? 'Accedi al tuo workspace finanziario' : 'Crea il tuo spazio e inizia a monitorare tutto'}
            </p>
          </CardHeader>

          <CardContent className="space-y-5 pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tuo@email.com"
                  required
                  className="h-12"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  placeholder="Inserisci la password"
                  shown={showPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                />
                {!isLogin && (
                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Robustezza password</span>
                      <span>{passwordStrength.label}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className={`h-full rounded-full ${passwordStrength.tone}`} style={{ width: passwordStrength.width }} />
                    </div>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Conferma password</label>
                  <PasswordField
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Ripeti la password"
                    shown={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((value) => !value)}
                  />
                </div>
              )}

              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-950/60 dark:bg-rose-950/30 dark:text-rose-300">
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" className="h-12 w-full text-base" disabled={loading}>
                {loading ? 'Sto entrando nel workspace...' : isLogin ? 'Accedi' : 'Crea account'}
              </Button>
            </form>

            <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              {isLogin
                ? 'Sessione pronta per dashboard, insight e monitoraggio obiettivi in tempo reale.'
                : 'Registrandoti attivi subito dashboard strategica, alert budget e suggerimenti intelligenti.'}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setConfirmPassword('');
                }}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {isLogin ? 'Non hai ancora un account? Registrati' : 'Hai gia un account? Accedi'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  placeholder,
  shown,
  onToggle,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input
        type={shown ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        className="h-12 pr-12"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors hover:text-foreground"
        aria-label={shown ? 'Nascondi password' : 'Mostra password'}
      >
        {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/80 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}
