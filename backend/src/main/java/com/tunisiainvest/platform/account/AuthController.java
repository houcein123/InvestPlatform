package com.tunisiainvest.platform.account;

import java.time.Duration;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tunisiainvest.platform.account.dto.AuthRequests;
import com.tunisiainvest.platform.account.dto.CompteDto;
import com.tunisiainvest.platform.common.RateLimiter;
import com.tunisiainvest.platform.security.CompteCourant;
import com.tunisiainvest.platform.security.JwtService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Authentification — /api/auth
 *
 * Un seul formulaire de connexion pour tout le monde. L'inscription publique
 * ne crée que des comptes client ; le rôle renvoyé à la connexion indique au
 * frontend s'il doit ouvrir le catalogue ou le panneau de contrôle.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Comptes", description = "Inscription, connexion, profil")
public class AuthController {

    private final AccountService comptes;
    private final JwtService jwtService;
    private final RateLimiter limiteur;

    public AuthController(AccountService comptes, JwtService jwtService, RateLimiter limiteur) {
        this.comptes = comptes;
        this.jwtService = jwtService;
        this.limiteur = limiteur;
    }

    @PostMapping("/register")
    @Operation(summary = "Inscription publique (crée toujours un compte client)")
    public ResponseEntity<Map<String, Object>> inscrire(@RequestBody AuthRequests.Inscription demande,
                                                        HttpServletRequest requete) {
        limiteur.verifier("register:" + adresse(requete), 5, Duration.ofHours(1),
                "Trop de comptes créés depuis cette adresse. Réessayez plus tard.");

        Utilisateur compte = comptes.inscrire(demande);

        // Connexion immédiate : demander de ressaisir ses identifiants juste
        // après les avoir choisis n'apporte rien.
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "token", jwtService.emettre(compte),
                "compte", CompteDto.de(compte)));
    }

    @PostMapping("/login")
    @Operation(summary = "Connexion — identique pour un client et un administrateur")
    public Map<String, Object> connecter(@RequestBody AuthRequests.Connexion demande,
                                         HttpServletRequest requete) {
        limiteur.verifier("login:" + adresse(requete), 10, Duration.ofMinutes(15),
                "Trop de tentatives de connexion. Réessayez dans quelques minutes.");

        Utilisateur compte = comptes.connecter(demande.email(), demande.motDePasse());
        return Map.of(
                "token", jwtService.emettre(compte),
                "compte", CompteDto.de(compte));
    }

    @GetMapping("/me")
    @Operation(summary = "Compte courant — revalide un jeton au chargement du frontend")
    public Map<String, Object> moi() {
        return Map.of("compte", CompteDto.de(CompteCourant.exige()));
    }

    @PutMapping("/profil")
    @Operation(summary = "Mise à jour du profil par son titulaire")
    public Map<String, Object> mettreAJourProfil(@RequestBody AuthRequests.MiseAJourProfil demande) {
        Utilisateur compte = comptes.mettreAJourProfil(CompteCourant.exige().getId(), demande);
        return Map.of("compte", CompteDto.de(compte));
    }

    @PutMapping("/mot-de-passe")
    @Operation(summary = "Changement de mot de passe — l'actuel est exigé")
    public Map<String, Object> changerMotDePasse(@RequestBody AuthRequests.ChangementMotDePasse demande,
                                                 HttpServletRequest requete) {
        // Le changement exige le mot de passe actuel : c'est un point d'essai
        // systématique au même titre que la connexion.
        limiteur.verifier("motdepasse:" + adresse(requete), 10, Duration.ofMinutes(15),
                "Trop de tentatives. Réessayez dans quelques minutes.");

        comptes.changerMotDePasse(CompteCourant.exige().getId(), demande);
        return Map.of("success", true, "message", "Mot de passe mis à jour");
    }

    private static String adresse(HttpServletRequest requete) {
        String transmise = requete.getHeader("X-Forwarded-For");
        if (transmise != null && !transmise.isBlank()) {
            return transmise.split(",")[0].trim();
        }
        return requete.getRemoteAddr();
    }
}
