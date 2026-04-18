import { useEffect, useState } from 'react';
import { Plus, Target, Trash2, TrendingUp } from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { useAppStore } from '../store';
import { Goal } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';

const defaultFormState = {
  name: '',
  targetAmount: '',
  currentAmount: '',
  targetDate: '',
};

export function Goals() {
  const { goals, setGoals } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState(defaultFormState);

  useEffect(() => {
    void loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setPageError('');
      const nextGoals = await api.getGoals();
      setGoals(nextGoals);
    } catch (err: any) {
      setPageError(err.message || 'Non sono riuscito a caricare gli obiettivi.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingGoal(null);
    setFormError('');
    setFormData(defaultFormState);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!editingGoal && !formData.name.trim()) {
      setFormError('Inserisci il nome dell obiettivo.');
      return;
    }

    if (!editingGoal && (!formData.targetAmount || Number(formData.targetAmount) <= 0)) {
      setFormError('Inserisci un target valido maggiore di zero.');
      return;
    }

    if (editingGoal && Number(formData.currentAmount || '0') < 0) {
      setFormError('L importo attuale non puo essere negativo.');
      return;
    }

    try {
      setSaving(true);

      if (editingGoal) {
        await api.updateGoal(editingGoal.id, {
          currentAmount: Math.round(parseFloat(formData.currentAmount || '0') * 100),
        });
      } else {
        await api.createGoal({
          name: formData.name.trim(),
          targetAmount: Math.round(parseFloat(formData.targetAmount) * 100),
          currentAmount: Math.round(parseFloat(formData.currentAmount || '0') * 100),
          targetDate: formData.targetDate || undefined,
        });
      }

      await loadGoals();
      setSuccessMessage(editingGoal ? 'Obiettivo aggiornato correttamente.' : 'Obiettivo creato correttamente.');
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Non sono riuscito a salvare l obiettivo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo obiettivo?')) {
      return;
    }

    try {
      setSuccessMessage('');
      await api.deleteGoal(id);
      await loadGoals();
      setSuccessMessage('Obiettivo eliminato.');
    } catch (err: any) {
      setPageError(err.message || 'Non sono riuscito a eliminare l obiettivo.');
    }
  };

  const handleQuickAdd = async (goal: Goal, amount: number) => {
    try {
      setSuccessMessage('');
      await api.updateGoal(goal.id, { currentAmount: goal.current_amount + amount * 100 });
      await loadGoals();
      setSuccessMessage(`Hai aggiunto ${formatCurrency(amount * 100)} all obiettivo "${goal.name}".`);
    } catch (err: any) {
      setPageError(err.message || 'Non sono riuscito ad aggiornare l obiettivo.');
    }
  };

  const startEditProgress = (goal: Goal) => {
    setSuccessMessage('');
    setPageError('');
    setFormError('');
    setEditingGoal(goal);
    setShowForm(true);
    setFormData({
      name: goal.name,
      targetAmount: (goal.target_amount / 100).toString(),
      currentAmount: (goal.current_amount / 100).toString(),
      targetDate: goal.target_date || '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Obiettivi</h1>
          <p className="text-sm text-muted-foreground">Tieni traccia dei tuoi traguardi con una vista più semplice e un aggiornamento rapido dei progressi.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setSuccessMessage('');
            setPageError('');
            setEditingGoal(null);
            setFormData(defaultFormState);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuovo obiettivo
        </Button>
      </div>

      {pageError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          {pageError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          {successMessage}
        </div>
      )}

      {showForm && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{editingGoal ? 'Aggiorna progresso obiettivo' : 'Nuovo obiettivo'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Nome obiettivo</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Es. Fondo emergenza"
                    required={!editingGoal}
                    disabled={Boolean(editingGoal)}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Importo target (EUR)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    required={!editingGoal}
                    disabled={Boolean(editingGoal)}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Importo attuale (EUR)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    placeholder="0"
                    className="h-11"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Data target</label>
                  <Input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    disabled={Boolean(editingGoal)}
                    className="h-11"
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                  {formError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Salvataggio...' : editingGoal ? 'Aggiorna' : 'Salva'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            Sto caricando gli obiettivi...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => {
            const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
            const percentage = Math.min(progress, 1) * 100;
            const remaining = Math.max(goal.target_amount - goal.current_amount, 0);
            const daysToTarget = goal.target_date
              ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <Card key={goal.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg text-foreground">{goal.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {goal.target_date ? `Target ${new Date(goal.target_date).toLocaleDateString('it-IT')}` : 'Nessuna scadenza'}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => void handleDelete(goal.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium text-foreground">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${Math.max(6, percentage)}%` }} />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Attuale</span>
                      <span className="font-medium text-foreground">{formatCurrency(goal.current_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-medium text-foreground">{formatCurrency(goal.target_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mancano</span>
                      <span className="font-medium text-primary">{formatCurrency(remaining)}</span>
                    </div>
                  </div>

                  {daysToTarget !== null && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3" />
                      {daysToTarget > 0 ? `${daysToTarget} giorni al target` : 'Target raggiunto o scaduto'}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t dark:border-border">
                    {[10, 25, 50, 100].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => void handleQuickAdd(goal, amount)}
                      >
                        +EUR {amount}
                      </Button>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => startEditProgress(goal)}>
                      Modifica
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {goals.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="pt-6 text-center text-muted-foreground text-sm">
                Nessun obiettivo configurato. Creane uno per iniziare a pianificare il risparmio.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
