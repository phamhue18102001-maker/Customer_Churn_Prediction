-- ==============================================================================
-- 1. TẠO BẢNG
-- ==============================================================================
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

-- ==============================================================================
-- 2. TẠO INDEX (Tối ưu hóa truy vấn)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_applications_created_at
    ON applications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_will_churn
    ON applications (will_churn);

CREATE INDEX IF NOT EXISTS idx_applications_risk_level
    ON applications (risk_level);

-- ==============================================================================
-- 3. TẠO FUNCTION & TRIGGER (Tự động cập nhật updated_at)
-- ==============================================================================
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

-- ==============================================================================
-- 4. BẢO MẬT: ROW LEVEL SECURITY (RLS) & POLICIES
-- ==============================================================================
-- Bật RLS cho bảng
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Tạo một Policy duy nhất bao trùm cả quyền xem, thêm, sửa, xóa cho tất cả (public)
-- (Policy này đã thay thế cho cả 2 policy cũ của bạn để tránh trùng lặp)
CREATE POLICY "Enable full access for all (public)" 
ON applications 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

-- ==============================================================================
-- 5. PHÂN QUYỀN (GRANTS)
-- ==============================================================================
-- Đảm bảo các role anon (chưa đăng nhập) và authenticated (đã đăng nhập) có quyền trên schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;