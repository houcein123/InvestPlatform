package com.tunisiainvest.platform.config;

import java.util.List;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.tunisiainvest.platform.security.JwtAuthenticationFilter;

/**
 * Politique d'accès de l'API.
 *
 * Trois niveaux seulement, et ils suivent le parcours du service :
 *   • public        — catalogue, aperçu gratuit, création et encaissement d'une
 *                     commande (l'achat à l'acte ne demande pas de compte) ;
 *   • authentifié   — espace client, profil, parcours d'achat ;
 *   • administrateur— panneau de contrôle.
 *
 * Sur les routes publiques du parcours d'achat, le filtre JWT renseigne quand
 * même le compte s'il existe : c'est ce qui rattache l'achat à un client
 * connecté sans jamais l'exiger.
 */
@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(AppProperties.class)
public class SecurityConfig {

    private final AppProperties properties;

    public SecurityConfig(AppProperties properties) {
        this.properties = properties;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
        http
            // API sans session ni formulaire : la protection CSRF par jeton de
            // session n'a pas d'objet, et l'authentification passe uniquement
            // par un en-tête Authorization que le navigateur n'ajoute jamais seul.
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // ── Public ──
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/catalogue/**").permitAll()
                // L'analyse comparative est publique : un investisseur doit
                // pouvoir juger la valeur du service avant de creer un compte.
                .requestMatchers(HttpMethod.GET, "/api/analyse/**").permitAll()
                .requestMatchers("/api/payment/config").permitAll()
                // Le webhook est appelé par PayPal, pas par un navigateur : il
                // s'authentifie par sa signature, vérifiée dans le contrôleur.
                .requestMatchers(HttpMethod.POST, "/api/payment/webhook").permitAll()
                // Commander EXIGE un compte : la commande doit être rattachée à
                // un titulaire pour que le rapport lui reste accessible, et une
                // garde posée seulement dans le navigateur n'en est pas une.
                // L'aperçu gratuit, lui, reste ouvert à tous (voir /api/catalogue).
                .requestMatchers(HttpMethod.GET, "/api/report/status/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()

                // ── Panneau de contrôle ──
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // ── Tout le reste exige un compte ──
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, error) -> {
                    response.setStatus(401);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\":\"Connexion requise\"}");
                })
                .accessDeniedHandler((request, response, error) -> {
                    response.setStatus(403);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\":\"Accès réservé aux administrateurs\"}");
                })
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(properties.getCors().getOrigins());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
