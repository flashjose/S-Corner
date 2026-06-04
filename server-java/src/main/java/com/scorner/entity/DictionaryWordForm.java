package com.scorner.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "dictionary_word_form", indexes = {
    @Index(name = "idx_dictionary_lemma", columnList = "lemma")
})
public class DictionaryWordForm {

    @Id
    @Column(length = 128, nullable = false)
    private String form;

    @Column(nullable = false, length = 128)
    private String lemma;

    public DictionaryWordForm() {}

    public DictionaryWordForm(String form, String lemma) {
        this.form = form;
        this.lemma = lemma;
    }

    public String getForm() { return form; }
    public void setForm(String form) { this.form = form; }

    public String getLemma() { return lemma; }
    public void setLemma(String lemma) { this.lemma = lemma; }
}
