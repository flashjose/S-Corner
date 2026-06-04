package com.scorner.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "dictionary_entry", indexes = {
    @Index(name = "uk_dictionary_word", columnList = "word", unique = true)
})
public class DictionaryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 128)
    private String word;

    @Column(length = 256)
    private String phonetic;

    @Column(length = 64)
    private String pos;

    @Column(columnDefinition = "TEXT")
    private String definition;

    @Column(columnDefinition = "TEXT")
    private String translation;

    @Column(length = 512)
    private String exchange;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getWord() { return word; }
    public void setWord(String word) { this.word = word; }

    public String getPhonetic() { return phonetic; }
    public void setPhonetic(String phonetic) { this.phonetic = phonetic; }

    public String getPos() { return pos; }
    public void setPos(String pos) { this.pos = pos; }

    public String getDefinition() { return definition; }
    public void setDefinition(String definition) { this.definition = definition; }

    public String getTranslation() { return translation; }
    public void setTranslation(String translation) { this.translation = translation; }

    public String getExchange() { return exchange; }
    public void setExchange(String exchange) { this.exchange = exchange; }
}
