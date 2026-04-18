import { useEffect, useState } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAppStore } from '../store';
import { Transaction } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

const defaultFormState = {
  amount: '',
  type: 'expense' as 'income' | 'expense',
  description: '',
  date: new Date().toISOString().split('T')[0],
  categoryId: '',
};

export function Transactions() {
  const { transactions, setTransactions, categories, setCategories } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState(defaultFormState);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError('');
      const [nextTransactions, nextCategories] = await Promise.all([
        api.getTransactions(),
        api.getCategories(),
      ]);

      setTransactions(nextTransactions);
      setCategories(nextCategories);
    } catch (err: any) {
      setPageError(err.message || 'Non sono riuscito a caricare le transazioni.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormError('');
    setFormData(defaultFormState);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!formData.amount || Number(formData.amount) <= 0) {
      setFormError('Inserisci un importo valido maggiore di zero.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        amount: Math.round(parseFloat(formData.amount) * 100),
        type: formData.type,
        description: formData.description.trim() || undefined,
        date: formData.date,
        categoryId: formData.categoryId || undefined,
      };

      if (editingId) {
        await api.updateTransaction(editingId, payload);
      } else {
        await api.createTransaction(payload);
      }

      await loadData();
      setSuccessMessage(editingId ? 'Transazione aggiornata correttamente.' : 'Transazione salvata correttamente.');
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Non sono riuscito a salvare la transazione.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setSuccessMessage('');
    setFormError('');
    setFormData({
      amount: (transaction.amount / 100).toString(),
      type: transaction.type,
      description: transaction.description || '',
      date: transaction.date,
      categoryId: transaction.category_id || '',
    });
    setEditingId(transaction.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa transazione?')) {
      return;
    }

    try {
      setSuccessMessage('');
      await api.deleteTransaction(id);
      await loadData();
      setSuccessMessage('Transazione eliminata.');
    } catch (err: any) {
      setPageError(err.message || 'Non sono riuscito a eliminare la transazione.');
    }
  };

  const incomeCategories = categories.filter((category) => category.type === 'income');
  const expenseCategories = categories.filter((category) => category.type === 'expense');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Transazioni</h1>
          <p className="text-sm text-muted-foreground">Salva entrate e uscite con un feedback chiaro, senza dubbi sul risultato.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setSuccessMessage('');
            setPageError('');
            setEditingId(null);
            setFormData(defaultFormState);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuova
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
            <CardTitle>{editingId ? 'Modifica transazione' : 'Nuova transazione'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Tipo</label>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense', categoryId: '' })}
                    options={[
                      { value: 'expense', label: 'Uscita' },
                      { value: 'income', label: 'Entrata' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Descrizione</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Es. Spesa supermercato"
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Data</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Categoria</label>
                  <Select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    options={[
                      { value: '', label: 'Nessuna' },
                      ...(formData.type === 'income' ? incomeCategories : expenseCategories).map((category) => ({
                        value: category.id,
                        label: category.name,
                      })),
                    ]}
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
                  {saving ? 'Salvataggio...' : editingId ? 'Aggiorna' : 'Salva'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-md overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Sto caricando le transazioni...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3.5 px-4 text-sm font-medium text-muted-foreground">Data</th>
                    <th className="text-left py-3.5 px-4 text-sm font-medium text-muted-foreground">Descrizione</th>
                    <th className="text-left py-3.5 px-4 text-sm font-medium text-muted-foreground">Categoria</th>
                    <th className="text-right py-3.5 px-4 text-sm font-medium text-muted-foreground">Importo</th>
                    <th className="text-right py-3.5 px-4 text-sm font-medium text-muted-foreground">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-sm text-foreground">{formatDate(transaction.date)}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{transaction.description || '-'}</td>
                      <td className="py-3 px-4">
                        {transaction.category_name ? (
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: transaction.category_color }} />
                            <span className="text-foreground">{transaction.category_name}</span>
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className={`text-right py-3 px-4 font-semibold text-sm ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(transaction)} className="text-foreground">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void handleDelete(transaction.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                        Nessuna transazione presente. Clicca su "Nuova" per aggiungerne una.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
