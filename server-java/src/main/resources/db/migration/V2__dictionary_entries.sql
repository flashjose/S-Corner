CREATE TABLE IF NOT EXISTS dictionary_entry (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    word        VARCHAR(128) NOT NULL,
    phonetic    VARCHAR(256),
    pos         VARCHAR(64),
    definition  TEXT,
    translation TEXT,
    exchange    VARCHAR(512),
    UNIQUE KEY uk_dictionary_word (word)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dictionary_word_form (
    form  VARCHAR(128) NOT NULL PRIMARY KEY,
    lemma VARCHAR(128) NOT NULL,
    KEY idx_dictionary_lemma (lemma)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
