# OceanCache
**Geospatial Decision-Support System for Maritime Container Recovery Operations**

OceanCache provides salvage operators and maritime logistics entities with a probability-weighted search optimization framework for lost cargo containers. The system renders a multi-layered heatmap visualization over an interactive 3D bathymetric mesh, leveraging rule-based spatial analysis derived from last-known positional telemetry, vessel trajectory proximity, and historical incident clustering.

This represents a proof-of-concept implementation: data inputs are synthetically generated, but the operational workflow adheres to industry-standard recovery protocols and maintains demonstration viability.

---

## Problem
Maritime container loss incidents result in significant operational expenditure and extended recovery timelines. Current search methodologies employ broad-radius scanning patterns centered on last-known coordinates, yielding suboptimal resource allocation and inflated operational costs due to excessive search area coverage.

---

## Solution
OceanCache implements a spatial optimization algorithm that transforms incident contextual data into a **hierarchically-ranked set of geospatial search zones**.

The system provides:
- **Interactive 3D bathymetric terrain mesh** (configurable asset pipeline)
- **Probability density heatmap overlay** with multi-factor scoring
- **Comparative visualization toggle:** legacy circular search vs optimized probability-based search
- **Container metadata lookup** via serial identifier (mock database integration)
- **Quantitative performance metric:** computed search-area reduction percentage

---

## Key Features
### 1) Incident Configuration Layer (Input Parameters)
All parameters support synthetic data injection:
- **Last known GPS telemetry** (WGS84 latitude/longitude coordinates)
- **Container serial identifier** (ISO 6346 compliant)
- **Vessel trajectory polyline** (ordered coordinate array)
- **Historical incident dataset** (synthetic point cloud)

### 2) Rule-Based Probabilistic Scoring Engine (Core Algorithm)
Implements an interpretable, audit-friendly probability model generating scores per grid cell:

- **Baseline distribution:** uniform probability within radial distance from last-known coordinates (baseline comparison view)
- **Route proximity weighting:** exponential decay function increasing probability near vessel trajectory segments
- **Historical cluster analysis:** Gaussian kernel density estimation near documented loss coordinates
- **Normalization pipeline:** score standardization to [0,1] interval for consistent heatmap rendering

Output: continuous probability density field for search zone delineation.

### 3) 3D Geospatial Visualization Engine (Mesh + Overlay Rendering)
- Load bathymetric mesh assets (`.glb`/`.gltf` format support)
- Render semi-transparent probability heatmap with configurable opacity
- Implement orbital camera controls (rotation/zoom/pan via mouse/touch)
- Toggle visualization modes:
  - **Legacy mode:** circular search radius overlay
  - **Optimized mode:** probability-weighted heatmap with threshold-based high-confidence zone highlighting

### 4) Impact Metrics Dashboard (Operational Effectiveness)
- Display computed metric (e.g., "58% reduction in initial search area")
- Quantify salvage time and cost implications
- Document **future capability extensions** (insurance analytics integration) for roadmap visibility

---

## Application Architecture (UI Scope)
1. **Landing View**
   - Problem domain introduction
   - System methodology overview
   - Primary navigation CTA to interactive visualization

2. **Interactive Geospatial Dashboard**
   - Incident parameter input panel (GPS, serial ID, route data, historical clusters)
   - 3D mesh rendering viewport with WebGL acceleration
   - Visualization mode toggle (legacy vs optimized)
   - Legend component with real-time metric badge

3. **Impact & Analytics View**
   - Search-area reduction performance metric
   - Operational value proposition (temporal/fiscal savings)
   - Product roadmap: insurance claim validation pipeline

---

## Technical Stack
- **Frontend Framework:** React.js with Three.js renderer (React Three Fiber integration option)
- **3D Asset Pipeline:** GLTFLoader for mesh deserialization
- **Heatmap Rendering:** Grid-based spatial sampling with color gradient mapping + vertex/plane overlay
- **Data Layer:** Local JSON fixtures (container registry, historical incident records, route samples)

No backend infrastructure required for MVP deployment.

**Dependencies:**
- `three.js` - WebGL 3D rendering engine
- `@react-three/fiber` - React renderer for Three.js (optional)
- `@react-three/drei` - Three.js helper utilities
- Standard React ecosystem (Vite/Next.js build toolchain)

---

## Demonstration Protocol (Evaluation Flow)
1. Begin at **Landing View**: present single-sentence problem statement for maritime recovery challenges.
2. Navigate to **Interactive Geospatial Dashboard**:
   - Initialize bathymetric mesh asset
   - Input synthetic incident parameters (GPS coordinates + container serial)
   - Display **legacy circular search pattern** (demonstrates baseline methodology with extensive search area)
   - Toggle to **optimized probability view** (displays focused zones near trajectory + cluster regions)
3. Conclude at **Impact & Analytics View**:
   - Present quantitative metric (area reduction percentage)
   - Reference insurance analytics as phase 2 development target