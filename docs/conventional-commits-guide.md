# Conventional Commits Guide

This guide explains how to format your commit messages according to the Conventional Commits specification, which is used by `release-it` to automatically generate changelog notes and determine semantic version bumps.

## Format

The commit message should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Type

The `type` is a verb that describes the nature of the change. It is **mandatory**.
Common types configured for this project include:

*   **`feat`**: A new feature or enhancement. (Results in `minor` version bump)
*   **`fix`**: A bug fix. (Results in `patch` version bump)
*   **`chore`**: Maintenance tasks, build process changes, auxiliary tools, libraries, etc.
*   **`docs`**: Documentation only changes.
*   **`style`**: Changes that do not affect the meaning of the code (white-space, formatting, missing semicolons, etc.).
*   **`refactor`**: A code change that neither fixes a bug nor adds a feature.
*   **`perf`**: A code change that improves performance.
*   **`test`**: Adding missing tests or correcting existing tests.

### Scope (Optional)

The `scope` provides additional contextual information about the change. It is **optional** and should be enclosed in parentheses.

Examples: `feat(authentication):`, `fix(api):`, `chore(deps):`

### Description

The `description` is a concise, imperative-mood summary of the change. It is **mandatory**.
*   Use the imperative mood ("change", not "changed" or "changes").
*   Do not capitalize the first letter.
*   Do not end with a period.

### Body (Optional)

The `body` provides a longer, more detailed explanation of the commit message. It is **optional**.
*   Use the imperative mood.
*   Can span multiple paragraphs.
*   Can include bullet points.

### Footer(s) (Optional)

The `footer` can contain information about breaking changes or references to issues. It is **optional**.
*   **Breaking Changes**: If a commit introduces a breaking change, the footer should start with `BREAKING CHANGE:` followed by a description of the change and migration instructions.
*   **Issue References**: Reference issues by their ID, e.g., `Closes #123`, `Refs #456`.

## Examples

**New Feature:**
```
feat(user-profile): add avatar upload functionality

Users can now upload and change their profile pictures.
This enhances personalization.
```

**Bug Fix:**
```
fix(database): correctly handle null user IDs on message creation

Previously, messages from unauthenticated users would cause a DB error.
Added a null check to prevent application crashes.
Closes #789
```

**Chore/Maintenance:**
```
chore(deps): update all npm dependencies

Updated minor and patch versions of various packages.
This includes react, next, and tailwindcss.
```

**Documentation Update:**
```
docs: update installation instructions for Supabase

Clarified steps for database setup and environment variables.
Refs #101
```

By following these guidelines, you ensure consistent, readable commit history and enable automated tools like `release-it` to function effectively.
