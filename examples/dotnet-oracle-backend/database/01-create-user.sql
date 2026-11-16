-- Run once as SYSTEM in the FREEPDB1 pluggable database, not in the FREE root.
-- This creates a fresh local learning schema. It does not replace an existing user.
SET ECHO OFF
SET VERIFY OFF
WHENEVER SQLERROR EXIT SQL.SQLCODE
SHOW CON_NAME
ACCEPT app_password CHAR PROMPT 'Choose a new reading_app password (12-30 letters/numbers/!/_): ' HIDE

CREATE USER reading_app IDENTIFIED BY "&app_password"
    DEFAULT TABLESPACE users
    TEMPORARY TABLESPACE temp
    QUOTA 10M ON users;
GRANT CREATE SESSION, CREATE TABLE TO reading_app;

UNDEFINE app_password
-- Keep your chosen password outside source files. DDL statements commit automatically in Oracle.

