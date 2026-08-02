export default function SectorCard({ sector }) {

    const preview = () => {

        window.open(
            `http://localhost:3001/api/catalogue/${sector.id}/preview`,
            "_blank"
        );

    };

    const buy = () => {

        alert("Le paiement sera disponible prochainement.");

    };

    return (

        <div style={styles.card}>

            <img
                src={`http://localhost:3001/images/${sector.image}`}
                alt={sector.nom}
                style={styles.image}
                onError={(e) => {
                    e.target.src = "https://placehold.co/600x400?text=InvestPlatform";
                }}
            />

            <h2>{sector.nom}</h2>

            <p>{sector.description}</p>

            <p>
                📄 {sector.nombre_pages} pages
            </p>

            <p>
                💰 {sector.prix_rapport} TND
            </p>

            <p>
                📅 {new Date(sector.updated_at).toLocaleDateString()}
            </p>

            <div style={styles.buttons}>

                <button
                    style={styles.preview}
                    onClick={preview}
                >
                    Aperçu PDF
                </button>

                <button
                    style={styles.buy}
                    onClick={buy}
                >
                    Acheter
                </button>

            </div>

        </div>

    );

}

const styles = {

    card: {
        background: "white",
        padding: 20,
        borderRadius: 15,
        boxShadow: "0 3px 10px rgba(0,0,0,.1)"
    },

    image: {
        width: "100%",
        height: 180,
        objectFit: "cover",
        borderRadius: 10,
        marginBottom: 15
    },

    buttons: {
        display: "flex",
        gap: 10,
        marginTop: 15
    },

    preview: {
        flex: 1,
        padding: 10,
        border: "none",
        background: "#3b82f6",
        color: "white",
        borderRadius: 8,
        cursor: "pointer"
    },

    buy: {
        flex: 1,
        padding: 10,
        border: "none",
        background: "#10b981",
        color: "white",
        borderRadius: 8,
        cursor: "pointer"
    }

};