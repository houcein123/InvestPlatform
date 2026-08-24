package com.tunisiainvest.platform.config;

import java.io.IOException;
import java.nio.channels.Selector;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Configuration;

/**
 * Choix du connecteur HTTP de Tomcat.
 *
 * POURQUOI CETTE CLASSE EXISTE
 * ---------------------------------------------------------------------------
 * Le connecteur NIO par defaut ouvre un {@link Selector}. Sous Windows, un
 * Selector a besoin d'une paire de sockets en boucle locale que la JVM etablit
 * via AF_UNIX. Sur certains postes, ce `connect` AF_UNIX echoue — le pilote
 * repond « Invalid argument » — et Tomcat ne demarre pas du tout :
 *
 *     java.io.IOException: Unable to establish loopback connection
 *         at sun.nio.ch.PipeImpl$Initializer.init
 *
 * La JVM ne bascule sur TCP que si le `bind` echoue ; quand c'est le `connect`
 * qui echoue, aucun repli n'a lieu et aucun reglage JVM ne change cela (les
 * deux selecteurs Windows passent par le meme code).
 *
 * Le connecteur NIO2 n'utilise pas de Selector : il s'appuie sur les ports
 * d'achevement d'entrees-sorties de Windows. Il demarre donc la ou NIO echoue.
 *
 * PAR DEFAUT (`auto`), on teste l'ouverture d'un Selector au demarrage et on
 * ne bascule que si elle echoue, en journalisant la cause. Le poste concerne
 * garde ainsi un service fonctionnel, sans masquer le probleme systeme
 * sous-jacent — qui se corrige par `netsh winsock reset` puis un redemarrage.
 */
@Configuration
public class TomcatConnecteurConfig implements WebServerFactoryCustomizer<TomcatServletWebServerFactory> {

    private static final Logger log = LoggerFactory.getLogger(TomcatConnecteurConfig.class);

    private static final String PROTOCOLE_NIO = "org.apache.coyote.http11.Http11NioProtocol";
    private static final String PROTOCOLE_NIO2 = "org.apache.coyote.http11.Http11Nio2Protocol";

    /** « auto » (defaut), « nio », « nio2 », ou un nom de classe complet. */
    @Value("${app.tomcat.protocole:auto}")
    private String protocole;

    @Override
    public void customize(TomcatServletWebServerFactory fabrique) {
        String choisi = resoudre();
        if (choisi == null) {
            return; // NIO par defaut : rien a forcer.
        }
        fabrique.setProtocol(choisi);
    }

    /** @return le protocole a imposer, ou null pour laisser le defaut de Tomcat. */
    private String resoudre() {
        return switch (protocole.toLowerCase()) {
            case "auto" -> selectorDisponible() ? null : basculerVersNio2();
            case "nio" -> PROTOCOLE_NIO;
            case "nio2" -> PROTOCOLE_NIO2;
            default -> protocole;
        };
    }

    private String basculerVersNio2() {
        log.warn("""
                Le connecteur NIO est indisponible sur ce poste : l'ouverture d'un Selector echoue \
                (boucle locale AF_UNIX refusee par le systeme). Bascule automatique sur NIO2.
                  -> Le service fonctionne normalement.
                  -> Cause systeme, hors application. Correctif : ouvrir une invite de commandes \
                administrateur, executer « netsh winsock reset », puis redemarrer le poste.
                  -> Pour figer ce choix sans detection, definir app.tomcat.protocole=nio2.""");
        return PROTOCOLE_NIO2;
    }

    /**
     * Ouvre puis referme un Selector pour verifier que le systeme le permet.
     * Le cout est negligeable et n'a lieu qu'une fois, au demarrage.
     */
    private static boolean selectorDisponible() {
        try (Selector sonde = Selector.open()) {
            return sonde.isOpen();
        } catch (IOException | RuntimeException echec) {
            log.debug("Selector.open() a echoue", echec);
            return false;
        }
    }
}
