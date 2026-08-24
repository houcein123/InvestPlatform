package com.tunisiainvest.platform.sectordata;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StatistiqueRepository extends JpaRepository<DonneeStatistique, Long> {
    List<DonneeStatistique> findBySecteurIdOrderByIndicateur(Long secteurId);
}