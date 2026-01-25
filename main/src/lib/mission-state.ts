/**
 * Mission State Management
 * Handles state persistence across mission flow pages
 */

import { ContainerData } from '@/components/Globe';

export interface MissionState {
  currentStep: number;
  selectedContainer: ContainerData | null;
  timestamp: number;
  missionId: string;
}

const STORAGE_KEY = 'oceancache_mission_state';
const STATE_EXPIRY = 1000 * 60 * 60; // 1 hour

/**
 * Generate unique mission ID
 */
export function generateMissionId(): string {
  return `MISSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Save mission state to localStorage
 */
export function saveMissionState(state: Partial<MissionState>): void {
  if (typeof window === 'undefined') return;

  const currentState = getMissionState();
  const newState: MissionState = {
    ...currentState,
    ...state,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  } catch (error) {
    console.error('Failed to save mission state:', error);
  }
}

/**
 * Get mission state from localStorage
 */
export function getMissionState(): MissionState {
  if (typeof window === 'undefined') {
    return getDefaultState();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultState();

    const state: MissionState = JSON.parse(stored);

    // Check if state is expired
    if (Date.now() - state.timestamp > STATE_EXPIRY) {
      clearMissionState();
      return getDefaultState();
    }

    return state;
  } catch (error) {
    console.error('Failed to load mission state:', error);
    return getDefaultState();
  }
}

/**
 * Clear mission state
 */
export function clearMissionState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get default mission state
 */
function getDefaultState(): MissionState {
  return {
    currentStep: 1,
    selectedContainer: null,
    timestamp: Date.now(),
    missionId: generateMissionId(),
  };
}

/**
 * Update current step
 */
export function setCurrentStep(step: number): void {
  saveMissionState({ currentStep: step });
}

/**
 * Get current step
 */
export function getCurrentStep(): number {
  return getMissionState().currentStep;
}

/**
 * Set selected container
 */
export function setSelectedContainer(container: ContainerData | null): void {
  saveMissionState({ selectedContainer: container });
}

/**
 * Get selected container
 */
export function getSelectedContainer(): ContainerData | null {
  return getMissionState().selectedContainer;
}

/**
 * Start new mission
 */
export function startNewMission(): void {
  clearMissionState();
  saveMissionState({
    currentStep: 1,
    selectedContainer: null,
    missionId: generateMissionId(),
  });
}

/**
 * Complete mission
 */
export function completeMission(): void {
  saveMissionState({ currentStep: 4 });
}
