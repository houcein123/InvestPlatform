const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function generateText(prompt) {

    try {

        const completion = await groq.chat.completions.create({

            model: "llama-3.3-70b-versatile",

            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],

            temperature: 0.5,
            max_tokens: 1500

        });

        return completion.choices[0].message.content;

    } catch (error) {

        console.error("Erreur Groq :", error);

        throw error;

    }

}

module.exports = {
    generateText
};