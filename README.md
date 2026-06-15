# ShareExpenses - Expense Sharing App

A modern app where friends can easily track shared expenses and settle up using Venmo.

## Features

✅ **User Authentication** - Sign up and login with email/password via Supabase  
✅ **Add Expenses** - Log expenses with flexible descriptions and amounts  
✅ **Expense Sets** - Organize expenses by trip, event, month, or household
✅ **Smart Splits** - Even splits or custom split amounts  
✅ **Settlement Tracking** - Automatic calculation of who owes whom  
✅ **Venmo Integration** - Settle payments directly through Venmo  
✅ **Responsive Design** - Works on desktop, tablet, and mobile  

## Tech Stack

- **Frontend**: Next.js 14+ with React & TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React Icons
- **Hosting**: Vercel (recommended)

## Quick Start

### 1. Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase account (free tier available at https://supabase.com)
- (Optional) Venmo API credentials

### 2. Clone & Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### 3. Configure Supabase

1. Go to https://supabase.com and create a new project
2. In your project dashboard, go to **Settings > API**
3. Copy your:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (from Service role secret)

4. Paste them in `.env.local`

### 4. Create Database Tables

In Supabase, go to SQL Editor and run the complete schema from [SETUP.md](SETUP.md). The current schema creates membership-scoped Expense Sets, requires every expense to belong to one set, and includes RLS policies for set members.

### 5. (Optional) Configure Venmo Integration

1. Register for Venmo Developer API access at https://developer.venmo.com
2. Get your credentials: `VENMO_APP_ID`, `VENMO_CLIENT_SECRET`, `VENMO_ACCESS_TOKEN`
3. Add them to `.env.local`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3200](http://localhost:3200) to see the app!

## Project Structure

```
shareexpenses/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── dashboard/         # Main dashboard
│   ├── api/               # API routes
│   │   ├── expenses/      # Expense endpoints
│   │   └── venmo/         # Venmo integration
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── lib/                   # Utilities & clients
│   ├── supabase.ts       # Supabase client
│   ├── venmo.ts          # Venmo client
│   ├── types.ts          # TypeScript types
│   ├── utils.ts          # Helper functions
│   └── useAuth.ts        # Auth hook
├── components/           # React components
│   ├── AddExpenseModal.tsx
│   ├── ExpenseList.tsx
│   └── SettlementSummary.tsx
├── public/              # Static assets
├── .env.example         # Environment variables template
├── package.json         # Dependencies
└── README.md           # This file
```

## Features Explained

### Adding an Expense

1. Create or select an Expense Set
2. Click "Add Expense" button
3. Enter description (e.g., "Dinner at Joe's")
4. Enter amount
5. Select split type:
   - **Even**: Everyone pays equal share
   - **Custom**: Define specific amounts per person
   - **Shares**: Split by proportional shares
6. Select which Expense Set members are included
7. Click "Add Expense"

### Settlement Tracking

The app automatically calculates:
- Who paid what
- Who owes whom
- Settlement amounts

View settlements in the right sidebar of the dashboard.

### Venmo Payment

1. From settlements list, click "Pay with Venmo"
2. Choose payment method
3. Confirm payment
4. Settlement marked as complete

## Future Features

- 🎯 Expense Set invites and member management
- 📊 Expense analytics
- 💳 Multiple payment methods
- 🔔 Notifications
- 📱 Mobile app
- 💬 In-app messaging
- 📤 Export reports

## Deployment

### Deploy to Vercel (Recommended)

```bash
# Push to GitHub first
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main

# Then deploy on Vercel
```

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repo
4. Add environment variables from `.env.local`
5. Deploy!

### Environment Variables for Production

Make sure to add these in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VENMO_ACCESS_TOKEN` (if using Venmo)
- `NEXT_PUBLIC_APP_URL` (your production URL)

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Troubleshooting

### "Auth error" on login

- Check your Supabase URL and keys in `.env.local`
- Verify the user exists in Supabase Auth

### Expenses not showing

- Ensure tables are created in Supabase
- Check RLS policies are set up correctly
- Verify you're logged in

### Venmo integration not working

- Confirm Venmo API credentials are correct
- Check Venmo API status
- Review API response in browser console

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## License

MIT License - feel free to use this project for personal or commercial use.

## Support

For issues or questions:
- Check the troubleshooting section
- Review Supabase docs: https://supabase.com/docs
- Open an issue on GitHub

---

Built with ❤️ using Next.js & Supabase
