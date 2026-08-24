package com.tunisiainvest.platform.sales;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    List<Paiement> findByAchatId(Long achatId);

    /** Sert au webhook : un événement rejoué ne doit pas créer un doublon. */
    Optional<Paiement> findByPaypalCaptureId(String paypalCaptureId);

    boolean existsByPaypalOrderIdAndStatut(String paypalOrderId, String statut);
}
