export default function Catalogue() {

    const secteurs = [
        {
            id: 1,
            nom: "Tourisme",
            description: "Flux touristiques et capacités hôtelières",
            pages: 35,
            prix: 25
        },
        {
            id: 2,
            nom: "Agriculture",
            description: "Cultures et exportations",
            pages: 28,
            prix: 20
        },
        {
            id: 3,
            nom: "Technologies & Numérique",
            description: "Startups et export IT",
            pages: 30,
            prix: 30
        },
        {
            id: 4,
            nom: "Énergies Renouvelables",
            description: "Projets solaires et éoliens",
            pages: 32,
            prix: 28
        },
        {
            id: 5,
            nom: "Textile & Habillement",
            description: "Marchés et emplois",
            pages: 26,
            prix: 22
        },
        {
            id: 6,
            nom: "Logistique & Transport",
            description: "Ports et corridors",
            pages: 29,
            prix: 24
        }
    ];

    return (
        <div style={styles.container}>

            <h1>Catalogue des secteurs</h1>

            <div style={styles.grid}>

                {secteurs.map((s) => (

                    <div key={s.id} style={styles.card}>

                        <h3>{s.nom}</h3>

                        <p>{s.description}</p>

                        <p>📄 {s.pages} pages</p>

                        <p>💰 {s.prix} TND</p>

                        <button style={styles.previewBtn}>
                            Aperçu PDF
                        </button>

                        <button style={styles.buyBtn}>
                            Acheter
                        </button>

                    </div>

                ))}

            </div>

        </div>
    );
}

const styles = {
    container: {
        padding: 30
    },

    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))",
        gap: 20
    },

    card: {
        background: "white",
        padding: 20,
        borderRadius: 12,
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    },

    previewBtn: {
        marginRight: 10,
        padding: "10px 15px",
        border: "none",
        borderRadius: 8,
        background: "#3b82f6",
        color: "white",
        cursor: "pointer"
    },

    buyBtn: {
        padding: "10px 15px",
        border: "none",
        borderRadius: 8,
        background: "#10b981",
        color: "white",
        cursor: "pointer"
    }
};