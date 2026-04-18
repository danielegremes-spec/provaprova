import { useState } from 'react';
import { useAppStore } from '../store';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Wallet } from 'lucide-react';

interface AuthProps {
  onSuccess: () => void;
}

export function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAppStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isLogin
        ? await api.login(email, password)
        : await api.register(email, password);

      localStorage.setItem('token', result.token);
      setAuth(result.token, result.user);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'operazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-xl border-2">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">MoneyFlow</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">Gestisci le tue finanze in modo intelligente</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tua@email.com"
                required
                className="h-11"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Password</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
            )}

            <Button type="submit" variant="primary" className="w-full h-11 text-base" disabled={loading}>
              {loading ? 'Caricamento...' : isLogin ? 'Accedi' : 'Registrati'}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
