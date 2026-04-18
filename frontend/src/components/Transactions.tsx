import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Transaction } from '../types';

export function Transactions() {
  const { transactions, setTransactions, categories, setCategories } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    description: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
  });

  useEffect(() => {
    api.getTransactions().then(setTransactions).catch(console.error);
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateTransaction(editingId, {
          amount: parseFloat(formData.amount) * 100,
          type: formData.type,
          description: formData.description,
          date: formData.date,
          categoryId: formData.categoryId || undefined,
        });
      } else {
        await api.createTransaction({
          amount: parseFloat(formData.amount) * 100,
          type: formData.type,
          description: formData.description,
          date: formData.date,
          categoryId: formData.categoryId || undefined,
        });
      }
      api.getTransactions().then(setTransactions);
      setShowForm(false);
      setEditingId(null);
      setFormData({ amount: '', type: 'expense', description: '', date: new Date().toISOString().split('T')[0], categoryId: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (t: Transaction) => {
    setFormData({
      amount: (t.amount / 100).toString(),
      type: t.type,
      description: t.description || '',
      date: t.date,
      categoryId: t.category_id || '',
    });
    setEditingId(t.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Eliminare questa transazione?')) {
      await api.deleteTransaction(id);
      api.getTransactions().then(setTransactions);
    }
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Transazioni</h1>
        <Button variant="primary" onClick={() => { setShowForm(true); setEditingId(null); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuova
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{editingId ? 'Modifica Transazione' : 'Nuova Transazione'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Tipo</label>
                  <Select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
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
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Data</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Categoria</label>
                  <Select
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    options={[
                      { value: '', label: 'Nessuna' },
                      ...(formData.type === 'income' ? incomeCategories : expenseCategories).map(c => ({
                        value: c.id,
                        label: c.name,
                      })),
                    ]}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" variant="primary">{editingId ? 'Aggiorna' : 'Salva'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annulla</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-md overflow-hidden">
        <CardContent className="p-0">
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
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-sm text-foreground">{formatDate(t.date)}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{t.description || '-'}</td>
                    <td className="py-3 px-4">
                      {t.category_name && (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.category_color }} />
                          <span className="text-foreground">{t.category_name}</span>
                        </span>
                      )}
                    </td>
                    <td className={`text-right py-3 px-4 font-semibold text-sm ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="text-right py-3 px-4">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(t)} className="text-foreground">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
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
        </CardContent>
      </Card>
    </div>
  );
}
