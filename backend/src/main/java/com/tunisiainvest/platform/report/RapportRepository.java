package com.tunisiainvest.platform.report;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RapportRepository extends JpaRepository<Rapport, Long> {

    List<Rapport> findTop50ByOrderByDateGenerationDesc();

    /**
     * Dernier rapport livrable pour un couple (secteur, titulaire).
     *
     * `utilisateur_id IS NOT DISTINCT FROM :utilisateurId` traite deux NULL
     * comme égaux : sans cela, les achats faits sans compte ne retrouveraient
     * jamais leur rapport.
     */
    @Query(value = """
            SELECT * FROM rapports
             WHERE secteur_id = :secteurId
               AND utilisateur_id IS NOT DISTINCT FROM :utilisateurId
               AND chemin_fichier IS NOT NULL
          ORDER BY date_generation DESC
             LIMIT 1
            """, nativeQuery = true)
    Optional<Rapport> dernierRapportLivre(@Param("secteurId") Long secteurId,
                                          @Param("utilisateurId") Long utilisateurId);
}
