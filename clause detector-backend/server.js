//necesary libraries
const express = require('express');
const http = require('http');
const cors = require("cors");
const multer = require('multer');
const pdf = require('pdf-parse');
const fetch = require('node-fetch'); 
require('dotenv').config();

// Initialize Express App ---
const app = express();
const PORT = process.env.PORT || 8888; // specific port

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`--> Incoming Request Received: ${req.method} ${req.path}`);
    next();
});

//  Configure File Handling with Multer ---
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

// Define the Core API Route for Analysis ---
app.post('/api/analyze', upload.single('pdf'), async (req, res) => {
    console.log("Processing request for /api/analyze...");

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded.' });
        }

        console.log("Parsing PDF...");
        const pdfData = await pdf(req.file.buffer);
        const pdfText = pdfData.text;
        console.log("PDF parsing complete.");

        if (!pdfText) {
            return res.status(400).json({ error: 'Could not extract text from the PDF.' });
        }
        
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set in the .env file.");
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        const prompt = `
            You are an expert AI legal assistant. Your task is to analyze the following legal document text and extract clauses that are critical for a non-lawyer to understand.

            For each critical clause you find, create a JSON object with the following three keys:
            1. "clause": The exact, verbatim text of the clause from the document.
            2. "category": A one-word category for the clause. Examples: "Liability", "Termination", "Confidentiality", "Payment", "Governing Law", "Intellectual Property".
            3. "explanation": A simple, one-to-two sentence explanation of what the clause means in plain English.

            Return your response as a single, valid JSON array of these objects. Do not include any other text, explanation, or markdown formatting like \`\`\`json outside of the JSON array itself.

            Here is the document text:
            ---
            ${pdfText}
            ---
        `;

        const payload = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        console.log("Sending request to Gemini API...");
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error("Gemini API Error Body:", errorBody);
            throw new Error(`Gemini API request failed with status ${geminiResponse.status}`);
        }

        const geminiResult = await geminiResponse.json();
        
        console.log("Received response from Gemini API.");
        if (!geminiResult.candidates || geminiResult.candidates.length === 0 || !geminiResult.candidates[0].content || !geminiResult.candidates[0].content.parts || geminiResult.candidates[0].content.parts.length === 0) {
            console.error("Invalid response structure from Gemini:", JSON.stringify(geminiResult, null, 2));
            throw new Error("Received an invalid or empty response from the AI.");
        }

        const rawResponse = geminiResult.candidates[0].content.parts[0].text;
        console.log("--- Raw AI Response Text ---\n", rawResponse, "\n----------------------------");

        // JSON to extract
        try {
            const startIndex = rawResponse.indexOf('[');
            const endIndex = rawResponse.lastIndexOf(']');
            if (startIndex === -1 || endIndex === -1) {
                throw new Error("Could not find a valid JSON array in the AI response.");
            }
            const jsonString = rawResponse.substring(startIndex, endIndex + 1);
            const extractedClauses = JSON.parse(jsonString);
            res.status(200).json({ message: 'Analysis successful!', clauses: extractedClauses });
        } catch (jsonError) {
            console.error("Failed to parse JSON from AI response.", jsonError);
            throw new Error("The AI returned a response that was not valid JSON.");
        }

    } catch (error) {
        console.error("An error occurred in /api/analyze:", error);
        res.status(500).json({ error: 'An internal server error occurred.', details: error.message });
    }
});

// ---  the Server ---
const server = http.createServer(app);

server.on('error', (err) => {
    console.error('SERVER ERROR:', err);
});

server.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
