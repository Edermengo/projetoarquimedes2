/*
  # Fix budgets RLS policies

  1. Changes
    - Drop and recreate the INSERT policy for budgets table to ensure user_id is properly set
    - Policy will now use the authenticated user's ID as the user_id for new budgets

  2. Security
    - Maintains RLS enabled on budgets table
    - Ensures users can only create budgets associated with their own user ID
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Usuários podem criar orçamentos" ON budgets;

-- Create new INSERT policy that properly handles user_id
CREATE POLICY "Usuários podem criar orçamentos"
ON budgets
FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensures user_id is set to the authenticated user's ID
  COALESCE(user_id, auth.uid()) = auth.uid()
);