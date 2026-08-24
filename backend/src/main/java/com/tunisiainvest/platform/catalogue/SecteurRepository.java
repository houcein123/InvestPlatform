package com.tunisiainvest.platform.catalogue;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SecteurRepository extends JpaRepository<Secteur, Long> {

    /** Les secteurs actifs, pour le catalogue public. */
    List<Secteur> findByEstActifTrueOrderById();

    /** Tous les secteurs, y compris désactivés (panneau de contrôle). */
    List<Secteur> findAllByOrderById();

    Optional<Secteur> findBySlug(String slug);
}
