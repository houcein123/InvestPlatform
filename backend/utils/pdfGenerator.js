const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");


function addHeaderFooter(doc, sector) {

    const pageNumber = doc.page.number;

    doc.save();

    // Header
    doc
        .fontSize(9)
        .fillColor("#64748b")
        .text(
            "InvestPlatform | Rapport Sectoriel",
            50,
            30,
            {
                align: "left"
            }
        );


    // Footer
    doc
        .fontSize(9)
        .text(
            `Secteur : ${sector} | Page ${pageNumber}`,
            50,
            800,
            {
                align: "center"
            }
        );

    doc.restore();
}



function addTitle(doc, title) {

    doc
        .fontSize(20)
        .fillColor("#1d4ed8")
        .text(title);

    doc.moveDown();

}



function addText(doc, text) {

    if (!text) return;

    doc
        .fontSize(12)
        .fillColor("#111827")
        .text(text, {
            align: "justify",
            lineGap: 5
        });

    doc.moveDown(2);

}



function addKeyMetrics(doc, report) {


    addTitle(doc, "Chiffres clés");


    const metrics = report.metrics || [
        {
            label: "Pages du rapport",
            value: report.pages || "30"
        },
        {
            label: "Secteur",
            value: report.secteur
        },
        {
            label: "Année",
            value: new Date().getFullYear()
        }
    ];


    metrics.forEach((m)=>{


        doc
        .roundedRect(
            60,
            doc.y,
            220,
            50,
            8
        )
        .fill("#eff6ff");


        doc
        .fillColor("#1e3a8a")
        .fontSize(14)
        .text(
            m.label,
            75,
            doc.y - 35
        );


        doc
        .fontSize(16)
        .fillColor("#111")
        .text(
            m.value,
            75,
            doc.y - 15
        );


        doc.moveDown(3);

    });

}



function generatePDF(report){


    const reportsDir =
        path.join(__dirname,"../reports");


    if(!fs.existsSync(reportsDir)){
        fs.mkdirSync(
            reportsDir,
            {recursive:true}
        );
    }



    const filename =
        `${report.secteur.replace(/\s+/g,"_")}.pdf`;


    const filePath =
        path.join(
            reportsDir,
            filename
        );



    const doc =
        new PDFDocument({
            size:"A4",
            margin:60
        });



    doc.pipe(
        fs.createWriteStream(filePath)
    );



    /*
    ======================
        COVER PAGE
    ======================
    */


    doc
    .fontSize(32)
    .fillColor("#1d4ed8")
    .text(
        "InvestPlatform",
        {
            align:"center"
        }
    );


    doc.moveDown(2);


    doc
    .fontSize(26)
    .fillColor("#111827")
    .text(
        "Rapport Sectoriel",
        {
            align:"center"
        }
    );


    doc.moveDown();



    doc
    .fontSize(24)
    .fillColor("#2563eb")
    .text(
        report.secteur,
        {
            align:"center"
        }
    );


    doc.moveDown(5);


    doc
    .fontSize(12)
    .fillColor("gray")
    .text(
        "Généré par Intelligence Artificielle",
        {
            align:"center"
        }
    );


    doc
    .text(
        new Date().toLocaleDateString(),
        {
            align:"center"
        }
    );



    /*
    ======================
        SOMMAIRE
    ======================
    */


    doc.addPage();


    addTitle(
        doc,
        "Sommaire"
    );


    [
        "1. Introduction",
        "2. Chiffres clés",
        "3. Tendances",
        "4. Opportunités",
        "5. Risques",
        "6. Benchmarking",
        "7. Recommandations",
        "8. Perspectives"
    ]
    .forEach(x=>{
        doc.fontSize(13)
        .text(x);
    });



    /*
    ======================
        KEY METRICS
    ======================
    */


    doc.addPage();

    addKeyMetrics(
        doc,
        report
    );



    /*
    ======================
        IA SECTIONS
    ======================
    */


    const sections=[

        {
            title:"Introduction",
            data:report.introduction
        },

        {
            title:"Analyse des tendances",
            data:report.tendances
        },

        {
            title:"Opportunités",
            data:report.opportunites
        },


        {
            title:"Risques",
            data:report.risques
        },


        {
            title:"Benchmarking",
            data:report.benchmarking
        },


        {
            title:"Recommandations",
            data:report.recommandations
        },


        {
            title:"Perspectives",
            data:report.perspectives
        }

    ];



    sections.forEach(section=>{


        doc.addPage();


        addTitle(
            doc,
            section.title
        );


        addText(
            doc,
            section.data
        );


    });



    /*
    ======================
        END
    ======================
    */


    doc.end();


    return filePath;

}



module.exports = generatePDF;