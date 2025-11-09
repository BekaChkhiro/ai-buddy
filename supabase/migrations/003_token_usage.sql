-- Token Usage Table
-- Track Claude API token usage for billing and analytics

-- Create token_usage table
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  model TEXT NOT NULL,
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX idx_token_usage_project_id ON token_usage(project_id);
CREATE INDEX idx_token_usage_created_at ON token_usage(created_at DESC);
CREATE INDEX idx_token_usage_user_date ON token_usage(user_id, created_at DESC);
CREATE INDEX idx_token_usage_project_date ON token_usage(project_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- Policies for token_usage table
CREATE POLICY "Users can view their own token usage"
  ON token_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own token usage"
  ON token_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to get user usage stats
CREATE OR REPLACE FUNCTION get_user_usage_stats(
  p_user_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_input_tokens BIGINT,
  total_output_tokens BIGINT,
  total_tokens BIGINT,
  total_cost DECIMAL,
  request_count BIGINT,
  average_tokens_per_request DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(input_tokens), 0)::BIGINT as total_input_tokens,
    COALESCE(SUM(output_tokens), 0)::BIGINT as total_output_tokens,
    COALESCE(SUM(total_tokens), 0)::BIGINT as total_tokens,
    COALESCE(SUM(cost), 0)::DECIMAL as total_cost,
    COUNT(*)::BIGINT as request_count,
    CASE
      WHEN COUNT(*) > 0 THEN (SUM(total_tokens)::DECIMAL / COUNT(*))
      ELSE 0
    END as average_tokens_per_request
  FROM token_usage
  WHERE user_id = p_user_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get project usage stats
CREATE OR REPLACE FUNCTION get_project_usage_stats(
  p_project_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_input_tokens BIGINT,
  total_output_tokens BIGINT,
  total_tokens BIGINT,
  total_cost DECIMAL,
  request_count BIGINT,
  average_tokens_per_request DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(input_tokens), 0)::BIGINT as total_input_tokens,
    COALESCE(SUM(output_tokens), 0)::BIGINT as total_output_tokens,
    COALESCE(SUM(total_tokens), 0)::BIGINT as total_tokens,
    COALESCE(SUM(cost), 0)::DECIMAL as total_cost,
    COUNT(*)::BIGINT as request_count,
    CASE
      WHEN COUNT(*) > 0 THEN (SUM(total_tokens)::DECIMAL / COUNT(*))
      ELSE 0
    END as average_tokens_per_request
  FROM token_usage
  WHERE project_id = p_project_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE token_usage IS 'Tracks Claude API token usage for billing and analytics';
COMMENT ON COLUMN token_usage.input_tokens IS 'Number of input tokens (prompt)';
COMMENT ON COLUMN token_usage.output_tokens IS 'Number of output tokens (completion)';
COMMENT ON COLUMN token_usage.total_tokens IS 'Total tokens (input + output)';
COMMENT ON COLUMN token_usage.model IS 'Claude model used';
COMMENT ON COLUMN token_usage.cost IS 'Cost in USD for this API call';
