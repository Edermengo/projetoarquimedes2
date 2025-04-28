/*
  # Esquema inicial do sistema de orçamentos

  1. Novas Tabelas
    - `budgets`: Armazena os orçamentos
    - `chapters`: Capítulos do orçamento
    - `services`: Serviços de construção
    - `price_database`: Banco de preços de referência

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para leitura e escrita de dados
*/

-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  bdi numeric DEFAULT 0,
  total_value numeric DEFAULT 0
);

-- Tabela de capítulos
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  title text NOT NULL,
  code text NOT NULL,
  sequence integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text NOT NULL,
  unit text NOT NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  quantity numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabela de banco de preços
CREATE TABLE IF NOT EXISTS price_database (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  description text NOT NULL,
  unit text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  source text NOT NULL,
  reference_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_database ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para orçamentos
CREATE POLICY "Usuários podem ler seus próprios orçamentos"
  ON budgets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar orçamentos"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios orçamentos"
  ON budgets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para capítulos
CREATE POLICY "Usuários podem gerenciar capítulos dos seus orçamentos"
  ON chapters FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_id
      AND budgets.user_id = auth.uid()
    )
  );

-- Políticas para serviços
CREATE POLICY "Usuários podem gerenciar serviços dos seus orçamentos"
  ON services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chapters
      JOIN budgets ON budgets.id = chapters.budget_id
      WHERE chapters.id = services.chapter_id
      AND budgets.user_id = auth.uid()
    )
  );

-- Políticas para banco de preços
CREATE POLICY "Todos podem ler o banco de preços"
  ON price_database FOR SELECT
  TO authenticated
  USING (true);