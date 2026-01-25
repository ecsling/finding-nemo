import { NextResponse } from 'next/server';

const apiKey = process.env.SKETCHFAB_API_KEY;

export async function GET() {
  console.log('Debug endpoint called');
  console.log('API key present:', !!apiKey);
  console.log('API key length:', apiKey?.length || 0);

  if (!apiKey) {
    return NextResponse.json(
      {
        status: 'error',
        apiKeyPresent: false,
        apiKeyLength: 0,
        message: 'Sketchfab API key is not configured',
      },
      { status: 500 }
    );
  }

  // Test a simple API call to verify the key works
  try {
    const testUrl = 'https://api.sketchfab.com/v3/me';
    console.log('Testing API call to:', testUrl);

    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Test response status:', response.status);

    if (response.ok) {
      const userData = await response.json();
      console.log('API key is valid. User data:', userData);
      return NextResponse.json({
        status: 'success',
        apiKeyPresent: true,
        apiKeyLength: apiKey.length,
        testResponse: userData,
        message: 'API key is working correctly',
      });
    }

    const errorText = await response.text();
    console.error('API key test failed:', errorText);
    return NextResponse.json({
      status: 'error',
      apiKeyPresent: true,
      apiKeyLength: apiKey.length,
      error: `API key test failed: ${response.status}`,
      errorDetails: errorText,
      message: 'API key may be invalid or expired',
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      status: 'error',
      apiKeyPresent: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test API key',
    });
  }
}