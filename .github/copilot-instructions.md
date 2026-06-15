# ShareExpenses Copilot Instructions

## Project Overview

ShareExpenses is a full-stack web application for tracking shared expenses and settling payments with friends. Built with Next.js 14+, React, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS 3+
- **UI Icons**: Lucide React
- **Hosting**: Vercel (recommended)
- **Payment**: Venmo API (optional)

## Project Structure

```
app/                      # Next.js App Router
├── (auth)/              # Auth group (login, signup)
├── dashboard/           # Main dashboard page
├── api/                 # API routes
├── layout.tsx           # Root layout
├── page.tsx             # Home landing page
└── globals.css          # Global styles

lib/                      # Utilities and clients
├── supabase.ts          # Supabase client instances
├── venmo.ts             # Venmo API client
├── types.ts             # TypeScript types/interfaces
├── utils.ts             # Helper functions (calculations, formatting)
└── useAuth.ts           # Custom React hook for authentication

components/              # Reusable React components
├── AddExpenseModal.tsx   # Modal for adding expenses
├── ExpenseList.tsx       # Display list of expenses
└── SettlementSummary.tsx # Show who owes whom

public/                  # Static assets
```

## Key Features

- **User Authentication**: Email/password signup and login via Supabase
- **Expense Tracking**: Add, view, and manage shared expenses
- **Split Calculations**: Automatic even split calculations (custom splits coming soon)
- **Settlement Tracking**: Auto-calculated settlements showing who owes whom
- **Venmo Integration**: Payment settlement via Venmo API (template implementation)
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## Important Conventions

### Database Tables
- `users`: User profiles (id, email, name, venmo_handle)
- `expenses`: Expense records (description, amount, paid_by_user_id)
- `expense_splits`: Individual splits per expense (amount per user)
- `settlements`: Simplified tracking of who owes whom
- `groups`: (Future) Group/trip expenses
- `group_members`: (Future) Group membership tracking

### File Naming
- React components: PascalCase (.tsx)
- API routes: kebab-case or descriptive folders
- Utilities/hooks: camelCase (.ts)
- Types: types.ts or domain-specific files

### Code Patterns
- Use TypeScript for type safety
- Use Tailwind CSS utility classes (no custom CSS unless necessary)
- Handle errors with user-friendly messages
- Use Supabase client for all DB operations
- Implement loading states for async operations

## Setup Instructions

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and add Supabase credentials
3. Create database tables using Supabase SQL (see SETUP.md)
4. Run dev server: `npm run dev`
5. Visit http://localhost:3200

See SETUP.md for detailed instructions.

## Development Workflow

1. Create feature branch: `git checkout -b feature/name`
2. Make changes in appropriate files
3. Test in development: `npm run dev`
4. Commit: `git commit -am "description"`
5. Push and create PR

## Environment Variables

Required (.env.local):
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (keep secret!)

Optional:
- `VENMO_ACCESS_TOKEN`: For Venmo payment integration
- `NEXT_PUBLIC_APP_URL`: App URL (default: http://localhost:3200)

## Common Tasks

### Adding a New Page
1. Create folder in `app/`
2. Add `page.tsx` component
3. Export default React component
4. Add navigation if needed

### Adding an API Endpoint
1. Create folder in `app/api/`
2. Create `route.ts` with export functions (GET, POST, etc.)
3. Use `createServiceRoleClient()` for server-side operations

### Adding a Component
1. Create `.tsx` file in `components/`
2. Make it a Client Component with `'use client'` if needed
3. Import and use in pages

### Adding a Database Query
1. Import `supabase` from `@/lib/supabase`
2. Use `.from('table_name').select()` or other operations
3. Add proper error handling

## Debugging

- **Auth Issues**: Check env vars and Supabase Auth settings
- **DB Errors**: Verify RLS policies and table structure
- **UI Issues**: Check browser console and network tab
- **Performance**: Use Next.js built-in profiling tools

## Testing

- Manual testing in dev server
- Test with multiple user accounts
- Verify calculations with sample data
- Test Venmo endpoints (requires credentials)

## Deployment

Use Vercel for seamless Next.js deployment:
1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy!

## Future Enhancements

- Group/trip expenses
- Custom split amounts
- Advanced analytics
- Mobile app (React Native)
- Multiple payment methods
- In-app notifications
- Receipt OCR scanning

## Performance Optimization

- Images: Use next/image for optimization
- Code splitting: Automatic with Next.js
- Database: Use indexes and RLS policies
- Caching: Leverage Next.js caching strategies

## Security Notes

- All auth handled by Supabase (no passwords stored locally)
- RLS policies enforce data access control
- API routes use service role key (server-side only)
- Environment variables: Never commit .env.local
- Input validation: Use Zod schemas (can be added)

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

## Contact & Support

- Check SETUP.md for troubleshooting
- See FEATURES.md for roadmap
- Open GitHub issues for bugs/features
- Review README.md for overview

---

Last Updated: June 2026
Status: Active Development ✅
