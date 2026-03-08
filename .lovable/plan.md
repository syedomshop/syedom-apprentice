

## Fix: Enum Value Commit Error

The error occurs because PostgreSQL requires new enum values to be committed in a separate transaction before they can be referenced. The solution is to split the SQL into two steps.

### Step 1 — Run this first:
```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
```

### Step 2 — Run this after Step 1 succeeds:
Run the remaining SQL (the `has_role` policies, `is_admin_email` function, RLS policies for batches/notifications, and the `INSERT` into `user_roles`).

This is a PostgreSQL limitation — enum values added with `ADD VALUE` cannot be used in the same transaction. Two separate executions in the SQL Editor will resolve it.

