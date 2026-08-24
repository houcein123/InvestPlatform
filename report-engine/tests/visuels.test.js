// ============================================================================
// Photographies sectorielles du rapport.
// ----------------------------------------------------------------------------
// Le rapport est un document VENDU : une image sans auteur ni licence n'a rien
// à y faire, et un crédit illisible ne vaut pas mieux qu'une absence de crédit.
// Ces tests figent les deux règles.
// ============================================================================

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const { photosSecteur, photoSecteur, ligneCredit, texteLatin, DOSSIER_IMAGES } = require("../src/pdf/visuels");

const SECTEURS = ["tourisme", "agriculture", "technologies", "energies", "textile", "logistique"];

test("chaque secteur dispose d'une couverture et de deux illustrations", () => {
    for (const slug of SECTEURS) {
        const photos = photosSecteur(slug);
        assert.equal(photos.length, 3, `${slug} : trois photographies attendues`);
        assert.ok(photoSecteur(slug, 1), `${slug} : photographie de couverture manquante`);
    }
});

test("chaque photographie est réellement sur le disque", () => {
    for (const slug of SECTEURS) {
        for (const photo of photosSecteur(slug)) {
            assert.ok(fs.existsSync(path.join(DOSSIER_IMAGES, photo.fichier)),
                `${photo.fichier} : fichier absent`);
        }
    }
});

test("chaque photographie porte auteur, licence, source et légende", () => {
    for (const slug of SECTEURS) {
        for (const photo of photosSecteur(slug)) {
            assert.ok(photo.auteur && photo.auteur.trim(), `${photo.fichier} : auteur manquant`);
            assert.ok(photo.licence && photo.licence.trim(), `${photo.fichier} : licence manquante`);
            assert.match(photo.source || "", /^https:\/\//, `${photo.fichier} : page source manquante`);
            assert.ok(photo.legende && photo.legende.trim(), `${photo.fichier} : légende manquante`);
        }
    }
});

test("un secteur inconnu n'emprunte pas les images d'un autre", () => {
    assert.deepEqual(photosSecteur("secteur-inexistant"), []);
    assert.equal(photoSecteur("secteur-inexistant"), null);
});

test("les crédits tiennent dans l'encodage des polices standard du PDF", () => {
    for (const slug of SECTEURS) {
        for (const photo of photosSecteur(slug)) {
            const credit = ligneCredit(photo);
            // texteLatin() ne rend inchangé que ce qu'Helvetica sait écrire :
            // si le crédit en ressort amputé, c'est qu'il serait illisible.
            assert.equal(texteLatin(credit), credit, `${photo.fichier} : crédit non rendu par Helvetica`);
            assert.ok(credit.includes(photo.licence), `${photo.fichier} : licence absente du crédit`);
        }
    }
});

test("un nom hors alphabet latin est transcrit ou écarté, jamais rendu en charabia", () => {
    assert.equal(texteLatin("Habib M'henni"), "Habib M'henni");
    assert.equal(texteLatin("Benoît Prieur"), "Benoît Prieur");
    // Le cyrillique n'a pas d'équivalent WinAnsi : il disparaît plutôt que de
    // ressortir en octets illisibles sous l'image.
    assert.equal(texteLatin("Александр"), "");
    assert.equal(texteLatin(null), "");
});
