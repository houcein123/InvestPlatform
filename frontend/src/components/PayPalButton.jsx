import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

/**
 * Bouton de paiement PayPal (API Orders v2).
 *
 * Le SDK est chargé une seule fois par page, avec l'identifiant client, la
 * devise et la langue fournis par le backend — aucune configuration PayPal
 * n'est écrite en dur dans le frontend.
 *
 * Le montant n'est jamais transmis depuis le navigateur : la commande est
 * créée côté serveur à partir du tarif du catalogue, et le serveur revérifie
 * le montant réellement encaissé avant de débloquer le rapport.
 *
 * DEUX PIÈGES, tous deux rencontrés en conditions réelles :
 *
 * 1. Démontage. `render()` injecte des iframes dans le conteneur. Si l'effet
 *    se rejoue (identité de `config` modifiée, double montage de React en
 *    développement) sans détruire l'instance précédente, un SECOND jeu de
 *    boutons vient s'empiler. Le nettoyage ferme donc l'instance et vide le
 *    conteneur.
 *
 * 2. Remontée des erreurs. Le SDK n'appelle pas `onError` de façon fiable
 *    quand `createOrder` échoue ou quand la fenêtre est bloquée. Sans les
 *    try/catch explicites, un clic ne produit rien à l'écran, ce qui est
 *    indiscernable d'un bouton mort.
 */

let chargementSdk = null;

function chargerSdk({ clientId, devise, locale }) {
    if (chargementSdk) return chargementSdk;

    chargementSdk = new Promise((resolve, reject) => {
        if (window.paypal) {
            resolve(window.paypal);
            return;
        }
        const script = document.createElement('script');
        // `locale` évite que PayPal déduise la langue de l'adresse IP.
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}`
            + `&currency=${encodeURIComponent(devise)}&intent=capture`
            + `&locale=${encodeURIComponent(locale || 'fr_FR')}`;
        script.async = true;
        script.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error('SDK PayPal indisponible')));
        script.onerror = () => {
            chargementSdk = null;
            reject(new Error("Impossible de charger PayPal. Vérifiez votre connexion ou un éventuel bloqueur de publicités."));
        };
        document.head.appendChild(script);
    });

    return chargementSdk;
}

/** Traduit les échecs les plus fréquents en consigne actionnable. */
function messageLisible(err) {
    const brut = err?.message || String(err || '');

    if (/popup|window|blocked|closed/i.test(brut)) {
        return "La fenêtre PayPal n'a pas pu s'ouvrir. Autorisez les fenêtres surgissantes "
            + 'pour ce site, puis réessayez.';
    }
    if (/Connexion requise|401/i.test(brut)) {
        return 'Votre session a expiré. Reconnectez-vous puis relancez le paiement.';
    }
    return brut || 'Le paiement a échoué.';
}

export default function PayPalButton({ config, sectorId, onPaiementConfirme, onErreur, desactive }) {
    const conteneur = useRef(null);
    const [pret, setPret] = useState(false);
    const [erreurSdk, setErreurSdk] = useState('');

    // L'identifiant d'achat vit dans une référence et non dans un attribut
    // `data-` du DOM : le nœud peut être remplacé par un rendu React entre la
    // création de la commande et son encaissement.
    const achatId = useRef(null);

    // Les callbacks sont lus via une référence : le bouton PayPal est monté une
    // seule fois, il ne doit pas capturer une version périmée des fonctions.
    const rappels = useRef({ onPaiementConfirme, onErreur, sectorId });
    rappels.current = { onPaiementConfirme, onErreur, sectorId };

    useEffect(() => {
        if (!config?.configure) return undefined;
        const noeud = conteneur.current;
        if (!noeud) return undefined;

        let annule = false;
        let instance = null;

        /** Détruit l'instance et vide le conteneur : aucun bouton résiduel. */
        const detruire = () => {
            try {
                instance?.close();
            } catch {
                // close() peut lever si le rendu n'a jamais abouti : sans effet ici.
            }
            noeud.innerHTML = '';
        };

        chargerSdk({
            clientId: config.clientId,
            devise: config.devisePaiement,
            locale: config.locale,
        })
            .then((paypal) => {
                if (annule) return undefined;

                instance = paypal.Buttons({
                    // Un seul moyen de paiement : le compte PayPal.
                    // Sans cette restriction, le SDK ajoute un bouton « Carte
                    // bancaire » qui ouvre le paiement invité — un parcours
                    // différent, sur lequel `landing_page: LOGIN` n'a aucun
                    // effet, et qui prête à confusion.
                    fundingSource: paypal.FUNDING.PAYPAL,
                    style: { height: 44, tagline: false, label: 'pay' },

                    // 1. Le serveur crée l'achat puis la commande PayPal.
                    createOrder: async () => {
                        try {
                            const commande = await api.createOrder(rappels.current.sectorId);
                            achatId.current = commande.achatId;
                            return commande.orderId;
                        } catch (err) {
                            rappels.current.onErreur(messageLisible(err));
                            throw err;
                        }
                    },

                    // 2. L'acheteur a approuvé : on encaisse côté serveur.
                    onApprove: async (data) => {
                        try {
                            const resultat = await api.capturePayment(data.orderID, achatId.current);
                            rappels.current.onPaiementConfirme({ ...resultat, achatId: achatId.current });
                        } catch (err) {
                            rappels.current.onErreur(messageLisible(err));
                        }
                    },

                    onError: (err) => rappels.current.onErreur(messageLisible(err)),

                    onCancel: () => rappels.current.onErreur(
                        "Paiement annulé — aucun montant n'a été débité."
                    ),
                });

                if (!instance.isEligible()) {
                    setErreurSdk("Le paiement PayPal n'est pas disponible depuis ce navigateur.");
                    return undefined;
                }

                return instance.render(noeud).then(() => {
                    // Le démontage a pu survenir pendant le rendu : on nettoie
                    // alors immédiatement, sinon des boutons orphelins subsistent.
                    if (annule) detruire();
                    else setPret(true);
                });
            })
            .catch((err) => !annule && setErreurSdk(messageLisible(err)));

        return () => {
            annule = true;
            detruire();
        };
    }, [config]);

    if (!config) return <p className="muted">Chargement du paiement…</p>;

    if (!config.configure) {
        return <p className="alert alert--error">Paiement indisponible : PayPal n'est pas configuré côté serveur.</p>;
    }

    return (
        <div className="paypal">
            {erreurSdk && <p className="alert alert--error">{erreurSdk}</p>}
            {!pret && !erreurSdk && <p className="muted">Chargement de PayPal…</p>}
            <div ref={conteneur} className={desactive ? 'paypal__zone paypal__zone--inactive' : 'paypal__zone'} />

            {/* En bac à sable, le paiement n'aboutit qu'avec un compte acheteur
                de TEST : le compte PayPal réel de l'utilisateur est rejeté. */}
            {pret && !config.argentReel && (
                <p className="paypal__aide">
                    Environnement de test : connectez-vous avec un
                    <strong> compte acheteur sandbox</strong> (developer.paypal.com →
                    Testing Tools → Sandbox accounts). Votre compte PayPal réel n'existe
                    pas dans cet environnement et sera refusé.
                </p>
            )}
        </div>
    );
}
