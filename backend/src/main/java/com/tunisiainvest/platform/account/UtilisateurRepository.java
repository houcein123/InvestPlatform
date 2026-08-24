package com.tunisiainvest.platform.account;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    Optional<Utilisateur> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<Utilisateur> findAllByOrderByCreatedAtDesc();

    /** Sert à empêcher la plateforme de se retrouver sans administrateur. */
    @Query("select count(u) from Utilisateur u where u.role = 'admin' and u.estActif = true")
    long compterAdminsActifs();
}
