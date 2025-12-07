-- ============================================
-- SCRIPT SQL PARA CRIAR TABELA user_quiz_result
-- ============================================
-- Execute este SQL no dashboard do Supabase (SQL Editor)
-- para criar a tabela necessária para salvar resultados do quiz

-- Criar tabela para salvar resultados do quiz
CREATE TABLE IF NOT EXISTS user_quiz_result (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  perfil_ideal TEXT NOT NULL,
  rendex_ids TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_user_quiz_result_user_id ON user_quiz_result(user_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_quiz_result ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas seus próprios resultados
CREATE POLICY "Usuários podem ver seus próprios resultados"
  ON user_quiz_result
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuários podem inserir seus próprios resultados
CREATE POLICY "Usuários podem inserir seus próprios resultados"
  ON user_quiz_result
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem atualizar seus próprios resultados
CREATE POLICY "Usuários podem atualizar seus próprios resultados"
  ON user_quiz_result
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem deletar seus próprios resultados
CREATE POLICY "Usuários podem deletar seus próprios resultados"
  ON user_quiz_result
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Após executar, você pode verificar se a tabela foi criada com:
-- SELECT * FROM user_quiz_result LIMIT 1;
