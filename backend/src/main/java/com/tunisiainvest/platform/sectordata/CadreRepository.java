package com.tunisiainvest.platform.sectordata;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CadreRepository extends JpaRepository<CadreReglementaire, Long> {
    List<CadreReglementaire> findBySecteurIdAndEstEnVigueurTrueOrderByAnneeDesc(Long secteurId);
}