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

### 3. Set up environment variables

Create a `.env` file by copying the `.env.example` file:

```bash
cp .env.example .env
```

We will fill in the values within this file in the next steps.

### 4. Set up Supabase

1.  Create a new project on [Supabase](https://app.supabase.io/).
2.  Remember to note down your database password somewhere safe as you will need it later.
3.  Go to "Project Settings" > "Data API" and copy the URL under **Project URL**. Paste it into your `.env` as `NEXT_PUBLIC_SUPABASE_URL`.
4.  Go to the "Database" section of your project and click the "Connect" button to find your database connection string.
5.  Copy the string found under the method "Transaction pooler" and paste it into your `.env` as `DATABASE_URL`. Replace `[YOUR-PASSWORD]` with your database password. The URL should look something like `postgresql://[user].[project-id]:[password]@aws-x-xx-xxxx-x.pooler.supabase.com:6543/postgres?pgbouncer=true`.
6.  Go to "Project Settings" > "API Keys" > "Legacy API Keys" and copy the `anon` public key. Paste it into your `.env` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 5. Configure Supabase Auth

To enable users to sign up and log in:

1.  Go to your Supabase project dashboard.
2.  Navigate to **Authentication** > **Providers** in the sidebar.
3.  Expand the **Email** provider section.
4.  Ensure **Enable Email provider** is toggled **ON**.
5.  (Optional) Turn off "Confirm email" if you want to skip email verification during development.

### 6. Configure Database Triggers

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

### 7. Setup Database Schema

Instead of running migrations locally, we will apply the schema directly in Supabase.

1.  Open the file `prisma/migrations/20241124000000_init_full/migration.sql` in your code editor.
2.  Copy the entire content of the file.
3.  Go to your Supabase project's **SQL Editor**.
4.  Paste the SQL content and run it.

### 8. Get Tenor API Key

To enable GIF support in the chat, you need a Tenor API key from Google Cloud.

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (or select an existing one).
3.  Search for **"Tenor API"** in the library and enable it.
4.  Go to **Credentials** and create a new **API Key**.
5.  Copy the API Key and paste it into your `.env` as `NEXT_PUBLIC_TENOR_API_KEY`.

An official quickstart guide is accessible [here](https://developers.google.com/tenor/guides/quickstart).

### 9. Generate Prisma Client

Generate the client code which the application uses to interact with prisma by running the following command.

```bash
npx prisma generate
```

### 10. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or whichever URL is shown in your terminal with your browser to see the chat application in action!

## Troubleshooting

### Images not loading

If user avatars or shared images are not loading, ensure your `NEXT_PUBLIC_SUPABASE_URL` is correctly set in `.env`. The application uses this variable to configure allowed image domains in `next.config.ts`.

### Database connection errors

Double-check your `DATABASE_URL` in `.env`. It should be the Transaction connection pooler string (port 6543) from Supabase.

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
