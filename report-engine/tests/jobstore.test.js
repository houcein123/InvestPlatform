// ============================================================================
// Suivi des générations — anti-doublon par achat.
// ----------------------------------------------------------------------------
// Ces tests fixent le garde-fou introduit après un incident réel : un défaut du
// frontend relançait la génération à chaque rendu, ce qui a déclenché une
// centaine de générations simultanées du même rapport et saturé le quota de
// rédaction au point qu'aucune section n'aboutissait.
//
// Le serveur ne doit pas dépendre de la correction du client pour s'en
// protéger : à un achat payé correspond au plus une génération en vol.
// ============================================================================

const test = require("node:test");
const assert = require("node:assert");

const jobStore = require("../src/services/jobStore");

test("un job en cours est retrouvé par son achat", () => {
    const jobId = jobStore.createJob(1, 4001);
    const trouve = jobStore.jobEnCoursPourAchat(4001);

    assert.ok(trouve, "le job en cours doit être retrouvé");
    assert.strictEqual(trouve.id, jobId);
});

test("un achat sans génération en cours ne renvoie rien", () => {
    assert.strictEqual(jobStore.jobEnCoursPourAchat(4002), null);
});

test("l'identifiant d'achat est comparé par valeur, pas par type", () => {
    jobStore.createJob(2, 4003);

    // Le backend transmet un entier, une requête HTTP peut livrer une chaîne :
    // une comparaison stricte laisserait passer un doublon.
    assert.ok(jobStore.jobEnCoursPourAchat("4003"), "une chaîne doit correspondre");
});

test("un job terminé libère son achat", () => {
    const jobId = jobStore.createJob(3, 4004);
    assert.ok(jobStore.jobEnCoursPourAchat(4004));

    jobStore.updateJob(jobId, { statut: "termine", progression: 100 });

    // Une relance après livraison est légitime — c'est le bouton « Relancer »
    // de l'espace client, qui doit rester disponible.
    assert.strictEqual(jobStore.jobEnCoursPourAchat(4004), null);
});

test("un job en erreur libère aussi son achat", () => {
    const jobId = jobStore.createJob(4, 4005);
    jobStore.updateJob(jobId, { statut: "erreur", erreur: "panne simulée" });

    assert.strictEqual(
        jobStore.jobEnCoursPourAchat(4005),
        null,
        "un échec ne doit pas condamner l'achat à ne jamais être régénéré"
    );
});

test("un achat absent ou nul n'ouvre pas de correspondance", () => {
    // Un achat à l'acte sans compte peut arriver sans identifiant : deux
    // générations anonymes ne doivent pas se bloquer mutuellement.
    jobStore.createJob(5, null);

    assert.strictEqual(jobStore.jobEnCoursPourAchat(null), null);
    assert.strictEqual(jobStore.jobEnCoursPourAchat(undefined), null);
});

test("le compteur ne retient que les générations réellement en vol", () => {
    const avant = jobStore.compterEnCours();

    const a = jobStore.createJob(6, 4006);
    const b = jobStore.createJob(6, 4007);
    assert.strictEqual(jobStore.compterEnCours(), avant + 2);

    jobStore.updateJob(a, { statut: "termine" });
    jobStore.updateJob(b, { statut: "erreur" });
    assert.strictEqual(jobStore.compterEnCours(), avant);
});
