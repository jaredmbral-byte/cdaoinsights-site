-- Clean appointment announcement rows from hiring_signals
-- These were incorrectly ingested via ingestFromAppointmentRSS() which has been removed.
-- Appointment/departure news belongs in executive_moves, not hiring_signals.

DELETE FROM hiring_signals WHERE source_name = 'News';
