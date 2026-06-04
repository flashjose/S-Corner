-- Add audio timeline JSON for segmented listening player.
-- Idempotent: CI runs Flyway before Hibernate ddl-auto creates exam_papers.
SET @table_exists = (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'exam_papers'
);
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'exam_papers'
      AND column_name = 'audio_timeline'
);
SET @sql = IF(
    @table_exists > 0 AND @col_exists = 0,
    'ALTER TABLE exam_papers ADD COLUMN audio_timeline JSON NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
