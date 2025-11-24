# Next.js & Supabase Realtime Chat App

This is an open-source, real-time chat application built with Next.js, Supabase, and Prisma. It's designed to be a solid foundation for anyone looking to build a feature-rich chat application with a modern tech stack.

## Features

-   Real-time messaging
-   User authentication (Supabase Auth)
-   Conversation creation and management
-   Message reactions
-   Typing indicators
-   Unread message badges
-   Image uploads
-   Emoji picker
-   Theme toggle (dark/light mode)
-   User profiles and avatars

## Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/)
-   **Database:** [Supabase](https://supabase.io/) (Postgres)
-   **ORM:** [Prisma](https://www.prisma.io/)
-   **Authentication:** [Supabase Auth](https://supabase.io/docs/guides/auth)
-   **Real-time:** [Supabase Realtime](https://supabase.io/docs/guides/realtime)
-   **UI:** [shadcn/ui](https://ui.shadcn.com/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Linting:** [ESLint](https://eslint.org/)
-   **Formatting:** [Prettier](https://prettier.io/)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/sawa2005/chat-app.git
cd chat-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1.  Create a new project on [Supabase](https://app.supabase.io/).
2.  Go to "Project Settings" > "Database" and find your database connection string.
3.  Go to "Project Settings" > "API" and find your Project URL and `anon` public key.

### 4. Configure Database Triggers

To automatically create a user profile when a new user signs up via Supabase Auth, you need to set up a database trigger. Run the following SQL in your Supabase project's **SQL Editor**:

```sql
-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, username, display_name, avatar)
  values (
    new.id,
    -- Default username to email prefix if not provided in metadata
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user insertion
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 5. Set up environment variables

Create a `.env.local` file by copying the `.env.example` file:

```bash
cp .env.example .env.local
```

Then, fill in the values for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_TENOR_API_KEY`.

**Crucial for Database Operations (`DATABASE_URL`):**
For `npx prisma db push` to work correctly and bypass Row Level Security (RLS) policies during schema updates:

1.  Use the **Session** connection string (Port **5432**), NOT the Transaction Pooler (Port 6543).
2.  Ensure you are connecting as the `postgres` user (default), which has superuser privileges and bypasses RLS.

Example:
`DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"`

### 6. Apply Prisma Migrations

Once your `DATABASE_URL` is set in `.env.local`, apply the database migrations:

```bash
npx prisma migrate dev
```

This command will create or update your database schema based on your Prisma schema and local migration files.

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Troubleshooting

### Images not loading

If user avatars or shared images are not loading, ensure your `NEXT_PUBLIC_SUPABASE_URL` is correctly set in `.env.local`. The application uses this variable to configure allowed image domains in `next.config.ts`.

### Database connection errors

Double-check your `DATABASE_URL` in `.env.local`. It should be the Transaction connection pooler string (port 6543) or the Session connection string (port 5432) from Supabase.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
