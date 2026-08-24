-- ============================================================================
-- Migration 008 — espace expert
-- ----------------------------------------------------------------------------
-- Intègre le domaine « expert/partenaire » (consultations, rendez-vous,
-- disponibilités, revenus, services premium) dans la base unique de la
-- plateforme. Il vivait jusqu'ici dans une base PostgreSQL séparée, alimentée
-- par Hibernate en `ddl-auto=update` : le schéma n'existait nulle part sous
-- forme écrite et n'était pas reproductible.
--
-- `experts.utilisateur_id` est la pièce maîtresse de l'intégration : sans ce
-- lien, chaque requête de l'espace partenaire servait les données de
-- l'expert n°1 à tout compte appelant l'API.
-- ============================================================================

CREATE TABLE IF NOT EXISTS experts (
    id                          SERIAL PRIMARY KEY,
    utilisateur_id              INT UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,

    nom                         VARCHAR(100),
    prenom                      VARCHAR(100),
    photo_url                   VARCHAR(500),
    specialite                  VARCHAR(150),
    pays                        VARCHAR(100),
    biographie                  TEXT,
    annees_experience           INT,
    langues_parlees             VARCHAR(255),

    tarif_consultation_unique   DOUBLE PRECISION,
    tarif_abonnement_illimite   DOUBLE PRECISION,

    -- Statuts des options premium : ACTIF, EN_ATTENTE, NON_DEMANDE, STANDARD
    badge_expert_verifie        VARCHAR(20),
    secretaire_virtuelle        VARCHAR(20),
    mise_en_avant_profil        VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS consultations (
    id             SERIAL PRIMARY KEY,
    expert_id      INT REFERENCES experts(id) ON DELETE CASCADE,
    pays_client    VARCHAR(100),
    sujet          VARCHAR(255),
    question       TEXT,
    reponse        TEXT,
    date_reception TIMESTAMP,
    date_reponse   TIMESTAMP,
    -- EN_ATTENTE, REPONDUE, PLANIFIEE, TERMINEE
    statut         VARCHAR(20),
    note           DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS rendez_vous (
    id            SERIAL PRIMARY KEY,
    expert_id     INT REFERENCES experts(id) ON DELETE CASCADE,
    date_heure    TIMESTAMP,
    duree_minutes INT,
    pays_client   VARCHAR(100),
    lien_session  VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS disponibilites (
    id            SERIAL PRIMARY KEY,
    expert_id     INT REFERENCES experts(id) ON DELETE CASCADE,
    date_debut    TIMESTAMP,
    date_fin      TIMESTAMP,
    -- LIBRE, RESERVE, BLOQUE
    statut        VARCHAR(20),
    est_recurrent BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS revenus (
    id               SERIAL PRIMARY KEY,
    expert_id        INT REFERENCES experts(id) ON DELETE CASCADE,
    montant          DOUBLE PRECISION,
    date_transaction DATE,
    description      VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_consultations_expert  ON consultations (expert_id);
CREATE INDEX IF NOT EXISTS idx_consultations_statut  ON consultations (expert_id, statut);
CREATE INDEX IF NOT EXISTS idx_rdv_expert            ON rendez_vous (expert_id, date_heure);
CREATE INDEX IF NOT EXISTS idx_disponibilites_expert ON disponibilites (expert_id);
CREATE INDEX IF NOT EXISTS idx_revenus_expert        ON revenus (expert_id, date_transaction);

-- Un compte ne peut porter qu'un seul profil expert : la contrainte UNIQUE sur
-- utilisateur_id l'impose déjà, cet index sert la lecture faite à chaque
-- requête de l'espace partenaire.
CREATE INDEX IF NOT EXISTS idx_experts_utilisateur ON experts (utilisateur_id);
