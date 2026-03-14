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

-- Bật Row Level Security + Policy cho anon (D4)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access (anon)" 
ON applications 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Index cho query lịch sử nhanh (D5)
CREATE INDEX IF NOT EXISTS idx_applications_created_at 
ON applications (created_at DESC);

-- Trigger tự update updated_at (D6 - Bonus)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();