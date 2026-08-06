import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

/**
 * Bouton de paiement PayPal (API Orders v2).
 *
 * Le SDK est chargé une seule fois par page, avec l'identifiant client et la
 * devise fournis par le backend — aucune donnée de configuration PayPal n'est
 * écrite en dur dans le frontend.
 *
 * Le montant n'est jamais transmis depuis le navigateur : la commande est
 * créée côté serveur à partir du tarif du catalogue, et le serveur revérifie
 * le montant réellement encaissé avant de débloquer le rapport.
 */

let chargementSdk = null;

function chargerSdk({ clientId, devise }) {
    if (chargementSdk) return chargementSdk;

    chargementSdk = new Promise((resolve, reject) => {
        if (window.paypal) {
            resolve(window.paypal);
            return;
        }
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}`
            + `&currency=${encodeURIComponent(devise)}&intent=capture`;
        script.async = true;
        script.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error('SDK PayPal indisponible')));
        script.onerror = () => {
            chargementSdk = null;
            reject(new Error('Impossible de charger PayPal. Vérifiez votre connexion.'));
        };
        document.head.appendChild(script);
    });

    return chargementSdk;
}

export default function PayPalButton({ config, sectorId, onPaiementConfirme, onErreur, desactive }) {
    const conteneur = useRef(null);
    const [pret, setPret] = useState(false);
    const [erreurSdk, setErreurSdk] = useState('');

    // Les callbacks sont lus via une référence : le bouton PayPal est monté une
    // seule fois, il ne doit pas capturer une version périmée des fonctions.
    const rappels = useRef({ onPaiementConfirme, onErreur, sectorId });
    rappels.current = { onPaiementConfirme, onErreur, sectorId };

    useEffect(() => {
        if (!config?.configure || !conteneur.current) return undefined;

        let annule = false;

        chargerSdk({ clientId: config.clientId, devise: config.devisePaiement })
            .then((paypal) => {
                if (annule || !conteneur.current) return;

                paypal.Buttons({
                    style: { layout: 'horizontal', height: 40, tagline: false },

                    // 1. Le serveur crée l'achat puis la commande PayPal.
                    createOrder: async () => {
                        const commande = await api.createOrder(rappels.current.sectorId);
                        conteneur.current.dataset.achatId = String(commande.achatId);
                        return commande.orderId;
                    },

                    // 2. L'acheteur a approuvé : on encaisse côté serveur.
                    onApprove: async (data) => {
                        const achatId = Number(conteneur.current?.dataset.achatId);
                        const resultat = await api.capturePayment(data.orderID, achatId);
                        rappels.current.onPaiementConfirme({ ...resultat, achatId });
                    },

                    onError: (err) => {
                        rappels.current.onErreur(err?.message || 'Le paiement a échoué.');
                    },

                    onCancel: () => {
                        rappels.current.onErreur('Paiement annulé.');
                    },
                }).render(conteneur.current).then(() => !annule && setPret(true));
            })
            .catch((err) => !annule && setErreurSdk(err.message));

        return () => { annule = true; };
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
        </div>
    );
}
