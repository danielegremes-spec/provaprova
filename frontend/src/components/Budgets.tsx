import { useEffect, useMemo, useState } from 'react';
import { Plus, Target, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { useAppStore } from '../store';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

const defaultFormState = {
  categoryId: '',
  amount: '',
  period: 'monthly',
  startDate: new Date().toISOString().split('T')[0],
};

export function Budgets() {
  const { budgets, setBudgets, categories, setCategories, transactions, setTransactions, selectedMonth, selectedYear } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState(defaultFormState);

  useEffect(() => {
    void loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError('');
      const [nextBudgets, nextCategories, nextTransactions] = await Promise.all([
        api.getBudgets(),
        api.getCategories(),
        api.getTransactions(selectedMonth, selectedYear, 'expense'),
      ]);

      setBudgets(nextBudgets);
      setCategories(nextCategories);
      setTransactions(nextTransactions);
    } catch (err: any) {
      setPageError(err.message || 'Non sono riuscito a caricare i budget.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setFormError('');
    setFormData(defaultFormState);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!formData.categoryId) {
      setFormError('Seleziona una categoria per il budget.');
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setFormError('Inserisci un importo valido maggiore di zero.');
      return;
    }

    try {
      setSaving(true);
      await api.createBudget({
        categoryId: formData.categoryId,
        amount: Math.round(parseFloat(formData.amount) * 100),
        period: formData.period,
        startDate: formData.startDate,
      });
      await loadData();
      setSuccessMessage('Budget salvato correttamente.');
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Non sono riuscito a salvare il budget.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo budget?')) {
      return;
    }

    try {
      setSuccessMessage('');
      await api.deleteBudget(id);
      await loadData();
      setSuccessMessage('Budget eliminato.');
    } catch (err: any) {
      setPageError(err.message || 'Non sono riuscito a eliminare il budget.');
    }
  };

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === 'expense'),
    [categories]
  );

  const getSpentForCategory = (categoryId: string) =>
    transactions
      .filter((transaction) => transaction.category_id === categoryId && transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Budget</h1>
          <p className="text-sm text-muted-foreground">Una schermata compatta per creare limiti di spesa e vedere subito se stai sforando.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setSuccessMessage('');
            setPageError('');
            setFormError('');
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuovo budget
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
            <CardTitle>Nuovo budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Categoria</label>
                  <Select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    options={[
                      { value: '', label: 'Seleziona...' },
                      ...expenseCategories.map((category) => ({ value: category.id, label: category.name })),
                    ]}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Importo (EUR)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Periodo</label>
                  <Select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    options={[
                      { value: 'monthly', label: 'Mensile' },
                      { value: 'weekly', label: 'Settimanale' },
                      { value: 'yearly', label: 'Annuale' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Data inizio</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
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
                  {saving ? 'Salvataggio...' : 'Salva'}
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
            Sto caricando i budget...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((budget) => {
            const spent = getSpentForCategory(budget.category_id);
            const progress = budget.amount > 0 ? spent / budget.amount : 0;
            const cappedProgress = Math.min(progress, 1);
            const isOverBudget = spent > budget.amount;

            return (
              <Card key={budget.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5" style={{ color: budget.category_color }} />
                      <div>
                        <CardTitle className="text-lg text-foreground">{budget.category_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">Periodo {budget.period}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => void handleDelete(budget.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Speso nel periodo</span>
                    <span className={isOverBudget ? 'font-medium text-rose-600 dark:text-rose-300' : 'font-medium text-foreground'}>
                      {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={isOverBudget ? 'h-full bg-rose-500' : 'h-full bg-emerald-500'}
                      style={{ width: `${Math.max(8, cappedProgress * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stato</span>
                    <span className={isOverBudget ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300'}>
                      {isOverBudget
                        ? `Sforato di ${formatCurrency(spent - budget.amount)}`
                        : `${formatCurrency(budget.amount - spent)} rimanenti`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {budgets.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="pt-6 text-center text-muted-foreground text-sm">
                Nessun budget configurato. Creane uno per iniziare a monitorare le spese.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
