# Testing Guide

This document provides an overview of the testing strategy for this project and how to write and run tests. A solid testing suite is crucial for maintaining code quality, preventing regressions, and making it easier for others to contribute with confidence.

## Our Testing Tools

-   **[Vitest](https://vitest.dev/):** A fast and modern test runner with a Jest-compatible API. It's configured to work seamlessly with our Next.js and React setup.
-   **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro):** A library for testing React components in a way that resembles how users interact with them. It encourages writing tests that are maintainable and give confidence in the UI.
-   **[jsdom](https://github.com/jsdom/jsdom):** A library that simulates a browser environment within Node.js, allowing us to run component tests without needing a real browser.

## How to Run Tests

We have configured a few scripts in `package.json` to make running tests easy.

### Interactive UI Mode

To run tests in an interactive UI that opens in your browser, run:

```bash
npm test
```

This command starts the Vitest UI, which allows you to visually inspect test results, re-run specific tests, and see detailed error messages. This is the recommended way to run tests during development.

### Command-Line Mode

If you prefer to run tests directly in your terminal, you can use the `vitest` command:

```bash
# Run tests and watch for changes
npx vitest

# Run all tests once without watching
npx vitest run
```

## Types of Tests

This project uses a mix of testing strategies to ensure different parts of the application are covered.

### 1. Component Tests

These tests verify that our individual React components render and behave correctly. They are located in the same directory as the component they are testing, with a `.test.tsx` extension.

**Example: `components/ui/button.test.tsx`**

This test file checks the `<Button>` component. It ensures that:
-   The button renders with the correct text content.
-   Props like `variant` and `size` apply the correct styles.
-   The button is correctly disabled when the `disabled` prop is passed.

These tests are small, fast, and ensure that our basic UI building blocks are reliable.

### 2. Server Action (Integration) Tests

These tests verify the business logic within our Next.js Server Actions. They are crucial for ensuring that our backend logic works as expected.

**Example: `app/conversation/create/actions.test.ts`**

This file tests the `sendMessage` server action. Since this action interacts with external services (the Prisma database and the Supabase broadcast channel), we don't want to use the real services in our tests. Instead, we **mock** them.

In this test, we:
1.  **Mock the Dependencies:** We use `vi.mock()` to replace `prisma` and `broadcastMessage` with fake "spy" functions.
2.  **Test the Logic:** We call `sendMessage` and check that it calls our mocked `prisma.messages.create` function with the correct data.
3.  **Verify the Flow:** We assert that if the database creation is successful, the mocked `broadcastMessage` function is also called. If the database creation fails, we assert that the broadcast function is *not* called.

This approach allows us to test the core logic of the server action in isolation, making the test fast and reliable.

## Writing New Tests

When you contribute a new feature, please add tests for it.
-   **For a new UI component:** Create a `[component].test.tsx` file and write tests that cover its different states and props.
-   **For a new Server Action:** Create an `actions.test.ts` file and write integration tests that mock its dependencies and verify its logic.
