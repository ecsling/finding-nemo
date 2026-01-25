# Gemini AI Integration Setup

## Quick Setup (2 minutes)

### 1. Get your Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### 2. Add API Key to Your Project
Create a file called `.env.local` in the `main` folder with this content:

```bash
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Restart the Dev Server
```bash
npm run dev
```

## What This Adds

### Real AI-Powered Analysis
- **Search Strategy Predictions**: Gemini analyzes ocean currents, depth, and drift patterns to suggest optimal search zones
- **Cost Analysis**: Real-time comparison between traditional search and AI-optimized approach
- **Environmental Insights**: Oceanographic analysis specific to your incident location

### Where You'll See It
- **Search Optimizer Page**: Live AI analysis feed shows Gemini's predictions
- **Real-Time Updates**: Analysis updates as simulation progresses
- **Pitch-Ready**: Demonstrates actual AI/ML capabilities, not just mockups

## API Costs
- **Free Tier**: 60 requests per minute
- **Cost**: Free for development and demos
- **Perfect for pitches**: Real AI responses in milliseconds

## Example Output
```
Based on the Kelvin Seamounts bathymetry and current speed of 0.42 m/s 
at 85°, the container has likely drifted approximately 109km northeast 
from the drop point. The seafloor terrain features volcanic ridges that 
will create eddy currents, concentrating the search area. Recommend 
focusing AUV deployment on the 2850m contour within a 12km² zone.
```

## Troubleshooting
- **Error: "API key not configured"**: Make sure `.env.local` exists in the `main` folder
- **Error: "Failed to generate"**: Check that your API key is valid
- **No analysis showing**: Refresh the page after adding the API key
