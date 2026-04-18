# MoneyFlow - Gestione Denaro Avanzata

Un'applicazione web moderna per la gestione delle finanze personali.

## Features

- **Dashboard** - Panoramica completa con saldo, entrate/uscite mensili e grafici
- **Transazioni** - CRUD completo con categorizzazione automatica
- **Budget** - Monitoraggio budget per categoria con alert visivi
- **Obiettivi** - Tracciamento obiettivi di risparmio con target date
- **Multi-valuta** - Supporto per valute multiple con conversione
- **Dark Mode** - Tema scuro per il comfort visivo
- **Responsive** - Funziona perfettamente su desktop e mobile

## Stack Tecnologico

### Frontend
- React 19 + TypeScript
- Vite (build tool ultra-veloce)
- Tailwind CSS + shadcn/ui (componenti)
- Zustand (state management)
- Recharts (grafici)
- Lucide React (icone)

### Backend
- Node.js + Express
- TypeScript
- Better-SQLite3 (database)
- JWT (autenticazione)
- bcrypt (password hashing)

## Installazione

### Prerequisiti
- Node.js 18+
- npm

### Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Il frontend sarà disponibile su `http://localhost:5173`

### Setup Backend

```bash
cd backend
npm install
npm run dev
```

Il backend sarà disponibile su `http://localhost:3001`

## Utilizzo

1. **Registrazione**: Crea un account con email e password
2. **Dashboard**: Visualizza il riepilogo finanziario
3. **Transazioni**: Aggiungi entrate e uscite con categorie
4. **Budget**: Imposta budget mensili per categoria
5. **Obiettivi**: Crea obiettivi di risparmio e monitora i progressi

## API Endpoints

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | /api/auth/register | Registrazione |
| POST | /api/auth/login | Login |
| GET | /api/transactions | Lista transazioni |
| POST | /api/transactions | Nuova transazione |
| PUT | /api/transactions/:id | Modifica transazione |
| DELETE | /api/transactions/:id | Elimina transazione |
| GET | /api/budgets | Lista budget |
| POST | /api/budgets | Nuovo budget |
| GET | /api/goals | Lista obiettivi |
| POST | /api/goals | Nuovo obiettivo |
| GET | /api/analytics/summary | Dashboard summary |
| GET | /api/analytics/trend | Trend 6 mesi |

## Struttura Progetto

```
provaprova/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Componenti base
│   │   │   ├── Auth.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Transactions.tsx
│   │   │   ├── Budgets.tsx
│   │   │   ├── Goals.tsx
│   │   │   └── Layout.tsx
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   ├── store/
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── App.tsx
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── transactions.ts
│   │   │   ├── budgets.ts
│   │   │   ├── goals.ts
│   │   │   └── analytics.ts
│   │   ├── db/
│   │   │   └── index.ts
│   │   └── server.ts
│   └── package.json
└── README.md
```

## Sicurezza

- Password hashate con bcrypt
- Token JWT con scadenza 7 giorni
- Validazione input lato server
- CORS configurato

## Sviluppo Futuro

- [ ] OCR per ricevute
- [ ] Importazione estratti conto (CSV, PDF)
- [ ] Notifiche email
- [ ] Export report PDF
- [ ] Budget condivisi (famiglia)
- [ ] Integrazione bancaria (PSD2)

## License

MIT
