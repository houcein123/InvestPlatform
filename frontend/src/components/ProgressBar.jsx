/**
 * Barre de progression de la génération (CDC §6, étape 3 : 20-40 secondes).
 * Alimentée par le suivi de job renvoyé par GET /api/report/status/:jobId.
 */
export default function ProgressBar({ progression, etape }) {
  const valeur = Math.min(100, Math.max(0, Math.round(progression || 0)));

  return (
    <div className="progress">
      <div
        className="progress__track"
        role="progressbar"
        aria-valuenow={valeur}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression de la génération du rapport"
      >
        <div className="progress__bar" style={{ width: `${valeur}%` }} />
      </div>
      <div className="progress__label">
        <span>{etape}</span>
        <span>{valeur}%</span>
      </div>
    </div>
  );
}
