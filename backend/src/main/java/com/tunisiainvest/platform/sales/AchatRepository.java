package com.tunisiainvest.platform.sales;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AchatRepository extends JpaRepository<Achat, Long> {

    List<Achat> findByIdUtilisateurAndStatutPaiementOrderByDateAchatDesc(Long idUtilisateur, String statut);

    Optional<Achat> findByIdAndIdUtilisateur(Long id, Long idUtilisateur);

    /**
     * Marque l'achat payé en une seule instruction conditionnelle.
     *
     * La clause `statut_paiement = 'en_attente'` rend l'opération idempotente :
     * rejouer une capture ne produit pas un second encaissement, et deux
     * requêtes concurrentes ne peuvent pas toutes les deux « gagner ».
     *
     * @return 1 si l'achat vient d'être marqué payé, 0 s'il l'était déjà
     */
    @Modifying
    @Query("update Achat a set a.statutPaiement = 'paye' "
            + "where a.id = :id and a.statutPaiement = 'en_attente'")
    int marquerPaye(@Param("id") Long id);

    @Modifying
    @Query("update Achat a set a.pdfGenere = :chemin where a.id = :id")
    int enregistrerPdf(@Param("id") Long id, @Param("chemin") String chemin);
}
