// ============================================================================
// Comptes — clients et administrateurs partagent la table `utilisateurs`.
// ----------------------------------------------------------------------------
// Le rôle est une donnée en base, pas un parcours d'inscription séparé :
// l'inscription publique crée toujours un client, et c'est la colonne `role`
// qui décide de ce que la personne voit après connexion (catalogue ou panneau
// de contrôle). Promouvoir quelqu'un administrateur est une opération
// d'administration, jamais une action publique.
// ============================================================================

const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { config } = require("../config/env");

const ROLE_CLIENT = "client";
const ROLE_ADMIN = "admin";

/** Champs exposés au frontend — le hachage du mot de passe n'en fait jamais partie. */
const CHAMPS_PUBLICS = `id, email, nom, prenom, entreprise, pays, telephone,
                        role, est_actif, est_verifie, derniere_connexion, created_at`;

/** Champs que le titulaire du compte peut modifier lui-même. */
const CHAMPS_PROFIL = ["nom", "prenom", "entreprise", "pays", "telephone"];

async function findByEmail(email) {
    const { rows } = await pool.query(
        "SELECT * FROM utilisateurs WHERE LOWER(email) = LOWER($1)",
        [email]
    );
    return rows[0] || null;
}

async function findById(id) {
    const { rows } = await pool.query(
        `SELECT ${CHAMPS_PUBLICS} FROM utilisateurs WHERE id = $1`,
        [id]
    );
    return rows[0] || null;
}

/** Inscription publique : toujours un compte client. */
async function createClient({ email, mot_de_passe, nom, prenom, entreprise, pays, telephone }) {
    const hache = await bcrypt.hash(mot_de_passe, config.bcryptRounds);
    const { rows } = await pool.query(
        `INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, entreprise, pays, telephone, role)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING ${CHAMPS_PUBLICS}`,
        [email.trim(), hache, nom, prenom, entreprise || null, pays || null, telephone || null, ROLE_CLIENT]
    );
    return rows[0];
}

function verifyPassword(motDePasseClair, hache) {
    return bcrypt.compare(motDePasseClair, hache);
}

async function touchLogin(id) {
    await pool.query(
        "UPDATE utilisateurs SET derniere_connexion = CURRENT_TIMESTAMP WHERE id = $1",
        [id]
    );
}

async function updateProfil(id, payload) {
    const valeurs = CHAMPS_PROFIL.map((champ) => (payload[champ] === "" ? null : payload[champ] ?? null));
    const affectations = CHAMPS_PROFIL.map((champ, i) => `${champ} = COALESCE($${i + 2}, ${champ})`).join(", ");

    const { rows } = await pool.query(
        `UPDATE utilisateurs SET ${affectations}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
      RETURNING ${CHAMPS_PUBLICS}`,
        [id, ...valeurs]
    );
    return rows[0] || null;
}

async function updatePassword(id, nouveauMotDePasse) {
    const hache = await bcrypt.hash(nouveauMotDePasse, config.bcryptRounds);
    await pool.query(
        "UPDATE utilisateurs SET mot_de_passe = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [hache, id]
    );
}

/** Liste des comptes (panneau admin). */
async function listAccounts() {
    const { rows } = await pool.query(
        `SELECT ${CHAMPS_PUBLICS} FROM utilisateurs ORDER BY role, created_at DESC`
    );
    return rows;
}

/** Change le rôle d'un compte (réservé aux administrateurs). */
async function setRole(id, role) {
    if (![ROLE_CLIENT, ROLE_ADMIN].includes(role)) return null;
    const { rows } = await pool.query(
        `UPDATE utilisateurs SET role = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2 RETURNING ${CHAMPS_PUBLICS}`,
        [role, id]
    );
    return rows[0] || null;
}

/** Nombre d'administrateurs actifs — garde-fou avant toute rétrogradation. */
async function countActiveAdmins() {
    const { rows } = await pool.query(
        "SELECT COUNT(*)::int AS total FROM utilisateurs WHERE role = 'admin' AND est_actif = true"
    );
    return rows[0].total;
}

module.exports = {
    ROLE_CLIENT,
    ROLE_ADMIN,
    CHAMPS_PROFIL,
    findByEmail,
    findById,
    createClient,
    verifyPassword,
    touchLogin,
    updateProfil,
    updatePassword,
    listAccounts,
    setRole,
    countActiveAdmins,
};
