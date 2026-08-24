package com.tunisiainvest.platform.sectordata;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BenchmarkRepository extends JpaRepository<BenchmarkRegional, Long> {
    List<BenchmarkRegional> findBySecteurIdOrderByIndicateur(Long secteurId);
}