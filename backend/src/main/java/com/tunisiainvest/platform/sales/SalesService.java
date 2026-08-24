package com.tunisiainvest.platform.sales;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tunisiainvest.platform.catalogue.Secteur;
import com.tunisiainvest.platform.catalogue.SecteurRepository;
import com.tunisiainvest.platform.common.ApiException;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Achats, paiements et statistiques de vente (CDC §6 étape 2, §7).
 */
@Service
public class SalesService {

    private final AchatRepository achats;
    private final PaiementRepository paiements;
    private final SecteurRepository secteurs;

    @PersistenceContext
    private EntityManager entityManager;

    public SalesService(AchatRepository achats, PaiementRepository paiements, SecteurRepository secteurs) {
        this.achats = achats;
        this.paiements = paiements;
        this.secteurs = secteurs;
    }

    public record Commande(Achat achat, Secteur secteur) {
    }

    /** Crée un achat en attente pour un secteur actif. */
    @Transactional
    public Commande creerCommande(Long idSecteur, Long idUtilisateur, String mode) {
        Secteur secteur = secteurs.findById(idSecteur)
                .filter(s -> Boolean.TRUE.equals(s.getEstActif()))
                .orElseThrow(() -> ApiException.notFound("Secteur introuvable ou inactif"));

        Achat achat = achats.save(Achat.builder()
                .idUtilisateur(idUtilisateur)
                .idSecteur(secteur.getId())
                .montant(secteur.getPrixRapport())
                .statutPaiement(Achat.EN_ATTENTE)
                .modePaiement(mode)
                .dateAchat(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build());

        return new Commande(achat, secteur);
    }

    public Optional<Achat> trouverAchat(Long id) {
        return id == null ? Optional.empty() : achats.findById(id);
    }

    public Achat exigerAchat(Long id) {
        return trouverAchat(id).orElseThrow(() -> ApiException.notFound("Achat introuvable"));
    }

    @Transactional
    public Paiement enregistrerPaiement(Paiement paiement) {
        paiement.setDatePaiement(LocalDateTime.now());
        paiement.setCreatedAt(LocalDateTime.now());
        return paiements.save(paiement);
    }

    /**
     * @return true si l'achat vient d'être marqué payé, false s'il l'était déjà.
     *         Le second cas n'est pas une erreur : c'est une capture rejouée.
     */
    @Transactional
    public boolean marquerPaye(Long achatId) {
        int lignes = achats.marquerPaye(achatId);
        // Une entité déjà chargée porterait encore l'ancien statut après un
        // UPDATE exécuté en JPQL : on vide le contexte pour forcer la relecture.
        entityManager.flush();
        entityManager.clear();
        return lignes == 1;
    }

    /** Un encaissement déjà enregistré pour cette capture ? (webhook rejoué) */
    public boolean captureDejaEnregistree(String captureId) {
        return captureId != null && paiements.findByPaypalCaptureId(captureId).isPresent();
    }

    /** Achats payés du client, avec le dernier rapport livré pour chacun. */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listerAchatsClient(Long idUtilisateur) {
        List<Object[]> lignes = entityManager.createNativeQuery("""
                SELECT a.id, a.montant, a.date_achat, a.mode_paiement,
                       s.id, s.nom,
                       r.id, r.chemin_fichier, r.date_generation, r.nombre_pages
                  FROM achats a
                  JOIN secteurs s ON s.id = a.id_secteur
             LEFT JOIN LATERAL (
                       SELECT id, chemin_fichier, date_generation, nombre_pages
                         FROM rapports
                        WHERE secteur_id = a.id_secteur
                          AND utilisateur_id IS NOT DISTINCT FROM a.id_utilisateur
                          AND chemin_fichier IS NOT NULL
                     ORDER BY date_generation DESC
                        LIMIT 1
                  ) r ON TRUE
                 WHERE a.id_utilisateur = :idUtilisateur
                   AND a.statut_paiement = 'paye'
              ORDER BY a.date_achat DESC
                """)
                .setParameter("idUtilisateur", idUtilisateur)
                .getResultList();

        return lignes.stream().map(ligne -> {
            Map<String, Object> achat = new HashMap<>();
            achat.put("achat_id", ligne[0]);
            achat.put("montant", ligne[1]);
            achat.put("date_achat", ligne[2]);
            achat.put("mode_paiement", ligne[3]);
            achat.put("secteur_id", ligne[4]);
            achat.put("secteur", ligne[5]);
            achat.put("rapport_id", ligne[6]);
            achat.put("chemin_fichier", ligne[7]);
            achat.put("date_generation", ligne[8]);
            // Nombre de pages du document RÉELLEMENT livré, écrit par le
            // moteur à la génération : le client lit le volume qu'il a reçu,
            // et non les pages annoncées au catalogue.
            achat.put("nombre_pages", ligne[9]);
            return achat;
        }).toList();
    }

    /**
     * Statistiques de vente par secteur (CDC §7).
     *
     * Les ventes simulées sont comptées SÉPARÉMENT : les additionner au chiffre
     * d'affaires réel donnerait un tableau de bord mensonger.
     *
     * Ne jamais agréger `achats` et `rapports` dans un même GROUP BY : les deux
     * se rattachent au secteur, la jointure produit donc un produit cartésien
     * et SUM(montant) compte chaque achat autant de fois qu'il existe de
     * rapports pour ce secteur. COUNT(DISTINCT) y résiste, pas SUM. Chaque
     * table est agrégée séparément, dans sa propre sous-requête.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> statistiquesVentes() {
        List<Object[]> lignes = entityManager.createNativeQuery("""
                SELECT s.id, s.nom, s.slug, s.prix_rapport,
                       COALESCE(v.nb_ventes, 0),
                       COALESCE(v.revenu, 0),
                       COALESCE(v.nb_ventes_simulees, 0),
                       COALESCE(v.revenu_simule, 0),
                       COALESCE(rp.nb_rapports, 0)
                  FROM secteurs s
             LEFT JOIN (
                       SELECT id_secteur,
                              COUNT(*)     FILTER (WHERE mode_paiement <> 'simulation') AS nb_ventes,
                              SUM(montant) FILTER (WHERE mode_paiement <> 'simulation') AS revenu,
                              COUNT(*)     FILTER (WHERE mode_paiement =  'simulation') AS nb_ventes_simulees,
                              SUM(montant) FILTER (WHERE mode_paiement =  'simulation') AS revenu_simule
                         FROM achats
                        WHERE statut_paiement = 'paye'
                     GROUP BY id_secteur
                  ) v ON v.id_secteur = s.id
             LEFT JOIN (
                       SELECT secteur_id, COUNT(*) AS nb_rapports
                         FROM rapports
                     GROUP BY secteur_id
                  ) rp ON rp.secteur_id = s.id
              ORDER BY s.id
                """).getResultList();

        return lignes.stream().map(ligne -> {
            Map<String, Object> stat = new HashMap<>();
            stat.put("id", ligne[0]);
            stat.put("nom", ligne[1]);
            stat.put("slug", ligne[2]);
            stat.put("prix_rapport", ligne[3]);
            stat.put("nb_ventes", ligne[4]);
            stat.put("revenu", ligne[5]);
            stat.put("nb_ventes_simulees", ligne[6]);
            stat.put("revenu_simule", ligne[7]);
            stat.put("nb_rapports_generes", ligne[8]);
            return stat;
        }).toList();
    }

    /** Total réellement encaissé, ventes simulées exclues. */
    public BigDecimal chiffreAffairesReel() {
        Object total = entityManager.createNativeQuery("""
                SELECT COALESCE(SUM(montant), 0)
                  FROM achats
                 WHERE statut_paiement = 'paye'
                   AND mode_paiement <> 'simulation'
                """).getSingleResult();
        return total instanceof BigDecimal montant ? montant : BigDecimal.ZERO;
    }
}
