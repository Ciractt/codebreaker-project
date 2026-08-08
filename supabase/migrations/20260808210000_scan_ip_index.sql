-- ============================================================================
-- Migration 0009: index for the flood guard
--
-- The scan route counts recent scans per address on every request. Without
-- this that is a sequential scan on the hottest table in the campaign, on the
-- one path that has to stay fast — someone standing in the street with a QR
-- code open.
-- ============================================================================

create index if not exists scans_ip_recent_idx
  on scans (ip_address, scanned_at desc);
