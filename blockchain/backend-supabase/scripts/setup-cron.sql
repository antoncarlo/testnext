-- Author: Anton Carlo Santoro
-- Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
-- Setup Cron Job for Points Calculation

-- Abilita pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule calculate-points ogni giorno alle 00:00 UTC
-- IMPORTANTE: Sostituisci YOUR_PROJECT_URL e YOUR_CRON_SECRET con i valori reali
SELECT cron.schedule(
    'calculate-daily-points',
    '0 0 * * *', -- Ogni giorno a mezzanotte UTC
    $$
    SELECT net.http_post(
        url:='https://YOUR_PROJECT_URL.supabase.co/functions/v1/calculate-points',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
    ) as request_id;
    $$
);

-- Schedule alternativo: ogni ora (per testing o maggiore granularità)
-- SELECT cron.schedule(
--     'calculate-hourly-points',
--     '0 * * * *', -- Ogni ora al minuto 0
--     $$
--     SELECT net.http_post(
--         url:='https://YOUR_PROJECT_URL.supabase.co/functions/v1/calculate-points',
--         headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
--     ) as request_id;
--     $$
-- );

-- Verifica cron jobs attivi
SELECT * FROM cron.job;

-- Verifica ultime esecuzioni
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;

-- Per rimuovere un cron job (se necessario)
-- SELECT cron.unschedule('calculate-daily-points');

-- Per modificare lo schedule di un job esistente
-- UPDATE cron.job SET schedule = '0 */2 * * *' WHERE jobname = 'calculate-daily-points';
