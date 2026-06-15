# ShareExpenses Setup Guide

## Step-by-Step Setup Instructions

### Phase 1: Initial Setup (5 minutes)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Supabase project**
   - Go to https://supabase.com
   - Click "New Project"
   - Choose a name and password
   - Select a region close to you
   - Wait for it to initialize

### Phase 2: Get Your API Keys (2 minutes)

1. In Supabase dashboard, go to **Settings > API**
2. Find these keys:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `Anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `Service role secret` → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

3. Copy them to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

4. Optional AI Trip Closeout settings:
   ```
   OPENAI_API_KEY=sk-...
   OPENAI_CLOSEOUT_MODEL=gpt-5.5
   ```

   If `OPENAI_API_KEY` is not configured, Trip Closeout still works with deterministic local insights and group-message text.

### Phase 3: Create Database Tables (3 minutes)

1. In Supabase, go to **SQL Editor**
2. Click "New Query"
3. Paste the complete SQL schema from `SETUP.sql` (see below)
4. Click "Run"

#### SETUP.sql - Complete Database Schema

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  venmo_handle TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create groups table. The app labels these as Expense Sets.
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  join_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create group members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

-- Create expenses table. Every expense must belong to an Expense Set.
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL DEFAULT 'miscellaneous'
    CHECK (category IN ('lodging', 'food', 'groceries', 'fuel', 'miscellaneous')),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  paid_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create expense splits table
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  percentage DECIMAL(5, 2),
  is_itemized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(expense_id, user_id)
);

-- Create settlements table
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  settled BOOLEAN DEFAULT FALSE,
  settled_at TIMESTAMP,
  payment_method TEXT NOT NULL DEFAULT 'outside-app',
  payment_status TEXT NOT NULL DEFAULT 'paid'
    CHECK (payment_status IN ('pending', 'paid', 'confirmed')),
  venmo_transaction_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create saved AI Trip Closeouts table
CREATE TABLE IF NOT EXISTS expense_set_closeouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary_json JSONB NOT NULL,
  ai_model TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_set_closeouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS helper functions for Expense Set membership
CREATE OR REPLACE FUNCTION public.is_group_member(target_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = target_group_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_member_user(
  target_group_id uuid,
  target_user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = target_group_id
      AND user_id = target_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_expense_group_member(target_expense_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.expenses
    WHERE id = target_expense_id
      AND public.is_group_member(group_id)
  );
$$;

-- RLS Policies for Expense Sets
CREATE POLICY "Members can read Expense Sets" ON groups
  FOR SELECT USING (public.is_group_member(id));

CREATE POLICY "Authenticated users can create Expense Sets" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies for Expense Set members
CREATE POLICY "Members can read Expense Set members" ON group_members
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "Members can add registered users to Expense Sets" ON group_members
  FOR INSERT WITH CHECK (
    public.is_group_member(group_id)
    OR EXISTS (
      SELECT 1
      FROM public.groups
      WHERE id = group_id
        AND created_by = auth.uid()
    )
  );

-- RLS Policies for expenses
CREATE POLICY "Members can read Expense Set expenses" ON expenses
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "Members can insert Expense Set expenses" ON expenses
  FOR INSERT WITH CHECK (
    auth.uid() = paid_by_user_id
    AND public.is_group_member(group_id)
  );

CREATE POLICY "Payers can update their Expense Set expenses" ON expenses
  FOR UPDATE USING (
    auth.uid() = paid_by_user_id
    AND public.is_group_member(group_id)
  );

CREATE POLICY "Payers can delete their Expense Set expenses" ON expenses
  FOR DELETE USING (
    auth.uid() = paid_by_user_id
    AND public.is_group_member(group_id)
  );

-- RLS Policies for expense_splits
CREATE POLICY "Members can read Expense Set splits" ON expense_splits
  FOR SELECT USING (public.is_expense_group_member(expense_id));

CREATE POLICY "Members can insert Expense Set splits" ON expense_splits
  FOR INSERT WITH CHECK (
    public.is_expense_group_member(expense_id)
    AND EXISTS (
      SELECT 1
      FROM public.expenses
      WHERE id = expense_id
        AND public.is_group_member_user(group_id, user_id)
    )
  );

-- RLS Policies for settlements
CREATE POLICY "Members can read Expense Set settlements" ON settlements
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "Settlement parties can insert Expense Set settlements" ON settlements
  FOR INSERT WITH CHECK (
    public.is_group_member(group_id)
    AND public.is_group_member_user(group_id, from_user_id)
    AND public.is_group_member_user(group_id, to_user_id)
    AND auth.uid() IN (from_user_id, to_user_id)
  );

-- RLS Policies for AI Trip Closeouts
CREATE POLICY "Members can read Expense Set closeouts" ON expense_set_closeouts
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "Members can create Expense Set closeouts" ON expense_set_closeouts
  FOR INSERT WITH CHECK (
    auth.uid() = generated_by
    AND public.is_group_member(group_id)
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_join_token ON groups(join_token) WHERE join_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_category ON expenses(group_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_group_date ON expenses(group_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by_user_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user ON expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_group ON settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from_user ON settlements(from_user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_to_user ON settlements(to_user_id);
CREATE INDEX IF NOT EXISTS idx_closeouts_group_created ON expense_set_closeouts(group_id, created_at DESC);
```

#### Existing Project Upgrade SQL

If your Supabase project already has the Phase 1 Expense Set tables, run this before testing categories:

```sql
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS join_token TEXT;

UPDATE groups
SET join_token = gen_random_uuid()::text
WHERE join_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_join_token
ON groups(join_token)
WHERE join_token IS NOT NULL;

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'miscellaneous';

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS expense_date DATE NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE expenses
DROP CONSTRAINT IF EXISTS expenses_category_check;

ALTER TABLE expenses
ADD CONSTRAINT expenses_category_check
CHECK (category IN ('lodging', 'food', 'groceries', 'fuel', 'miscellaneous'));

CREATE INDEX IF NOT EXISTS idx_expenses_group_category ON expenses(group_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_group_date ON expenses(group_id, expense_date DESC);

ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'outside-app';

ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'paid';

ALTER TABLE settlements
DROP CONSTRAINT IF EXISTS settlements_payment_status_check;

ALTER TABLE settlements
ADD CONSTRAINT settlements_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'confirmed'));

CREATE INDEX IF NOT EXISTS idx_settlements_group ON settlements(group_id);

CREATE TABLE IF NOT EXISTS expense_set_closeouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary_json JSONB NOT NULL,
  ai_model TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE expense_set_closeouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read Expense Set closeouts" ON expense_set_closeouts;
CREATE POLICY "Members can read Expense Set closeouts" ON expense_set_closeouts
  FOR SELECT USING (public.is_group_member(group_id));

DROP POLICY IF EXISTS "Members can create Expense Set closeouts" ON expense_set_closeouts;
CREATE POLICY "Members can create Expense Set closeouts" ON expense_set_closeouts
  FOR INSERT WITH CHECK (
    auth.uid() = generated_by
    AND public.is_group_member(group_id)
  );

CREATE INDEX IF NOT EXISTS idx_closeouts_group_created ON expense_set_closeouts(group_id, created_at DESC);
```

### Phase 4: Setup Auth Trigger (2 minutes)

In Supabase, create a function to auto-create user profile on signup:

1. Go to **SQL Editor**
2. Create a new query:

```sql
-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, new.user_metadata->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### Phase 5: Run the App (1 minute)

```bash
npm run dev
```

Visit http://localhost:3200 in your browser!

### Phase 6: Test It Out (2 minutes)

1. **Create two test accounts:**
   - Email: alice@test.com / Password: test123
   - Email: bob@test.com / Password: test123

2. **As Alice:**
   - Create an Expense Set named "Dinner Test"
   - Add Bob as a member
   - Add expense "Dinner" for $100 with category "Food", split with Bob
   - Add expense "VRBO deposit" with category "VRBO / Airbnb" and split type "Shares Split" if the lodging split is ratio-based

3. **As Bob:**
   - See the "Dinner Test" Expense Set
   - See the expense and settlement inside that set

4. **Settlement:**
   - Bob owes Alice $50

## Vercel Deployment (Optional)

### Prerequisites
- GitHub account
- Vercel account (free)

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
  git remote add origin https://github.com/YOUR_USERNAME/shareexpenses
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Select your GitHub repo
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `VENMO_ACCESS_TOKEN` (if using)
   - Click Deploy!

3. **Your app is live!** 🎉

## Venmo Integration Setup (Optional)

### Get Venmo Credentials

1. Go to https://developer.venmo.com
2. Register for API access
3. Create an app
4. Get your credentials:
   - App ID
   - Client Secret
   - Access Token (user's token)

5. Add to `.env.local`:
   ```
   VENMO_APP_ID=your_app_id
   VENMO_CLIENT_SECRET=your_secret
   VENMO_ACCESS_TOKEN=your_access_token
   ```

### Note on Venmo Integration

The current implementation is a template. For production:
- Implement OAuth 2.0 flow for user authentication
- Store encrypted tokens in database
- Use Venmo's official SDK
- Implement proper error handling

## Troubleshooting

### Q: "Invalid API Key" error
**A:** Check you've copied the keys correctly from Supabase. Make sure `NEXT_PUBLIC_SUPABASE_URL` starts with `https://` and has `.supabase.co` domain.

### Q: Tables don't exist error
**A:** Run the SQL schema from Phase 3. Make sure to paste the entire SQL block and click "Run".

### Q: Can't sign up
**A:** 
- Check email is valid
- Password must be at least 6 characters
- Check Supabase Auth is enabled (it should be by default)

### Q: Expenses not showing
**A:**
- Make sure you're logged in
- Check RLS policies are created (Phase 3)
- Verify the expense was actually inserted in Supabase (check Tables > expenses)

### Q: Port 3200 already in use
**A:** 
```bash
# Use a different port
npm run dev -- -p 3201
```

## Next Steps

1. ✅ **Complete setup** - Follow steps above
2. 🎯 **Add more features** - Check FEATURES.md
3. 🚀 **Deploy to production** - Use Vercel
4. 🔧 **Customize** - Modify colors, text, functionality

## Need Help?

- 📖 [Next.js Docs](https://nextjs.org/docs)
- 📖 [Supabase Docs](https://supabase.com/docs)
- 📖 [Tailwind CSS Docs](https://tailwindcss.com/docs)
- 🆘 [GitHub Issues](https://github.com/your-repo/issues)

Good luck! 🚀
