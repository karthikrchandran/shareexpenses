# ShareExpenses - Expense Sharing App

A modern app where friends can easily track shared expenses and record payments made through cash, Venmo, Cash App, or another outside app.

## Features

- **Trip Categories** - Pick VRBO/Airbnb, food, groceries, fuel, or miscellaneous for each expense
- **AI Trip Closeout** - Generate a saved member-only closeout with totals, insights, flags, and copy-ready settlement text
- **Friend Join Links** - Copy a trip link so friends can sign in and join the Expense Set
- **Trip Ledger Details** - Capture expense dates and notes for cleaner trip review
- **Payment Status** - Track pending, paid, and confirmed settlement records
- **Activity Feed** - Show recent Expense Set changes for accountability

✅ **User Authentication** - Sign up and login with email/password via Supabase  
✅ **Add Expenses** - Log expenses with flexible descriptions and amounts  
✅ **Expense Sets** - Organize expenses by trip, event, month, or household
✅ **Smart Splits** - Even splits or custom split amounts  
✅ **Settlement Tracking** - Automatic calculation of who owes whom  
✅ **Payment Handoff** - Record cash, Venmo, Cash App, or other outside-app settlements
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

### 5. Run Development Server

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
│   │   └── settlements/   # Settlement endpoints
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── lib/                   # Utilities & clients
│   ├── supabase.ts       # Supabase client
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
5. Select a category:
   - **VRBO / Airbnb**: Trip lodging and rental costs
   - **Food**: Restaurants, takeout, snacks, and shared meals
   - **Groceries**: Grocery runs and shared supplies
   - **Fuel**: Gas, charging, tolls, parking, and driving costs
   - **Miscellaneous**: Everything else
6. Select split type:
   - **Even**: Everyone pays equal share
   - **Custom**: Define specific amounts per person
   - **Shares**: Split by proportional shares
7. Select which Expense Set members are included
8. Click "Add Expense"

Use **Expense Date** for the day the cost happened and **Notes** for context such as who benefited, what the payment covered, or follow-up details.

### Inviting Friends

1. Open the selected Expense Set
2. Click "Members"
3. Create and copy the friend join link
4. Send the link to friends
5. Friends sign up or log in, then they are added to the Expense Set automatically

### Activity History

The dashboard shows recent Expense Set activity: expenses, member joins, settlements, and closeout generation. This gives the group a lightweight audit trail during the trip.

### AI Trip Closeout

1. Select an Expense Set with expenses
2. Click "Generate Closeout"
3. Review category totals, biggest expenses, settlement rows, insights, and review flags
4. Copy the group message or open the member-only closeout page

If `OPENAI_API_KEY` is configured, the app uses OpenAI to polish the narrative copy. Financial totals are always calculated locally first.

### Settlement Tracking

The app automatically calculates:
- Who paid what
- Who owes whom
- Settlement amounts
- Settled outside-app payments

View settlements in the right sidebar of the dashboard. Paid and confirmed payments reduce balances. Pending payments stay visible without closing the balance.

### Settle Up

1. From the settlements list, click "Settle Up"
2. Choose the payment status: pending, paid, or confirmed
3. Choose "Cash / outside app", Venmo, or Cash App
4. The settlement is recorded and shown in Payment Status

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

### Payment status not updating

- Confirm you selected a payment status before recording the settlement
- Check that the current user is a member of the selected Expense Set
- Review the `/api/settlements` response in the browser console

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
