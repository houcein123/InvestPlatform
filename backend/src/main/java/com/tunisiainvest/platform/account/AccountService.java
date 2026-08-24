package com.tunisiainvest.platform.account;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tunisiainvest.platform.account.dto.AuthRequests;
import com.tunisiainvest.platform.common.ApiException;

/**
 * Comptes — clients et administrateurs partagent la table `utilisateurs`.
 *
 * Le rôle est une donnée en base, pas un parcours d'inscription séparé :
 * l'inscription publique crée toujours un client, et promouvoir quelqu'un
 * administrateur est une opération d'administration, jamais une action publique.
 */
@Service
public class AccountService {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+[.][^\\s@]+$");
    private static final int LONGUEUR_MIN_MOT_DE_PASSE = 8;

    private final UtilisateurRepository comptes;
    private final PasswordEncoder encodeur;

    public AccountService(UtilisateurRepository comptes, PasswordEncoder encodeur) {
        this.comptes = comptes;
        this.encodeur = encodeur;
    }

    @Transactional
    public Utilisateur inscrire(AuthRequests.Inscription demande) {
        if (estVide(demande.email()) || estVide(demande.motDePasse())
                || estVide(demande.nom()) || estVide(demande.prenom())) {
            throw ApiException.badRequest("Email, mot de passe, nom et prénom sont requis");
        }
        if (!EMAIL.matcher(demande.email()).matches()) {
            throw ApiException.badRequest("Adresse email invalide");
        }
        verifierLongueurMotDePasse(demande.motDePasse());
        if (comptes.existsByEmailIgnoreCase(demande.email().trim())) {
            throw ApiException.conflict("Un compte existe déjà avec cet email");
        }

        LocalDateTime maintenant = LocalDateTime.now();
        Utilisateur compte = Utilisateur.builder()
                .email(demande.email().trim())
                .motDePasse(encodeur.encode(demande.motDePasse()))
                .nom(demande.nom())
                .prenom(demande.prenom())
                .entreprise(videEnNull(demande.entreprise()))
                .pays(videEnNull(demande.pays()))
                .telephone(videEnNull(demande.telephone()))
                // Le rôle demandé dans la requête est ignoré : l'inscription
                // publique ne peut créer qu'un client.
                .role(Utilisateur.ROLE_CLIENT)
                .estActif(true)
                .estVerifie(false)
                .createdAt(maintenant)
                .updatedAt(maintenant)
                .build();

        return comptes.save(compte);
    }

    @Transactional
    public Utilisateur connecter(String email, String motDePasse) {
        if (estVide(email) || estVide(motDePasse)) {
            throw ApiException.badRequest("Email et mot de passe requis");
        }

        // Message identique que l'email existe ou non : ne pas révéler quels
        // comptes sont enregistrés.
        Utilisateur compte = comptes.findByEmailIgnoreCase(email)
                .orElseThrow(() -> ApiException.unauthorized("Email ou mot de passe incorrect"));

        if (Boolean.FALSE.equals(compte.getEstActif())) {
            throw ApiException.forbidden("Compte désactivé");
        }
        if (!encodeur.matches(motDePasse, compte.getMotDePasse())) {
            throw ApiException.unauthorized("Email ou mot de passe incorrect");
        }

        compte.setDerniereConnexion(LocalDateTime.now());
        return comptes.save(compte);
    }

    @Transactional
    public Utilisateur mettreAJourProfil(Long idCompte, AuthRequests.MiseAJourProfil demande) {
        Utilisateur compte = charger(idCompte);
        if (demande.nom() != null) compte.setNom(demande.nom());
        if (demande.prenom() != null) compte.setPrenom(demande.prenom());
        if (demande.entreprise() != null) compte.setEntreprise(videEnNull(demande.entreprise()));
        if (demande.pays() != null) compte.setPays(videEnNull(demande.pays()));
        if (demande.telephone() != null) compte.setTelephone(videEnNull(demande.telephone()));
        compte.setUpdatedAt(LocalDateTime.now());
        return comptes.save(compte);
    }

    @Transactional
    public void changerMotDePasse(Long idCompte, AuthRequests.ChangementMotDePasse demande) {
        if (estVide(demande.motDePasseActuel()) || estVide(demande.nouveauMotDePasse())) {
            throw ApiException.badRequest("Mot de passe actuel et nouveau mot de passe requis");
        }
        verifierLongueurMotDePasse(demande.nouveauMotDePasse());

        Utilisateur compte = charger(idCompte);
        if (!encodeur.matches(demande.motDePasseActuel(), compte.getMotDePasse())) {
            throw ApiException.unauthorized("Mot de passe actuel incorrect");
        }

        compte.setMotDePasse(encodeur.encode(demande.nouveauMotDePasse()));
        compte.setUpdatedAt(LocalDateTime.now());
        comptes.save(compte);
    }

    public List<Utilisateur> lister() {
        return comptes.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Change le rôle d'un compte.
     *
     * Deux garde-fous : personne ne retire son propre rôle, et le dernier
     * administrateur actif ne peut pas être rétrogradé. Sans eux, la plateforme
     * peut se retrouver sans aucun accès au panneau de contrôle.
     */
    @Transactional
    public Utilisateur changerRole(Long idCible, String nouveauRole, Long idDemandeur) {
        if (!Utilisateur.ROLE_CLIENT.equals(nouveauRole) && !Utilisateur.ROLE_ADMIN.equals(nouveauRole)) {
            throw ApiException.badRequest("Rôle invalide : attendu client ou admin");
        }
        if (idCible.equals(idDemandeur) && Utilisateur.ROLE_CLIENT.equals(nouveauRole)) {
            throw ApiException.badRequest("Vous ne pouvez pas retirer votre propre rôle d'administrateur");
        }

        Utilisateur cible = charger(idCible);
        boolean retrogradation = cible.estAdmin() && Utilisateur.ROLE_CLIENT.equals(nouveauRole);
        if (retrogradation && comptes.compterAdminsActifs() <= 1) {
            throw ApiException.conflict("Impossible de rétrograder le dernier administrateur actif");
        }

        cible.setRole(nouveauRole);
        cible.setUpdatedAt(LocalDateTime.now());
        return comptes.save(cible);
    }

    public Utilisateur charger(Long id) {
        return comptes.findById(id).orElseThrow(() -> ApiException.notFound("Compte introuvable"));
    }

    private void verifierLongueurMotDePasse(String motDePasse) {
        if (motDePasse == null || motDePasse.length() < LONGUEUR_MIN_MOT_DE_PASSE) {
            throw ApiException.badRequest(
                    "Le mot de passe doit contenir au moins " + LONGUEUR_MIN_MOT_DE_PASSE + " caractères");
        }
    }

    private static boolean estVide(String valeur) {
        return valeur == null || valeur.isBlank();
    }

    private static String videEnNull(String valeur) {
        return (valeur == null || valeur.isBlank()) ? null : valeur;
    }
}
