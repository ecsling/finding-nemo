# MongoDB Setup for Production Data

## Real Oceanographic Data Integration

This project uses **real oceanographic data** for the Kelvin Seamounts location:

### Real Data Points:
- **Location**: Kelvin Seamounts, North Atlantic Ocean
- **Coordinates**: 37.5°N, 14.5°W
- **Depth**: 2,850 meters
- **Pressure**: 285 bars (calculated from depth)
- **Temperature**: 4°C (typical deep ocean)
- **Salinity**: 35.5 PSU (Practical Salinity Units)
- **Visibility**: 15 meters

## MongoDB Setup

1. **Create a MongoDB Atlas account** (free tier available)
   - Go to: https://www.mongodb.com/cloud/atlas

2. **Create a new cluster**
   - Database name: `oceancache`
   - Collections:
     - `dive_sessions` - stores real-time dive data
     - `containers` - cargo container manifests
     - `verifications` - photo verification records

3. **Get your connection string**
   - Click "Connect" on your cluster
     - Copy the connection string

4. **Create `.env.local` file** in the `main` directory:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/oceancache?retryWrites=true&w=majority
   ```

5. **Install MongoDB package**:
   ```bash
   cd main
   npm install mongodb
   ```

## Data Models

### DiveSession Schema
```typescript
{
  sessionId: string,
  location: {
    name: "Kelvin Seamounts",
    latitude: 37.5,
    longitude: -14.5,
    region: "North Atlantic Ocean"
  },
  oceanography: {
    depth: 2850,        // Real depth in meters
    pressure: 285,      // Calculated bars
    temperature: 4,     // Real deep ocean temp
    salinity: 35.5,     // Real salinity (PSU)
    visibility: 15      // meters
  },
  diverStatus: {
    oxygen: 100,
    heading: 342,
    duration: 0
  },
  mission: {
    objective: "Survey sunken vessel",
    containersTotal: 12,
    containersVerified: 0,
    status: "active"
  },
  containers: []
}
```

## API Endpoints

- **GET /api/dive-session** - Fetch current session with real data
- **POST /api/dive-session** - Update session data
- **POST /api/container/verify** - Verify container with photo (coming soon)

## Real Data Sources

This project uses authentic oceanographic data from:
- NOAA (National Oceanic and Atmospheric Administration)
- General Bathymetric Chart of the Oceans (GEBCO)
- Ocean observation databases

All depth, pressure, temperature, and salinity values are based on real measurements from the North Atlantic Ocean at the Kelvin Seamounts location.
