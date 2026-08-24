// ============================================================================
// Projections statistiques — le calcul le plus délicat du projet.
// ----------------------------------------------------------------------------
// Ces valeurs sont publiées dans un rapport payant : une erreur de modèle s'y
// verrait immédiatement. Les fonctions sont pures, elles se testent donc sans
// base de données ni réseau (`node --test`).
// ============================================================================

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    regressionLineaire,
    projeterSerie,
    R2_MINIMAL,
    METHODES,
} = require("../src/services/projectionService");

/** Construit une ligne de donnees_statistiques à partir de valeurs annuelles. */
function ligne(valeurs, extra = {}) {
    return {
        valeur_2020: valeurs[0] ?? null,
        valeur_2021: valeurs[1] ?? null,
        valeur_2022: valeurs[2] ?? null,
        valeur_2023: valeurs[3] ?? null,
        valeur_2024: valeurs[4] ?? null,
        ...extra,
    };
}

test("la régression retrouve exactement une droite parfaite", () => {
    const points = [
        { x: 2020, y: 100 }, { x: 2021, y: 110 },
        { x: 2022, y: 120 }, { x: 2023, y: 130 },
    ];
    const modele = regressionLineaire(points);

    assert.ok(Math.abs(modele.pente - 10) < 1e-9, "pente attendue de 10 par an");
    assert.equal(modele.r2, 1, "un alignement parfait doit donner un R² de 1");
    assert.ok(Math.abs(modele.predire(2024) - 140) < 1e-9);
});

test("une série constante ne produit pas de division par zéro", () => {
    const modele = regressionLineaire([
        { x: 2020, y: 50 }, { x: 2021, y: 50 }, { x: 2022, y: 50 },
    ]);
    assert.ok(Math.abs(modele.pente) < 1e-9);
    assert.equal(modele.r2, 1);
});

test("une série croissante régulière est projetée jusqu'en 2028", () => {
    const resultat = projeterSerie(ligne([100, 110, 120, 130, 140]));

    assert.ok(resultat, "un historique de 5 points doit produire une projection");
    assert.equal(resultat.projections[2025], 150);
    assert.equal(resultat.projections[2028], 180);
    assert.ok(resultat.r2 >= R2_MINIMAL);
});

test("2024 n'est PAS estimée quand la valeur réelle existe", () => {
    const resultat = projeterSerie(ligne([100, 110, 120, 130, 137]));
    assert.equal(
        resultat.projections[2024], null,
        "une valeur publiée ne doit jamais être remplacée par une estimation"
    );
});

test("2024 est estimée quand la valeur réelle manque", () => {
    const resultat = projeterSerie(ligne([100, 110, 120, 130, null]));
    assert.ok(resultat.projections[2024] > 130, "l'année manquante doit être comblée");
});

test("une série d'un seul point ne donne aucune projection", () => {
    assert.equal(
        projeterSerie(ligne([100, null, null, null, null])), null,
        "mieux vaut une case vide qu'un chiffre inventé"
    );
});

test("une série vide ne donne aucune projection", () => {
    assert.equal(projeterSerie(ligne([])), null);
});

test("deux points suffisent, mais la méthode est signalée comme fruste", () => {
    const resultat = projeterSerie(ligne([100, 120, null, null, null]));
    assert.equal(resultat.methode, METHODES.COURTE);
    assert.equal(resultat.r2, null, "un R² sur deux points n'aurait aucun sens");
});

test("une série erratique est rejetée faute d'ajustement suffisant", () => {
    // Valeurs sans tendance : aucun modèle ne doit atteindre le seuil de qualité.
    const resultat = projeterSerie(ligne([100, 5, 300, 12, 250]));
    assert.equal(resultat, null);
});

test("une série positive ne bascule jamais en négatif", () => {
    // Décroissance forte : prolongée telle quelle, la droite passerait sous zéro.
    const resultat = projeterSerie(ligne([100, 80, 60, 40, 20]));
    assert.ok(resultat, "la tendance est nette, elle doit être projetée");
    for (const annee of [2025, 2026, 2027, 2028]) {
        assert.ok(
            resultat.projections[annee] >= 0,
            `${annee} ne doit pas être négatif (obtenu ${resultat.projections[annee]})`
        );
    }
});

test("une croissance exponentielle reste bornée", () => {
    const resultat = projeterSerie(ligne([10, 30, 90, 270, 810]));
    const plafond = 810 * 3;
    for (const annee of [2025, 2026, 2027, 2028]) {
        assert.ok(
            resultat.projections[annee] <= plafond,
            `${annee} dépasse le plafond de sécurité (obtenu ${resultat.projections[annee]})`
        );
    }
});
