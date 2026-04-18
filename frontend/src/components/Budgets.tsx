import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { formatCurrency } from '../lib/utils';
import { Plus, Trash2, Target } from 'lucide-react';

export function Budgets() {
  const { budgets, setBudgets, categories, transactions, selectedMonth, selectedYear } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    api.getBudgets().then(setBudgets).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBudget({
        categoryId: formData.categoryId,
        amount: parseFloat(formData.amount) * 100,
        period: formData.period,
        startDate: formData.startDate,
      });
      api.getBudgets().then(setBudgets);
      setShowForm(false);
      setFormData({ categoryId: '', amount: '', period: 'monthly', startDate: new Date().toISOString().split('T')[0] });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Eliminare questo budget?')) {
      await api.deleteBudget(id);
      api.getBudgets().then(setBudgets);
    }
  };

  const getSpentForCategory = (categoryId: string) => {
    return transactions
      .filter(t => t.category_id === categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Budget</h1>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Budget
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Nuovo Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Categoria</label>
                  <Select
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    options={[
                      { value: '', label: 'Seleziona...' },
                      ...expenseCategories.map(c => ({ value: c.id, label: c.name })),
                    ]}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Importo (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Periodo</label>
                  <Select
                    value={formData.period}
                    onChange={e => setFormData({ ...formData, period: e.target.value })}
                    options={[
                      { value: 'monthly', label: 'Mensile' },
                      { value: 'weekly', label: 'Settimanale' },
                      { value: 'yearly', label: 'Annuale' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Data Inizio</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" variant="primary">Salva</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annulla</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {budgets.map((budget) => {
          const spent = getSpentForCategory(budget.category_id);
          const percentage = Math.min(100, (spent / budget.amount) * 100);
          const isOverBudget = spent > budget.amount;

          return (
            <Card key={budget.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5" style={{ color: budget.category_color }} />
                    <CardTitle className="text-lg text-foreground">{budget.category_name}</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(budget.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Speso</span>
                    <span className={isOverBudget ? 'text-red-600 dark:text-red-400 font-medium text-foreground' : 'text-foreground font-medium'}>
                      {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted dark:bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${isOverBudget ? 'bg-red-500 dark:bg-red-600' : 'bg-green-500 dark:bg-green-600'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className={`text-xs ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                    {isOverBudget
                      ? `Sforato di ${formatCurrency(spent - budget.amount)}`
                      : `${formatCurrency(budget.amount - spent)} rimanenti`}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {budgets.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center text-muted-foreground text-sm">
              Nessun budget configurato. Creane uno per iniziare a monitorare le spese!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
