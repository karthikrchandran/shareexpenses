# 🚀 ShareExpenses - Quick Start Guide

## What You Just Created

You now have a complete **expense-sharing web app** with:
- ✅ User authentication (signup/login)
- ✅ Expense tracking with flexible splits
- ✅ Automatic settlement calculations
- ✅ Payment status tracking for cash, Venmo, Cash App, or another outside app
- ✅ Modern, responsive UI

## 5-Minute Quick Start

### 1. **Wait for Dependencies**
Dependencies are installing... This should complete shortly.

### 2. **Get Your Supabase Keys** (2 min)
1. Go to https://supabase.com
2. Create a new project (free tier)
3. Go to **Settings > API**
4. Copy your keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 3. **Set Up Environment Variables** (1 min)
Edit `.env.local` and paste your Supabase keys:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. **Create Database Tables** (1 min)
1. In Supabase, go to **SQL Editor**
2. Create a new query
3. Paste the SQL from **SETUP.md** > "SETUP.sql"
4. Click Run

### 5. **Start the App** (1 min)
```bash
npm run dev
```
Visit http://localhost:3200

## Project Files Overview

| File | Purpose |
|------|---------|
| `README.md` | Full documentation |
| `SETUP.md` | Detailed setup instructions |
| `FEATURES.md` | Current & planned features |
| `.env.local` | Your Supabase credentials (SECRET!) |
| `app/` | App pages and API routes |
| `components/` | React components |
| `lib/` | Utilities, hooks, API clients |

## Key Features Explained

### 🔐 Authentication
- Secure signup/login via Supabase
- Email/password based
- Session management

### 💰 Expense Tracking
- Add expenses with who paid and amount
- Specify who the expense applies to
- Automatic even-split calculations

### 🧮 Smart Math
- Calculates who owes whom
- Simplifies settlements to minimize transfers
- Shows balances per person

### 💳 Payment Handoff
- Record settlements made outside ShareExpenses
- Mark settlements as pending, paid, or confirmed
- Track cash, Venmo, Cash App, or another outside app

## Common Tasks

### To Start Development
```bash
npm run dev  # Opens http://localhost:3200
```

### To Build for Production
```bash
npm run build
npm start
```

### To Deploy to Vercel
1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy!

## Testing Locally

### Create Test Users
1. Sign up: alice@test.com / test123
2. Sign up: bob@test.com / test123
3. Log in as Alice
4. Add expense "Dinner $100" with Bob
5. Log in as Bob
6. See settlement: Bob owes Alice $50

## Project Structure

```
shareexpenses/
├── app/                    # Next.js pages & API
│   ├── (auth)/            # Login/Signup pages
│   ├── dashboard/         # Main app
│   ├── api/               # Backend endpoints
│   └── page.tsx           # Home page
├── lib/                   # Utilities
│   ├── supabase.ts       # Database client
│   └── utils.ts          # Calculations
├── components/           # React components
└── public/              # Static files
```

## Important Notes

⚠️ **Never commit `.env.local`** - It contains your secret keys!

✅ **Use `.env.example`** - Copy this to `.env.local` and fill in your keys

✅ **Vercel deployment** - Automatically handles most of the setup

## Next Steps

1. ✅ Complete setup (follow steps above)
2. 📖 Read `SETUP.md` for detailed instructions
3. 🎯 Check `FEATURES.md` for what's coming
4. 🚀 Deploy to Vercel when ready

## Need Help?

- 📖 Check **SETUP.md** for troubleshooting
- 📚 [Supabase Docs](https://supabase.com/docs)
- 📚 [Next.js Docs](https://nextjs.org/docs)
- 💬 Open GitHub issues for bugs

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 + React + TypeScript |
| Styling | Tailwind CSS 3 |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Icons | Lucide React |
| Deployment | Vercel |
| Payments | Outside-app settlement tracking |

## Checklist

- [ ] npm install completed
- [ ] Supabase account created
- [ ] API keys in `.env.local`
- [ ] Database tables created
- [ ] `npm run dev` works
- [ ] Can sign up at http://localhost:3200/signup
- [ ] Can login at http://localhost:3200/login
- [ ] Can add expenses on dashboard

---

**Ready to use!** 🎉 Start the dev server and begin tracking expenses.
