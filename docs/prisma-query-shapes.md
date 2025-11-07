# Reusable Prisma Query Shapes for Type Safety and Maintainability

When working with Prisma, a common challenge arises when you need to fetch specific subsets of data (using `select` or `include`) and ensure your TypeScript types accurately reflect these subsets. The issue becomes more pronounced when your database schema evolves, requiring updates across numerous query definitions and type declarations.

This document outlines a recommended pattern to centralize your Prisma query arguments, providing a single source of truth for both runtime queries and type generation, thereby drastically improving maintainability and type safety.

---

## The Problem: Maintenance Overhead

If you define `select` or `include` blocks directly within every `prisma.model.findMany()` or `prisma.model.findFirst()` call, and then manually create corresponding TypeScript types, you face several issues:

1.  **Repetition:** The same `select` or `include` logic is duplicated across your codebase.
2.  **Inconsistency:** It's easy for different parts of your application to fetch slightly different shapes of the "same" data, leading to subtle bugs.
3.  **Maintenance Burden:** When a new field is added to your database model, or an existing relation changes, you have to manually update every single `select` block and its associated TypeScript type. This is tedious and error-prone.

---

## The Solution: Centralized Query Argument Definitions

The best practice is to define your common query "shapes" (the `select` and `include` objects) as reusable constants in a central file. These constants can then be imported and used consistently throughout your application.

### Step 1: Create a Central File for Query Arguments

Create a dedicated file, for instance, `lib/prisma-shapes.ts` (or `src/prisma/query-shapes.ts`, etc.), to house these reusable argument definitions.

```typescript
// lib/prisma-shapes.ts
import { Prisma } from '@prisma/client';

// Define a common shape for a message including its sender's username and reactions
export const messageWithSenderAndReactionsArgs = {
  include: {
    sender: {
      select: {
        id: true,
        username: true,
        avatar: true,
      },
    },
    message_reactions: true,
    // Add other relations or fields here as needed.
    // If you add a new relation or field here, it automatically propagates!
  },
} satisfies Prisma.messagesFindManyArgs; // Use 'satisfies' for type checking

// You can define as many different query shapes as your application requires
export const simpleMessageArgs = {
  select: {
    id: true,
    content: true,
    created_at: true,
  },
} satisfies Prisma.messagesFindManyArgs;
```

### Step 2: Generate Your TypeScript Types from These Arguments

In your type definition file (e.g., `lib/types.ts`), import these argument constants and use `Prisma.messagesGetPayload` (or `Prisma.UserGetPayload`, etc.) to generate precise TypeScript types.

```typescript
// lib/types.ts
import { Prisma } from '@prisma/client';
import { messageWithSenderAndReactionsArgs, simpleMessageArgs } from './prisma-shapes';

// This type now accurately reflects the data shape defined in messageWithSenderAndReactionsArgs
export type MessageWithSenderAndReactions = Prisma.messagesGetPayload<
  typeof messageWithSenderAndReactionsArgs
>;

// Similarly for other shapes
export type SimpleMessage = Prisma.messagesGetPayload<
  typeof simpleMessageArgs
>;
```

### Step 3: Use the Arguments in Your Prisma Queries

Finally, in your application code (e.g., API routes, server actions, service layers), import the argument constants and use the spread (`...`) operator to apply them to your Prisma queries.

```typescript
// In a server-side function (e.g., app/api/messages/route.ts)
import { prisma } from '@/lib/prisma'; // Assuming your PrismaClient instance
import { messageWithSenderAndReactionsArgs } from '@/lib/prisma-shapes';
import type { MessageWithSenderAndReactions } from '@/lib/types';

export async function getMessagesForConversation(conversationId: string): Promise<MessageWithSenderAndReactions[]> {
  const messages = await prisma.messages.findMany({
    ...messageWithSenderAndReactionsArgs, // Apply the reusable query shape
    where: {
      conversation_id: conversationId,
    },
    orderBy: {
      created_at: 'asc',
    },
    // You can still add other query options like 'take', 'skip', 'cursor', etc.
  });

  return messages;
}
```

---

## Benefits of This Pattern:

*   **Single Point of Maintenance:** If you need to add a new field or relation to a common data shape, you only update the `...Args` constant in `lib/prisma-shapes.ts`.
*   **Automatic Type Propagation:** The corresponding TypeScript type (e.g., `MessageWithSenderAndReactions`) will automatically update to reflect the changes, ensuring type safety across your application.
*   **Consistent Data Fetching:** All parts of your application that use a particular `...Args` constant will fetch the exact same data shape, reducing inconsistencies and bugs.
*   **Improved Readability:** Your query calls become cleaner and more focused on the `where`, `orderBy`, and other dynamic aspects, as the `select`/`include` logic is abstracted away.
*   **Optimal Performance:** By explicitly defining what to `select` or `include`, you ensure that your database queries are as lean as possible, fetching only the necessary data.

This pattern effectively addresses the maintainability concerns while leveraging Prisma's powerful type generation capabilities for robust and performant applications.
