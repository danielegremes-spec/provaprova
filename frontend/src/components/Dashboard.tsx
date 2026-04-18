import { useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  CalendarRange,
  Gauge,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { api } from '../lib/api';
import { calculatePercentageChange, cn, formatCurrency } from '../lib/utils';
import { useAppStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Select } from './ui/Select';

const monthOptions = [
  { value: '1', label: 'Gennaio' },
  { value: '2', label: 'Febbraio' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Aprile' },
  { value: '5', label: 'Maggio' },
  { value: '6', label: 'Giugno' },
  { value: '7', label: 'Luglio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Settembre' },
  { value: '10', label: 'Ottobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Dicembre' },
];

const yearOptions = Array.from({ length: 4 }, (_, index) => {
  const year = new Date().getFullYear() - 1 + index;
  return { value: String(year), label: String(year) };
});

export function Dashboard() {
  const {
    summary,
    insights,
    advice,
    trend,
    user,
    workspace,
    selectedMonth,
    selectedYear,
    setSummary,
    setInsights,
    setAdvice,
    setTrend,
    setSelectedMonth,
    setSelectedYear,
  } = useAppStore();

  useEffect(() => {
    api.getSummary(selectedMonth, selectedYear).then(setSummary).catch(console.error);
    api.getInsights(selectedMonth, selectedYear).then(setInsights).catch(console.error);
    api.getAdvice(selectedMonth, selectedYear).then(setAdvice).catch(console.error);
    api.getTrend().then(setTrend).catch(console.error);
  }, [selectedMonth, selectedYear, setAdvice, setInsights, setSummary, setTrend]);

  if (!summary || !insights || !advice) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Caricamento dashboard strategica...</div>
      </div>
    );
  }

  const incomeChange = calculatePercentageChange(summary.monthlyIncome, summary.prevMonthlyIncome);
  const expenseChange = calculatePercentageChange(summary.monthlyExpenses, summary.prevMonthlyExpenses);
  const healthTone =
    insights.healthScore >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
    insights.healthScore >= 50 ? 'text-amber-600 dark:text-amber-400' :
    'text-rose-600 dark:text-rose-400';

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-border bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] p-6 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white/75">
              <Gauge className="h-3.5 w-3.5" />
              Finance OS
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Ciao {user?.email.split('@')[0]}, ecco il polso reale del tuo business personale.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/72 md:text-base">
              Ora hai anche un AI Financial Coach che interpreta il mese e ti suggerisce la prossima mossa migliore.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-white/60">Health score</div>
              <div className="mt-2 text-3xl font-semibold">{insights.healthScore}/100</div>
              <div className="mt-1 text-sm text-white/70">
                {insights.healthScore >= 75 ? 'Struttura solida e scalabile' : insights.healthScore >= 50 ? 'Buona base, margine da migliorare' : 'Serve una correzione nel breve'}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-white/60">Workspace</div>
              <div className="mt-2 text-3xl font-semibold">{workspace?.transactionCount || 0}</div>
              <div className="mt-1 text-sm text-white/70">
                movimenti tracciati, piano {workspace?.plan || 'starter'}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Periodo di analisi</h2>
          <p className="text-sm text-muted-foreground">Filtra la cabina di controllo sul mese che vuoi leggere meglio.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="w-full sm:w-44">
            <Select
              value={String(selectedMonth)}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
              options={monthOptions}
            />
          </div>
          <div className="w-full sm:w-32">
            <Select
              value={String(selectedYear)}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              options={yearOptions}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Wallet}
          label="Saldo totale"
          value={formatCurrency(summary.totalBalance)}
          tone="primary"
          helper="Liquidita disponibile su tutti i conti"
        />
        <MetricCard
          icon={TrendingUp}
          label="Entrate del mese"
          value={formatCurrency(summary.monthlyIncome)}
          tone="success"
          helper={`${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(1)}% vs mese precedente`}
        />
        <MetricCard
          icon={TrendingDown}
          label="Uscite del mese"
          value={formatCurrency(summary.monthlyExpenses)}
          tone="danger"
          helper={`${expenseChange >= 0 ? '+' : ''}${expenseChange.toFixed(1)}% vs mese precedente`}
        />
        <MetricCard
          icon={PiggyBank}
          label="Risparmio netto"
          value={formatCurrency(summary.monthlySavings)}
          tone={summary.monthlySavings >= 0 ? 'success' : 'danger'}
          helper={`Saving rate ${(summary.savingsRate * 100).toFixed(1)}%`}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>AI Financial Coach</CardTitle>
              <p className="text-sm text-muted-foreground">Consigli prioritizzati sui tuoi dati per il mese selezionato.</p>
            </div>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <BrainCircuit className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sintesi</div>
              <div className="mt-2 text-base font-medium text-foreground">{advice.overview}</div>
              <div className="mt-3 text-sm text-muted-foreground">
                Prossima mossa consigliata: <span className="font-medium text-foreground">{advice.nextBestAction}</span>
              </div>
            </div>

            <div className="grid gap-3">
              {advice.items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-foreground">{item.title}</div>
                    <div className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
                      item.priority === 'high' && 'bg-rose-500/10 text-rose-500',
                      item.priority === 'medium' && 'bg-amber-500/10 text-amber-500',
                      item.priority === 'low' && 'bg-emerald-500/10 text-emerald-500'
                    )}>
                      {item.priority}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                  <div className="mt-3 rounded-xl bg-muted/40 px-3 py-2 text-sm text-foreground">
                    {item.action}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    confidenza {(item.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Momentum finanziario</CardTitle>
              <p className="text-sm text-muted-foreground">Misure moderne per capire se il sistema sta reggendo bene.</p>
            </div>
            <div className={cn('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]', healthTone, 'bg-muted')}>
              score {insights.healthScore}
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            <InsightStat
              icon={CalendarRange}
              label="Spesa media giornaliera"
              value={formatCurrency(Math.round(insights.averageDailySpend))}
            />
            <InsightStat
              icon={Activity}
              label="Runway stimato"
              value={insights.runwayDays ? `${insights.runwayDays} giorni` : 'n/a'}
            />
            <InsightStat
              icon={ArrowUpRight}
              label="Progressione obiettivi"
              value={`${Math.round(insights.averageGoalProgress * 100)}%`}
            />
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Insight principale</CardTitle>
            <p className="text-sm text-muted-foreground">Il punto dove hai piu margine o piu rischio adesso.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.topExpenseCategory ? (
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <div className="text-sm text-muted-foreground">Categoria piu pesante</div>
                <div className="mt-2 flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: insights.topExpenseCategory.color }}
                  />
                  <div>
                    <div className="font-semibold text-foreground">{insights.topExpenseCategory.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(insights.topExpenseCategory.total)} • {(insights.topExpenseCategory.share * 100).toFixed(1)}% delle uscite
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                Nessuna categoria dominante nel periodo selezionato.
              </div>
            )}

            <div className="space-y-2">
              {insights.smartActions.map((action) => (
                <div key={action} className="rounded-2xl border border-border bg-background p-3 text-sm text-foreground">
                  {action}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Andamento ultimi 6 mesi</CardTitle>
            <p className="text-sm text-muted-foreground">Trend compatto per capire se il ritmo sta migliorando o no.</p>
          </CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Nessun dato disponibile
              </div>
            ) : (
              <>
                <div className="flex h-[300px] items-end justify-between gap-2">
                  {trend.map((data) => {
                    const maxValue = Math.max(...trend.map((item) => Math.max(item.income, item.expenses) || 1));
                    return (
                      <div key={data.month} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-[250px] w-full items-end justify-center gap-1">
                          <div
                            className="w-full rounded-t-md bg-emerald-500 transition-all hover:opacity-80"
                            style={{ height: `${Math.max(10, (data.income / maxValue) * 100)}%` }}
                            title={`Entrate ${formatCurrency(data.income)}`}
                          />
                          <div
                            className="w-full rounded-t-md bg-rose-500 transition-all hover:opacity-80"
                            style={{ height: `${Math.max(10, (data.expenses / maxValue) * 100)}%` }}
                            title={`Uscite ${formatCurrency(data.expenses)}`}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{data.month}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-center gap-6">
                  <Legend color="bg-emerald-500" label="Entrate" />
                  <Legend color="bg-rose-500" label="Uscite" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Alert budget</CardTitle>
            <p className="text-sm text-muted-foreground">Segnali precoci per non perdere margine a fine mese.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.budgetAlerts.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                Nessun budget in tensione: il mese e sotto controllo.
              </div>
            ) : (
              insights.budgetAlerts.map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        {alert.categoryName}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {formatCurrency(alert.spent)} su {formatCurrency(alert.budgeted)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {(alert.progress * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        alert.progress >= 1 ? 'bg-rose-500' : 'bg-amber-500'
                      )}
                      style={{ width: `${Math.min(alert.progress * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  helper: string;
  tone: 'primary' | 'success' | 'danger';
}) {
  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div
          className={cn(
            'rounded-full p-2',
            tone === 'primary' && 'bg-sky-500/12 text-sky-600 dark:text-sky-300',
            tone === 'success' && 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
            tone === 'danger' && 'bg-rose-500/12 text-rose-600 dark:text-rose-300'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function InsightStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn('h-3 w-3 rounded-full', color)} />
      <span className="text-sm text-foreground">{label}</span>
    </div>
  );
}
