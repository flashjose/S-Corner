package com.scorner.repository;

import com.scorner.entity.DictionaryEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DictionaryEntryRepository extends JpaRepository<DictionaryEntry, Long> {

    Optional<DictionaryEntry> findByWord(String word);
}
