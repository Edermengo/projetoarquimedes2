/*
  # Budget Management System Schema

  1. New Tables
    - `budgets`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `location` (text)
      - `bid_id` (text)
      - `bdi` (numeric)
      - `total_value` (numeric)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `chapters`
      - `id` (uuid, primary key)
      - `budget_id` (uuid, references budgets)
      - `title` (text)
      - `code` (text)
      - `sequence` (integer)
      - `created_at` (timestamptz)

    - `services`
      - `id` (uuid, primary key)
      - `chapter_id` (uuid, references chapters)
      - `code` (text)
      - `description` (text)
      - `unit` (text)
      - `quantity` (numeric)
      - `unit_price` (numeric)
      - `total_price` (numeric)
      - `created_at` (timestamptz)

    - `price_database`
      - `id` (uuid, primary key)
      - `code` (text)
      - `description` (text)
      - `unit` (text)
      - `price` (numeric)
      - `source` (text)
      - `reference_date` (date)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text,
  bid_id text,
  bdi numeric DEFAULT 0,
  total_value numeric DEFAULT 0,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own budgets"
  ON budgets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert budgets"
  ON budgets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON budgets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  title text NOT NULL,
  code text NOT NULL,
  sequence integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage chapters of their budgets"
  ON chapters
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = chapters.budget_id
      AND budgets.user_id = auth.uid()
    )
  );

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text NOT NULL,
  unit text NOT NULL,
  quantity numeric DEFAULT 0,
  unit_price numeric DEFAULT 0,
  total_price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage services of their budgets"
  ON services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chapters
      JOIN budgets ON budgets.id = chapters.budget_id
      WHERE chapters.id = services.chapter_id
      AND budgets.user_id = auth.uid()
    )
  );

-- Create price database table
CREATE TABLE IF NOT EXISTS price_database (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  description text NOT NULL,
  unit text NOT NULL,
  price numeric DEFAULT 0,
  source text NOT NULL,
  reference_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE price_database ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read price database"
  ON price_database
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to update budget total value
CREATE OR REPLACE FUNCTION update_budget_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE budgets
  SET total_value = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM services
    WHERE chapter_id IN (
      SELECT id FROM chapters WHERE budget_id = (
        SELECT budget_id FROM chapters WHERE id = NEW.chapter_id
      )
    )
  )
  WHERE id = (
    SELECT budget_id FROM chapters WHERE id = NEW.chapter_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update budget total value
CREATE TRIGGER update_budget_total_trigger
AFTER INSERT OR UPDATE OR DELETE ON services
FOR EACH ROW
EXECUTE FUNCTION update_budget_total();