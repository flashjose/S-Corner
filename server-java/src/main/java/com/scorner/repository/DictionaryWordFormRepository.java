package com.scorner.repository;

import com.scorner.entity.DictionaryWordForm;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DictionaryWordFormRepository extends JpaRepository<DictionaryWordForm, String> {

    Optional<DictionaryWordForm> findByForm(String form);
}
