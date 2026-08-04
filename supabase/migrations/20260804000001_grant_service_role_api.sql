-- Grant write permissions on api schema tables to service_role for admin operations
GRANT ALL ON ALL TABLES IN SCHEMA api TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA api TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA api TO service_role;
