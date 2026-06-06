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

-- vocabulary table (create with user_id if table doesn't exist yet, otherwise ALTER)
CREATE TABLE IF NOT EXISTS vocabulary (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    word          VARCHAR(255) NOT NULL,
    phonetic      VARCHAR(255) NULL,
    definition    TEXT         NULL,
    translation   TEXT         NULL,
    example       TEXT         NULL,
    exam_paper_id VARCHAR(255) NULL,
    user_id       VARCHAR(36)  NULL,
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    KEY idx_vocab_user (user_id),
    KEY idx_vocab_user_word (user_id, word)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- paper_progress table (create with user_id if table doesn't exist yet, otherwise ALTER)
CREATE TABLE IF NOT EXISTS paper_progress (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    paper_id     VARCHAR(255) NOT NULL,
    current_page INT          NOT NULL DEFAULT 0,
    user_id      VARCHAR(36)  NULL,
    updated_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    KEY idx_pp_user (user_id),
    UNIQUE KEY uk_pp_user_paper (user_id, paper_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- paper_annotations table (create with user_id if table doesn't exist yet, otherwise ALTER)
CREATE TABLE IF NOT EXISTS paper_annotations (
    id             BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    paper_id       VARCHAR(255) NOT NULL,
    page           INT          NOT NULL,
    content        TEXT         NULL,
    color          VARCHAR(32)  NULL,
    user_id        VARCHAR(36)  NULL,
    created_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    KEY idx_pa_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
