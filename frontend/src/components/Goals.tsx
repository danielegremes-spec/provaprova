import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { formatCurrency } from '../lib/utils';
import { Plus, Trash2, Target, TrendingUp } from 'lucide-react';
import { Goal } from '../types';

export function Goals() {
  const { goals, setGoals } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
  });

  useEffect(() => {
    api.getGoals().then(setGoals).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await api.updateGoal(editingGoal.id, {
          currentAmount: parseFloat(formData.currentAmount) * 100,
        });
      } else {
        await api.createGoal({
          name: formData.name,
          targetAmount: parseFloat(formData.targetAmount) * 100,
          currentAmount: parseFloat(formData.currentAmount || '0') * 100,
          targetDate: formData.targetDate || undefined,
        });
      }
      api.getGoals().then(setGoals);
      setShowForm(false);
      setEditingGoal(null);
      setFormData({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Eliminare questo obiettivo?')) {
      await api.deleteGoal(id);
      api.getGoals().then(setGoals);
    }
  };

  const handleAddAmount = async (goal: Goal, amount: number) => {
    await api.updateGoal(goal.id, { currentAmount: goal.current_amount + amount * 100 });
    api.getGoals().then(setGoals);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Obiettivi di Risparmio</h1>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Obiettivo
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{editingGoal ? 'Modifica Obiettivo' : 'Nuovo Obiettivo'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Nome Obiettivo</label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Es. Vacanze, Auto, Fondo Emergenza..."
                    required
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Importo Target (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.targetAmount}
                    onChange={e => setFormData({ ...formData, targetAmount: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Attuale (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.currentAmount}
                    onChange={e => setFormData({ ...formData, currentAmount: e.target.value })}
                    placeholder="0"
                    className="h-11"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Data Target (opzionale)</label>
                  <Input
                    type="date"
                    value={formData.targetDate}
                    onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" variant="primary">{editingGoal ? 'Aggiorna' : 'Salva'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annulla</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const percentage = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
          const remaining = goal.target_amount - goal.current_amount;
          const daysToTarget = goal.target_date
            ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <Card key={goal.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg text-foreground">{goal.name}</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(goal.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium text-foreground">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-muted dark:bg-muted/50 rounded-full overflow-hidden">
                    <div className="h-full bg-primary dark:bg-primary/80 transition-all" style={{ width: `${percentage}%` }} />
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Attuale</span>
                  <span className="font-medium text-foreground">{formatCurrency(goal.current_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target</span>
                  <span className="font-medium text-foreground">{formatCurrency(goal.target_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mancante</span>
                  <span className="font-medium text-primary">{formatCurrency(remaining)}</span>
                </div>

                {goal.target_date && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {daysToTarget !== null && daysToTarget > 0
                      ? `${daysToTarget} giorni al target`
                      : 'Target raggiunto o scaduto'}
                  </p>
                )}

                <div className="pt-3 border-t dark:border-border">
                  <p className="text-xs text-muted-foreground mb-2">Aggiungi rapidamente:</p>
                  <div className="flex gap-2 flex-wrap">
                    {[10, 25, 50, 100].map(amount => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddAmount(goal, amount)}
                        className="text-foreground"
                      >
                        +€{amount}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {goals.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center text-muted-foreground text-sm">
              Nessun obiettivo configurato. Creane uno per iniziare a risparmiare!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
