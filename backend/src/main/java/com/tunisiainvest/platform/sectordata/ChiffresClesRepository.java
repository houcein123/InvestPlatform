package com.tunisiainvest.platform.sectordata;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ChiffresClesRepository extends JpaRepository<ChiffresCles, Long> {
    Optional<ChiffresCles> findBySecteurId(Long secteurId);
}