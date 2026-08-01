import sectors from "../data/sectors";
import SectorCard from "../components/SectorCard";

export default function Catalogue() {
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

    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
        gap: 25
    }

};