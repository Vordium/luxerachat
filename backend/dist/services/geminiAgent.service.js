"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runEstateWiseAgent = runEstateWiseAgent;
const generative_ai_1 = require("@google/generative-ai");
const queryProperties_1 = require("../scripts/queryProperties");
const geminiChat_service_1 = require("./geminiChat.service");
/**
 * Top-level agent that first determines whether we need to
 * fetch RAG data (property listings from Pinecone). If so,
 * it retrieves that data and injects it into the downstream
 * Mixture-of-Experts pipeline; if not, it calls the experts
 * without any RAG context.
 *
 * @param prompt         The user’s latest message
 * @param userContext    Any additional context you want to pass through
 * @param expertWeights  Weights for each expert in the MoE
 */
async function runEstateWiseAgent(prompt, userContext = "", expertWeights = {}) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GOOGLE_AI_API_KEY in environment");
    }
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    // --- 1) Decide via a quick Gemini call whether to fetch property data ---
    const decisionInstruction = 'Read the user\'s message and reply **exactly** one JSON object with a boolean field "usePropertyData": either {"usePropertyData":true} or {"usePropertyData":false}. No other text.';
    const decisionModel = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
        systemInstruction: decisionInstruction,
    });
    const generationConfig = {
        temperature: 0.0,
        topP: 1,
        topK: 1,
        maxOutputTokens: 16,
    };
    const safetySettings = [
        {
            category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: generative_ai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: generative_ai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE,
        },
    ];
    const decisionChat = decisionModel.startChat({
        generationConfig,
        safetySettings,
        history: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const decisionResult = await decisionChat.sendMessage("");
    let usePropertyData = false;
    try {
        const parsed = JSON.parse(decisionResult.response.text());
        usePropertyData = Boolean(parsed.usePropertyData);
    }
    catch {
        // fallback if parse fails
        usePropertyData = false;
    }
    // --- 2) If needed, fetch RAG data (properties + text blob) ---
    let propertyContext = "";
    let rawResults = [];
    if (usePropertyData) {
        [propertyContext, rawResults] = await Promise.all([
            (0, queryProperties_1.queryPropertiesAsString)(prompt, 50),
            (0, queryProperties_1.queryProperties)(prompt, 50),
        ]);
    }
    // --- 3) Build merged userContext object ---
    const mergedPropertyContext = usePropertyData
        ? `${userContext}

      --- PROPERTY DATA START ---
      ${propertyContext}
      --- PROPERTY DATA END ---
      `
        : userContext;
    const estateWiseContext = {
        propertyContext: mergedPropertyContext,
        rawResults: usePropertyData ? rawResults : undefined,
    };
    // --- 4) Kick off the Mixture-of-Experts pipeline ---
    return (0, geminiChat_service_1.chatWithEstateWise)([{ role: "user", parts: [{ text: prompt }] }], prompt, estateWiseContext, expertWeights);
}
