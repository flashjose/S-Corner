-- Users and personal data isolation (idempotent for Flyway + Hibernate coexistence)

CREATE TABLE IF NOT EXISTS users (
    id            VARCHAR(36)  NOT NULL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NULL,
    display_name  VARCHAR(64)  NOT NULL,
    avatar_url    VARCHAR(512) NULL,
    created_at    DATETIME(6)  NOT NULL,
    updated_at    DATETIME(6)  NOT NULL,
    UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS oauth_accounts (
    id               BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id          VARCHAR(36)  NOT NULL,
    provider         VARCHAR(32)  NOT NULL,
    provider_user_id VARCHAR(128) NOT NULL,
    KEY idx_oauth_user (user_id),
    UNIQUE KEY uk_oauth_provider (provider, provider_user_id),
    CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- vocabulary.user_id
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'vocabulary' AND column_name = 'user_id'
);
SET @sql = IF(
    @col_exists = 0,
    'ALTER TABLE vocabulary ADD COLUMN user_id VARCHAR(36) NULL, ADD KEY idx_vocab_user (user_id), ADD KEY idx_vocab_user_word (user_id, word)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- paper_progress.user_id + unique constraint
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'paper_progress' AND column_name = 'user_id'
);
SET @sql = IF(
    @col_exists = 0,
    'ALTER TABLE paper_progress ADD COLUMN user_id VARCHAR(36) NULL, ADD KEY idx_pp_user (user_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'paper_progress' AND index_name = 'uk_pp_user_paper'
);
SET @sql = IF(
    @idx_exists = 0,
    'ALTER TABLE paper_progress ADD UNIQUE KEY uk_pp_user_paper (user_id, paper_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- paper_annotations.user_id
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'paper_annotations' AND column_name = 'user_id'
);
SET @sql = IF(
    @col_exists = 0,
    'ALTER TABLE paper_annotations ADD COLUMN user_id VARCHAR(36) NULL, ADD KEY idx_pa_user (user_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
