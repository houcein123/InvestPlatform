// ============================================================================
// Construction des prompts — c'est ce qui garantit que le modèle ne rédige
// pas dans le vide, et surtout qu'il n'invente pas de chiffres étrangers.
// ============================================================================

const test = require("node:test");
const assert = require("node:assert/strict");

const { prompts, buildDataContext, buildBenchmarkContext } = require("../src/services/promptService");

const SECTEUR = { nom: "Tourisme", description: "Flux touristiques et capacité hôtelière" };

const DONNEES = {
    chiffresCles: { contribution_pib_pct: 14.2, nombre_emplois: 400000 },
    donneesStatistiques: [
        {
            indicateur: "Capacité en lits",
            unite: "Nombre",
            valeur_2022: 240000,
            valeur_2023: 245000,
            projection_2028: 268000,
        },
    ],
    zonesGeographiques: [],
    acteursPrincipaux: [],
    cadreReglementaire: [],
};

test("le contexte transmet les chiffres clés réels", () => {
    const contexte = buildDataContext(DONNEES);
    assert.match(contexte, /14\.2/, "la contribution au PIB doit être transmise");
    assert.match(contexte, /400000/, "le nombre d'emplois doit être transmis");
});

test("le contexte distingue l'observé de l'estimé", () => {
    const contexte = buildDataContext(DONNEES);
    assert.match(contexte, /observé/, "les valeurs publiées doivent être annoncées comme telles");
    assert.match(contexte, /ESTIMÉ/, "les projections doivent être étiquetées");
    assert.match(contexte, /268000/);
});

test("un secteur sans données ne fabrique pas de contexte trompeur", () => {
    const contexte = buildDataContext({
        chiffresCles: null,
        donneesStatistiques: [],
        zonesGeographiques: [],
        acteursPrincipaux: [],
        cadreReglementaire: [],
    });
    assert.ok(!/observé/.test(contexte), "aucune série ne doit être annoncée");
});

// ── Benchmarking : le point le plus sensible ───────────────────────────────

test("sans donnée comparative, le prompt le dit explicitement", () => {
    const bloc = buildBenchmarkContext([]);
    assert.match(bloc, /aucune donnée chiffrée comparative/i);
});

test("seules les lignes renseignées sont transmises au modèle", () => {
    const bloc = buildBenchmarkContext([
        { indicateur: "Arrivées", unite: "Millions", valeur_tunisie: 9.4, valeur_maroc: 14.5, valeur_egypte: null },
        { indicateur: "Recettes", unite: "Mds USD", valeur_tunisie: null, valeur_maroc: null, valeur_egypte: null },
    ]);

    assert.match(bloc, /Arrivées/, "la ligne renseignée doit être présente");
    assert.ok(!/Recettes/.test(bloc), "une ligne entièrement vide ne doit pas être transmise");
    assert.match(bloc, /non disponible/, "une valeur manquante doit être annoncée, pas omise");
});

test("le prompt de benchmarking interdit d'inventer des chiffres étrangers", () => {
    const prompt = prompts.benchmarking(SECTEUR, buildDataContext(DONNEES), []);

    assert.match(prompt, /Maroc/);
    assert.match(prompt, /Égypte/);
    assert.match(prompt, /RÈGLE ABSOLUE SUR LES CHIFFRES/);
    assert.match(prompt, /n'avance AUCUNE valeur chiffrée/);
    assert.match(
        prompt, /aucune donnée chiffrée comparative/i,
        "l'absence de comparatif doit remonter jusqu'au prompt"
    );
});

test("chaque section reçoit bien les données du secteur", () => {
    const contexte = buildDataContext(DONNEES);
    for (const [cle, construire] of Object.entries(prompts)) {
        const prompt = construire(SECTEUR, contexte, []);
        assert.match(prompt, /Tourisme/, `la section ${cle} doit nommer le secteur`);
        assert.match(prompt, /14\.2/, `la section ${cle} doit recevoir les chiffres`);
        assert.match(prompt, /TÂCHE/, `la section ${cle} doit porter une consigne`);
    }
});
