import { useEffect, useState } from "react";
import SectorCard from "../components/SectorCard";

export default function Catalogue() {

    const [sectors, setSectors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        fetch("http://localhost:3001/api/catalogue")
            .then((res) => res.json())
            .then((data) => {

                setSectors(data.secteurs);
                setLoading(false);

            })
            .catch((err) => {

                console.error(err);
                setLoading(false);

            });

    }, []);

    if (loading) {
        return (
            <div style={styles.loading}>
                Chargement...
            </div>
        );
    }

    return (

        <div style={styles.container}>

            <h1>Catalogue des Rapports</h1>

            <div style={styles.grid}>

                {sectors.map((sector) => (

                    <SectorCard
                        key={sector.id}
                        sector={sector}
                    />

                ))}

            </div>

        </div>

    );

}

const styles = {

    container: {
        padding: 30
    },

    loading: {
        textAlign: "center",
        marginTop: 50,
        fontSize: 20
    },

    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
        gap: 25
    }

};