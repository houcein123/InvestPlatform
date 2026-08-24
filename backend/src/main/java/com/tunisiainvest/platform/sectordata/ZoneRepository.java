package com.tunisiainvest.platform.sectordata;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ZoneRepository extends JpaRepository<ZoneGeographique, Long> {
    List<ZoneGeographique> findBySecteurIdAndEstActifTrueOrderByNom(Long secteurId);
}