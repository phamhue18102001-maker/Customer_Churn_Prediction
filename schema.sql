-- =============================================
-- SCHEMA CHO APPLICATIONS (Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tạo table (D1-D3)
CREATE TABLE IF NOT EXISTS applications (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    input_data      JSONB NOT NULL,
    churn_score     FLOAT NOT NULL,
    will_churn      BOOLEAN NOT NULL,
    risk_level      TEXT NOT NULL,
    recommendation  TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Comment cho dễ quản lý sau này
COMMENT ON TABLE applications IS 'Lưu lịch sử dự đoán churn (75+ features)';
COMMENT ON COLUMN applications.input_data IS 'Toàn bộ input JSON (PredictRequestSchema)';
COMMENT ON COLUMN applications.churn_score IS 'Xác suất churn từ model';
COMMENT ON COLUMN applications.will_churn IS 'True = sẽ churn';
COMMENT ON COLUMN applications.risk_level IS 'Low/Medium/High';
COMMENT ON COLUMN applications.recommendation IS 'Gợi ý hành động';

-- Bật Row Level Security (D4)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access (anon)" 
    ON applications 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Index tối ưu query (D5 + bonus)
CREATE INDEX IF NOT EXISTS idx_applications_created_at 
    ON applications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_will_churn 
    ON applications (will_churn);

CREATE INDEX IF NOT EXISTS idx_applications_risk_level 
    ON applications (risk_level);

-- Trigger tự động update updated_at (D6 - Bonus)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();