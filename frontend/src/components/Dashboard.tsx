import { useEffect } from 'react';
import {
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
        <div className="text-muted-foreground">Sto preparando la dashboard...</div>
      </div>
    );
  }

  const incomeChange = calculatePercentageChange(summary.monthlyIncome, summary.prevMonthlyIncome);
  const expenseChange = calculatePercentageChange(summary.monthlyExpenses, summary.prevMonthlyExpenses);
  const primaryAdvice = advice.items[0];

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-border bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_32%),linear-gradient(135deg,rgba(2,6,23,0.96),rgba(15,23,42,0.94))] p-6 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/70">
              <Gauge className="h-3.5 w-3.5" />
              Control room
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Ciao {user?.email.split('@')[0]}, qui vedi solo quello che conta davvero.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/72 md:text-base">
              Ho ripulito la dashboard in blocchi piu raccolti: numeri chiave, consiglio AI, stato operativo e budget sotto controllo.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.22em] text-white/60">Health score</div>
              <div className="mt-2 text-3xl font-semibold">{insights.healthScore}/100</div>
              <div className="mt-1 text-sm text-white/70">
                {insights.healthScore >= 75 ? 'Situazione solida' : insights.healthScore >= 50 ? 'Buona base, da rifinire' : 'Serve una correzione rapida'}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.22em] text-white/60">Prossima mossa</div>
              <div className="mt-2 text-base font-semibold">{advice.nextBestAction}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Periodo di lettura</h2>
          <p className="text-sm text-muted-foreground">Scegli il mese da analizzare senza appesantire la vista.</p>
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
          helper="Liquidita disponibile"
          tone="primary"
        />
        <MetricCard
          icon={TrendingUp}
          label="Entrate del mese"
          value={formatCurrency(summary.monthlyIncome)}
          helper={`${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(1)}% vs mese precedente`}
          tone="success"
        />
        <MetricCard
          icon={TrendingDown}
          label="Uscite del mese"
          value={formatCurrency(summary.monthlyExpenses)}
          helper={`${expenseChange >= 0 ? '+' : ''}${expenseChange.toFixed(1)}% vs mese precedente`}
          tone="danger"
        />
        <MetricCard
          icon={PiggyBank}
          label="Risparmio netto"
          value={formatCurrency(summary.monthlySavings)}
          helper={`Saving rate ${(summary.savingsRate * 100).toFixed(1)}%`}
          tone={summary.monthlySavings >= 0 ? 'success' : 'danger'}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>AI coach</CardTitle>
              <p className="text-sm text-muted-foreground">Un consiglio principale e pochi suggerimenti davvero utili.</p>
            </div>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <BrainCircuit className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sintesi del mese</div>
              <div className="mt-2 text-base font-medium text-foreground">{advice.overview}</div>
            </div>

            {primaryAdvice && (
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-foreground">{primaryAdvice.title}</div>
                  <PriorityBadge priority={primaryAdvice.priority} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{primaryAdvice.summary}</p>
                <div className="mt-3 rounded-xl bg-muted/40 px-3 py-2 text-sm text-foreground">
                  {primaryAdvice.action}
                </div>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              {advice.items.slice(1, 3).map((item) => (
                <div key={item.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-foreground">{item.title}</div>
                    <PriorityBadge priority={item.priority} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Stato operativo</CardTitle>
            <p className="text-sm text-muted-foreground">Le poche metriche che servono per orientarti subito.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <CompactStat
              icon={CalendarRange}
              label="Spesa media giornaliera"
              value={formatCurrency(Math.round(insights.averageDailySpend))}
            />
            <CompactStat
              icon={ArrowUpRight}
              label="Progressione obiettivi"
              value={`${Math.round(insights.averageGoalProgress * 100)}%`}
            />
            <CompactStat
              icon={Gauge}
              label="Runway stimato"
              value={insights.runwayDays ? `${insights.runwayDays} giorni` : 'n/a'}
            />
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">Categoria piu pesante</div>
              {insights.topExpenseCategory ? (
                <div className="mt-3 flex items-start gap-3">
                  <span
                    className="mt-1 h-3 w-3 rounded-full"
                    style={{ backgroundColor: insights.topExpenseCategory.color }}
                  />
                  <div>
                    <div className="font-medium text-foreground">{insights.topExpenseCategory.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(insights.topExpenseCategory.total)} • {(insights.topExpenseCategory.share * 100).toFixed(1)}% delle uscite
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-muted-foreground">Nessuna categoria dominante nel periodo selezionato.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Trend ultimi 6 mesi</CardTitle>
            <p className="text-sm text-muted-foreground">Un grafico compatto per capire il ritmo senza riempire la pagina.</p>
          </CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <div className="flex h-[240px] items-center justify-center text-muted-foreground">
                Nessun dato disponibile.
              </div>
            ) : (
              <>
                <div className="flex h-[240px] items-end justify-between gap-2">
                  {trend.map((point) => {
                    const maxValue = Math.max(...trend.map((item) => Math.max(item.income, item.expenses) || 1));
                    return (
                      <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-[190px] w-full items-end justify-center gap-1">
                          <div
                            className="w-full rounded-t-md bg-emerald-500"
                            style={{ height: `${Math.max(8, (point.income / maxValue) * 100)}%` }}
                            title={`Entrate ${formatCurrency(point.income)}`}
                          />
                          <div
                            className="w-full rounded-t-md bg-rose-500"
                            style={{ height: `${Math.max(8, (point.expenses / maxValue) * 100)}%` }}
                            title={`Uscite ${formatCurrency(point.expenses)}`}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{point.month}</span>
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
            <CardTitle>Budget sotto controllo</CardTitle>
            <p className="text-sm text-muted-foreground">Solo gli alert essenziali, senza rumore visivo.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.budgetAlerts.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                Nessun budget in tensione. Il mese e sotto controllo.
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
                      className={cn('h-full rounded-full', alert.progress >= 1 ? 'bg-rose-500' : 'bg-amber-500')}
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

function CompactStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-background p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  return (
    <div
      className={cn(
        'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
        priority === 'high' && 'bg-rose-500/10 text-rose-500',
        priority === 'medium' && 'bg-amber-500/10 text-amber-500',
        priority === 'low' && 'bg-emerald-500/10 text-emerald-500'
      )}
    >
      {priority}
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
