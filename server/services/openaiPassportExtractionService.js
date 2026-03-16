import openai from '../config/openai.js';
import { extractedPassportSchema } from '../schemas/openaiExtractedPassportSchema.js';

const SYSTEM_PROMPT = `
You extract passport fields from one passport image. 
Return ONLY valid JSON with this exact shape:
{
    "surname": "",
    "firstName": "",
    "middleName": "",
    "dateOfBirth": "",
    "passportNumber": "",
    "dateOfIssue": "",
    "dateOfExpiry": "",
    "confidence": {
        "surname": 0.0,
        "firstName": 0.0,
        "middleName": 0.0,
        "dateOfBirth": 0.0,
        "passportNumber": 0.0,
        "dateOfIssue": 0.0,
        "dateOfExpiry": 0.0
    
    
    }

}
Rules:
- Unknown field -> empty string.
- Dates in DD/MM/YYYY always and when possible.
- passportNumber uppercase alphanumeric only.


`;

export async function extractPassportFieldsFromImageUrl(imageUrl) {
    const model = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';

    const result = await openai.chat.completions.create({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object'},
        messages: [
            {role: 'system', content: SYSTEM_PROMPT.trim()},
            {
                role: 'user',
                content: [
                    {type: 'text', text: 'Extract passport fields from this image.'},
                    {type: 'image_url', image_url: {url: imageUrl}},
                ],
            },




        ],



    });

    const text = result?.choices?.[0]?.message?.content || '{}';

    let parsed;

    try {
        parsed = JSON.parse(text);
    } catch {
        throw new Error('OpenAI response is not valid JSON')
    }

    const validated = extractedPassportSchema.safeParse(parsed);
    if (!validated.success) {
        throw new Error("Extracted data failed schema validation");
    }

    return validated.data;

}