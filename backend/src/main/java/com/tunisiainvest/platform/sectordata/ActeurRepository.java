package com.tunisiainvest.platform.sectordata;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ActeurRepository extends JpaRepository<ActeurPrincipal, Long> {
    List<ActeurPrincipal> findBySecteurIdOrderByNom(Long secteurId);
}