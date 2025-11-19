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
2.  Go to "Project Settings" > "Database" and find your database connection string.
3.  Go to "Project Settings" > "API" and find your Project URL and `anon` public key.

### 4. Set up environment variables

Create a `.env.local` file by copying the `.env.example` file:

```bash
cp .env.example .env.local
```

Then, fill in the values for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, and `NEXT_PUBLIC_TENOR_API_KEY` from your Supabase project and Tenor API.

### 5. Push Prisma schema to Supabase

Once your `DATABASE_URL` is set in `.env.local`, sync your database schema:

```bash
npx prisma db push
```

### 6. Run the development server

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