package com.scorner.repository;

import com.scorner.entity.RssFeed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RssFeedRepository extends JpaRepository<RssFeed, String> {

    List<RssFeed> findByIsActiveTrue();

    Optional<RssFeed> findByUrl(String url);
}
