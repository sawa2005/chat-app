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

-   **Framework:** [Next.js](https://nextjs.org/) (v16.0.3)
-   **Language:** [TypeScript](https://www.typescriptlang.org/) (v5.9.2)
-   **Library:** [React](https://react.dev/) (v19.2.0)
-   **Database:** [Supabase](https://supabase.io/) (Postgres)
-   **ORM:** [Prisma](https://www.prisma.io/) (v7.0.0)
-   **Authentication:** [Supabase Auth](https://supabase.io/docs/guides/auth)
-   **Real-time:** [Supabase Realtime](https://supabase.io/docs/guides/realtime)
-   **UI:** [shadcn/ui](https://ui.shadcn.com/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4.0.0)
-   **Linting:** [ESLint](https://eslint.org/) (v9.0.0)

### Major Dependencies

-   **@radix-ui/primitives**: Accessible UI components for building high-quality design systems.
-   **lucide-react**: Beautiful & consistent icons (v0.540.0).
-   **next-themes**: Perfect dark mode support for Next.js (v0.4.6).
-   **react-easy-crop**: Easy image cropping for React (v5.5.0).
-   **gif-picker-react**: Customizable GIF picker component (v1.4.0).
-   **frimousse**: Simple and lightweight emoji picker (v0.3.0).

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

### 4. Configure Supabase Auth

To enable users to sign up and log in:

1.  Go to your Supabase project dashboard.
2.  Navigate to **Authentication** > **Providers** in the sidebar.
3.  Expand the **Email** provider section.
4.  Ensure **Enable Email provider** is toggled **ON**.
5.  (Optional) Turn off "Confirm email" if you want to skip email verification during development.

### 5. Configure Database Triggers

To automatically create a user profile when a new user signs up via Supabase Auth, you need to set up a database trigger. Run the following SQL in your Supabase project's **SQL Editor**:

```sql
-- Function to handle new user creation
create or replace function public.create_user_profile()
returns trigger as $$
begin
  -- Add a check to prevent duplicate insertions
  if not exists (select 1 from public.profiles where user_id = new.id) then
    insert into public.profiles(user_id)
    values (new.id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user insertion
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_user_profile();
```

### 6. Set up environment variables

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

### Verifying Changes (Tests)

This project uses [Vitest](https://vitest.dev/) for unit and integration testing. If you make changes to the codebase, run the tests to ensure existing functionality remains intact.

To run the tests interactively (opens UI):

```bash
npm run test
```

To run tests once in the console:

```bash
npx vitest run
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
