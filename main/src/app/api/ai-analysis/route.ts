import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { incident, type } = await request.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    let prompt = '';
    
    if (type === 'search-analysis') {
      prompt = `You are an expert marine search and rescue AI analyzing a shipping container loss incident.

Incident Details:
- Location: ${incident.gpsCoordinates?.latitude}°N, ${incident.gpsCoordinates?.longitude}°E
- Container Serial: ${incident.containerSerialId}
- Depth: ${Math.abs(incident.gpsCoordinates?.altitude || 0)}m
- Ocean Current: ${incident.environmentalConditions?.oceanCurrents?.[0]?.speed || 0.42} m/s at ${incident.environmentalConditions?.oceanCurrents?.[0]?.direction || 85}°
- Time in Water: ${incident.estimatedTimeInWater} hours
- Cargo Value: $${incident.cargoValue}

Provide a concise analysis (3-4 sentences) covering:
1. Most likely final container location based on drift patterns
2. Key environmental factors affecting recovery
3. Recommended search strategy priority areas

Be specific, technical, and confident. Format as plain text.`;
    } else if (type === 'cost-analysis') {
      prompt = `You are a marine recovery economics expert. Analyze this container recovery scenario:

- Cargo Value: $${incident.cargoValue}
- Depth: ${Math.abs(incident.gpsCoordinates?.altitude || 0)}m
- Time in Water: ${incident.estimatedTimeInWater} hours
- Search Area: Traditional grid search vs AI-optimized probability zones

Provide a brief cost comparison (2-3 sentences) explaining:
1. Traditional search costs and timeline
2. AI-optimized approach savings
3. ROI benefit

Be specific with numbers. Format as plain text.`;
    } else if (type === 'environmental-insight') {
      prompt = `As an oceanographic AI, analyze these conditions for container recovery:

- Location: ${incident.gpsCoordinates?.latitude}°N, ${incident.gpsCoordinates?.longitude}°E (Kelvin Seamounts, North Atlantic)
- Depth: ${Math.abs(incident.gpsCoordinates?.altitude || 0)}m
- Current Speed: ${incident.environmentalConditions?.oceanCurrents?.[0]?.speed || 0.42} m/s
- Current Direction: ${incident.environmentalConditions?.oceanCurrents?.[0]?.direction || 85}°

Provide 2-3 sentences on:
1. How ocean currents at this depth will affect container drift
2. Seafloor terrain considerations for this location
3. Recovery difficulty factors

Be technical and specific. Format as plain text.`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate AI analysis' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate analysis';

    return NextResponse.json({ analysis: aiResponse });
  } catch (error) {
    console.error('AI Analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
