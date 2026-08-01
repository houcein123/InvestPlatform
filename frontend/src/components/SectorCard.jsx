export default function SectorCard({ sector }) {

    const preview = () => {
        window.open(sector.pdf, "_blank");
    };

    const buy = () => {
        alert("Paiement bientôt disponible.");
    };

    return (

        <div style={styles.card}>

            <img
                src={sector.image}
                alt={sector.name}
                style={styles.image}
            />

            <h2>{sector.name}</h2>

            <p>{sector.description}</p>

            <p>📄 {sector.pages} pages</p>

            <p>💰 {sector.price} TND</p>

            <p>📅 {sector.updatedAt}</p>

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
        borderRadius: 10
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