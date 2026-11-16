-- Run as SYSTEM in FREEPDB1 after the table has been created.
WHENEVER SQLERROR EXIT SQL.SQLCODE
REVOKE CREATE TABLE FROM reading_app;
-- The schema owner can still change/drop its existing objects.
-- Production should use a separate runtime user with only the necessary object grants.

