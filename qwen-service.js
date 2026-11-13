
'use strict';

const BASE_URL = process.env.QWEN_BASE_URL;
const MODEL = process.env.QWEN_MODEL;
const API_KEY = process.env.QWEN_API_KEY;

function cleanData(value, depth = 0) {
    if (depth > 6) return '[Maximum depth reached]';

    if (value === null || typeof value === 'boolean') return value;

    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
        return value.slice(0, 1000);
    }

    if (Array.isArray(value)) {
        return value.slice(0, 100).map(item =>
            cleanData(item, depth + 1)
        );
    }

    if (typeof value === 'object') {
        const result = {};

        for (const [key, item] of Object.entries(value).slice(0, 100)) {
            if (
                typeof key !== 'string' ||
                /api.?key|password|token|secret/i.test(key)
            ) {
                continue;
            }

            result[key.slice(0, 100)] = cleanData(item, depth + 1);
        }

        return result;
    }

    return null;
}

async function analyzeSession(sessionData) {
    if (!API_KEY || !BASE_URL || !MODEL) {
        throw new Error('Qwen configuration is incomplete. Check .env.');
    }

    if (!sessionData || typeof sessionData !== 'object') {
        throw new Error('Invalid session data.');
    }

    const safeData = cleanData(sessionData);
    const serialized = JSON.stringify(safeData);

    if (serialized.length > 12000) {
        throw new Error('Session data is too large to analyze.');
    }

    const systemPrompt = `
You are PulseStage AI, an intelligent physiological measurement
and performance insights assistant.

You analyze data produced by the Presage SmartSpectra SDK.

Rules:
1. Only use measurements actually supplied to you.
2. Never invent missing measurements or values.
3. Clearly identify missing or invalid data.
4. Distinguish measured facts from possible interpretations.
5. Do not diagnose diseases or claim medical certainty.
6. Do not recommend medication or treatment.
7. Do not claim to detect conditions that the supplied data
   cannot establish.
8. If data quality or validation is poor, explain the limitation.
9. Only discuss trends when historical data is provided.
10. Provide clear, practical and cautious explanations.

Return a useful session analysis with these sections:

SESSION SUMMARY
MEASUREMENTS
OBSERVATIONS
RECOMMENDATIONS
DATA LIMITATIONS

Use clear language. Do not exaggerate findings.
`;

    const response = await fetch(
        `${BASE_URL.replace(/\/+$/, '')}/chat/completions`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content:
                            'Analyze this PulseStage measurement session:\n' +
                            serialized
                    }
                ],
                temperature: 0.2,
                max_tokens: 1200
            }),
            signal: AbortSignal.timeout(45000)
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error?.message ||
            `Qwen API returned HTTP ${response.status}`
        );
    }

    const analysis = result.choices?.[0]?.message?.content;

    if (!analysis) {
        throw new Error('Qwen returned an empty analysis.');
    }

    return {
        model: MODEL,
        analysis,
        usage: result.usage || null,
        generatedAt: new Date().toISOString()
    };
}

module.exports = { analyzeSession };
