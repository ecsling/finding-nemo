import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { DiveSession, OCEANOGRAPHIC_DATA } from '@/models/DiveSession';

// GET - Fetch current dive session
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('oceancache');
    
    // Get the most recent active session
    const session = await db
      .collection<DiveSession>('dive_sessions')
      .findOne(
        { 'mission.status': 'active' },
        { sort: { createdAt: -1 } }
      );
    
    if (!session) {
      // Create a new session with real data
      const newSession: Partial<DiveSession> = {
        sessionId: `DVR-${Date.now()}`,
        timestamp: new Date(),
        location: {
          name: OCEANOGRAPHIC_DATA.KELVIN_SEAMOUNTS.name,
          latitude: OCEANOGRAPHIC_DATA.KELVIN_SEAMOUNTS.latitude,
          longitude: OCEANOGRAPHIC_DATA.KELVIN_SEAMOUNTS.longitude,
          region: OCEANOGRAPHIC_DATA.KELVIN_SEAMOUNTS.region,
        },
        oceanography: {
          depth: OCEANOGRAPHIC_DATA.KELVIN_SEAMOUNTS.depth,
          pressure: OCEANOGRAPHIC_DATA.KELVIN_SEAMOUNTS.pressure,
          temperature: OCEANOGRAPHIC_DATA.KELVIN_SEAMOUNTS.temperature,
          salinity: OCEANOGRAPHIC_DATA.KELVIN_SEAMOUNTS.salinity,
          visibility: OCEANOGRAPHIC_DATA.KELVIN_SEAMOUNTS.visibility,
        },
        diverStatus: {
          oxygen: 100,
          oxygenConsumption: 25,
          heading: 342,
          duration: 0,
        },
        mission: {
          objective: 'Survey sunken vessel and verify cargo containers',
          vesselName: 'MV POSEIDON',
          vesselType: 'Container Ship',
          containersTotal: 12,
          containersVerified: 0,
          photosCollected: 0,
          status: 'active',
        },
        containers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await db.collection('dive_sessions').insertOne(newSession);
      
      return NextResponse.json({
        success: true,
        session: { ...newSession, _id: result.insertedId },
      });
    }
    
    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error fetching dive session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dive session' },
      { status: 500 }
    );
  }
}

// POST - Update dive session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, updates } = body;
    
    const client = await clientPromise;
    const db = client.db('oceancache');
    
    const result = await db.collection('dive_sessions').updateOne(
      { sessionId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Session updated successfully',
    });
  } catch (error) {
    console.error('Error updating dive session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update dive session' },
      { status: 500 }
    );
  }
}
