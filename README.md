# Next.js & Supabase Realtime Chat App

This is an open-source, real-time chat application built with Next.js, Supabase, and Prisma. It's designed to be a solid foundation for anyone looking to build a feature-rich chat application with a modern tech stack.

## Features

*   Real-time messaging
*   User authentication (Supabase Auth)
*   Conversation creation and management
*   Message reactions
*   Typing indicators
*   Unread message badges
*   Image uploads
*   Emoji picker
*   Theme toggle (dark/light mode)
*   User profiles and avatars

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Database:** [Supabase](https://supabase.io/) (Postgres)
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Authentication:** [Supabase Auth](https://supabase.io/docs/guides/auth)
*   **Real-time:** [Supabase Realtime](https://supabase.io/docs/guides/realtime)
*   **UI:** [shadcn/ui](https://ui.shadcn.com/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Linting:** [ESLint](https://eslint.org/)
*   **Formatting:** [Prettier](https://prettier.io/)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-repo/chat-app.git
cd chat-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1.  Create a new project on [Supabase](https://app.supabase.io/).
2.  Go to the "SQL Editor" and run the SQL from `prisma/migrations/0_init_supabase/migration.sql` to create the database schema.
3.  Go to "Project Settings" > "API" and find your Project URL and `anon` public key.

### 4. Set up environment variables

Create a `.env.local` file by copying the `.env.example` file:

```bash
cp .env.example .env.local
```

Then, fill in the values for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.