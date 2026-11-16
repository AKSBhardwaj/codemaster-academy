-- Run once as READING_APP in FREEPDB1. This script creates a new table and two fictional books.
-- There is deliberately no DROP TABLE or automatic reset step.
WHENEVER SQLERROR EXIT SQL.SQLCODE
CREATE TABLE reading_list_books (
    id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR2(120 CHAR) NOT NULL,
    is_read NUMBER(1) DEFAULT 0 NOT NULL,
    CONSTRAINT reading_books_read_flag CHECK (is_read IN (0, 1))
);

INSERT INTO reading_list_books (title, is_read) VALUES ('The Moon Garden', 0);
INSERT INTO reading_list_books (title, is_read) VALUES ('Ocean Friends', 1);
COMMIT;

SELECT id, title, is_read FROM reading_list_books ORDER BY id;

