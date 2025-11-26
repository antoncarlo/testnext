-- Author: Anton Carlo Santoro
-- Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
-- Migration: Create Points System Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users
-- ============================================
-- Memorizza le informazioni di base degli utenti

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_wallet ON users(wallet_address);

COMMENT ON TABLE users IS 'Utenti registrati nel sistema di punti NextBlock';
COMMENT ON COLUMN users.wallet_address IS 'Indirizzo wallet Ethereum/Base dell utente';

-- ============================================
-- TABLE: points
-- ============================================
-- Contiene il saldo totale dei punti per ogni utente

CREATE TABLE points (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_points NUMERIC(20, 8) DEFAULT 0 NOT NULL,
    rank INT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_points_rank ON points(rank);
CREATE INDEX idx_points_total ON points(total_points DESC);

COMMENT ON TABLE points IS 'Saldo totale punti per utente con ranking';
COMMENT ON COLUMN points.total_points IS 'Punti totali accumulati (con 8 decimali)';
COMMENT ON COLUMN points.rank IS 'Posizione in classifica globale';

-- ============================================
-- TABLE: points_history
-- ============================================
-- Traccia ogni singolo calcolo di punti, fornendo una cronologia dettagliata

CREATE TABLE points_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_earned NUMERIC(20, 8) NOT NULL,
    calculation_date DATE NOT NULL,
    source_activity TEXT NOT NULL,
    multiplier NUMERIC(4, 2) NOT NULL,
    raw_balance NUMERIC(30, 18) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_points_history_user ON points_history(user_id);
CREATE INDEX idx_points_history_date ON points_history(calculation_date);
CREATE INDEX idx_points_history_activity ON points_history(source_activity);

COMMENT ON TABLE points_history IS 'Cronologia dettagliata di ogni calcolo punti';
COMMENT ON COLUMN points_history.source_activity IS 'Tipo di attivita: holding, lp_dex, lending_collateral, referral';
COMMENT ON COLUMN points_history.multiplier IS 'Moltiplicatore applicato (1x, 2x, 3x, 4x)';
COMMENT ON COLUMN points_history.raw_balance IS 'Saldo raw che ha generato i punti (18 decimali)';

-- ============================================
-- STORED PROCEDURE: update_user_points
-- ============================================
-- Aggiorna i punti di un utente e ricalcola i rank

CREATE OR REPLACE FUNCTION update_user_points(
    p_user_address TEXT,
    p_points_earned NUMERIC,
    p_source_activity TEXT DEFAULT 'daily_calculation',
    p_multiplier NUMERIC DEFAULT 1.0,
    p_raw_balance NUMERIC DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
    v_calculation_date DATE;
BEGIN
    v_calculation_date := CURRENT_DATE;
    
    -- Trova o crea utente
    INSERT INTO users (wallet_address)
    VALUES (p_user_address)
    ON CONFLICT (wallet_address) DO NOTHING
    RETURNING id INTO v_user_id;
    
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM users WHERE wallet_address = p_user_address;
    END IF;
    
    -- Verifica se i punti per questa data sono già stati calcolati
    IF EXISTS (
        SELECT 1 FROM points_history
        WHERE user_id = v_user_id
        AND calculation_date = v_calculation_date
        AND source_activity = p_source_activity
    ) THEN
        -- Punti già calcolati per oggi, skip per idempotenza
        RETURN;
    END IF;
    
    -- Inserisci in points_history
    INSERT INTO points_history (
        user_id,
        points_earned,
        calculation_date,
        source_activity,
        multiplier,
        raw_balance
    ) VALUES (
        v_user_id,
        p_points_earned,
        v_calculation_date,
        p_source_activity,
        p_multiplier,
        p_raw_balance
    );
    
    -- Aggiorna points totali
    INSERT INTO points (user_id, total_points)
    VALUES (v_user_id, p_points_earned)
    ON CONFLICT (user_id)
    DO UPDATE SET
        total_points = points.total_points + p_points_earned,
        updated_at = now();
    
    -- Ricalcola rank per tutti gli utenti
    WITH ranked_users AS (
        SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_points DESC) as new_rank
        FROM points
    )
    UPDATE points p
    SET rank = r.new_rank
    FROM ranked_users r
    WHERE p.user_id = r.user_id;
END;
$$;

COMMENT ON FUNCTION update_user_points IS 'Aggiorna punti utente e ricalcola ranking globale';

-- ============================================
-- FUNCTION: get_user_points
-- ============================================
-- Ottiene i punti totali e il rank di un utente

CREATE OR REPLACE FUNCTION get_user_points(p_wallet_address TEXT)
RETURNS TABLE (
    wallet_address TEXT,
    total_points NUMERIC,
    rank INT,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.wallet_address,
        COALESCE(p.total_points, 0) as total_points,
        p.rank,
        p.updated_at
    FROM users u
    LEFT JOIN points p ON u.id = p.user_id
    WHERE u.wallet_address = p_wallet_address;
END;
$$;

-- ============================================
-- FUNCTION: get_user_history
-- ============================================
-- Ottiene la cronologia punti di un utente

CREATE OR REPLACE FUNCTION get_user_history(
    p_wallet_address TEXT,
    p_limit INT DEFAULT 30
)
RETURNS TABLE (
    date DATE,
    points_earned NUMERIC,
    activity TEXT,
    multiplier NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ph.calculation_date as date,
        ph.points_earned,
        ph.source_activity as activity,
        ph.multiplier
    FROM points_history ph
    JOIN users u ON ph.user_id = u.id
    WHERE u.wallet_address = p_wallet_address
    ORDER BY ph.calculation_date DESC
    LIMIT p_limit;
END;
$$;

-- ============================================
-- FUNCTION: get_leaderboard
-- ============================================
-- Ottiene la classifica globale con paginazione

CREATE OR REPLACE FUNCTION get_leaderboard(
    p_page INT DEFAULT 1,
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    rank INT,
    wallet_address TEXT,
    total_points NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_offset INT;
BEGIN
    v_offset := (p_page - 1) * p_limit;
    
    RETURN QUERY
    SELECT 
        p.rank,
        u.wallet_address,
        p.total_points
    FROM points p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.rank
    LIMIT p_limit
    OFFSET v_offset;
END;
$$;

-- ============================================
-- FUNCTION: get_leaderboard_count
-- ============================================
-- Ottiene il numero totale di utenti in classifica

CREATE OR REPLACE FUNCTION get_leaderboard_count()
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM points WHERE total_points > 0;
    RETURN v_count;
END;
$$;

-- ============================================
-- SEED DATA (per testing)
-- ============================================
-- Inserisci alcuni utenti di esempio per testing

-- INSERT INTO users (wallet_address) VALUES
--     ('0x1234567890123456789012345678901234567890'),
--     ('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');

-- INSERT INTO points (user_id, total_points, rank) VALUES
--     ((SELECT id FROM users WHERE wallet_address = '0x1234567890123456789012345678901234567890'), 1000.50, 1),
--     ((SELECT id FROM users WHERE wallet_address = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'), 500.25, 2);
