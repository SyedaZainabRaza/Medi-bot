export interface HospitalNode {
  id: string;
  name: string;
  x: number; // SVG viewBox coordinates
  y: number;
  type: 'public' | 'clinic' | 'emergency' | 'restricted' | 'connector';
  description?: string;
}

export interface HospitalEdge {
  from: string;
  to: string;
  weight: number; // Baseline distance cost
  isRestricted?: boolean; // Only passable by patients in EMERGENCY, or staff
}

export const HOSPITAL_NODES: HospitalNode[] = [
  { id: 'reception', name: 'Main Lobby Reception', x: 120, y: 150, type: 'public', description: 'Primary hospital check-in node and reception hub.' },
  { id: 'waiting_a', name: 'Waiting Lounge A', x: 60, y: 150, type: 'public', description: 'Patient greeting and comfortable seating bay.' },
  { id: 'waiting_b', name: 'Waiting Lounge B', x: 120, y: 90, type: 'public', description: 'Secondary seating with robotic sanitation support.' },
  { id: 'charging', name: 'Charging Station', x: 60, y: 220, type: 'restricted', description: 'V3 induction power base charging platform.' },
  { id: 'parking', name: 'Robot Parking Station', x: 120, y: 220, type: 'restricted', description: 'Idle docking port and base chassis garage.' },
  { id: 'pharmacy', name: 'Central Pharmacy', x: 200, y: 150, type: 'public', description: 'Prescription pickup, diagnostics lab, and drug vault.' },
  
  // Mid Connectors
  { id: 'elevators', name: 'Main Elevators Core A', x: 280, y: 150, type: 'connector', description: 'Express vertical elevator shaft connecting Floors 1-6.' },
  { id: 'crossroad', name: 'Central Cross Junction', x: 280, y: 90, type: 'connector', description: 'High-traffic corridor connecting all clinical quadrants.' },
  { id: 'stairs', name: 'Staircase North', x: 280, y: 30, type: 'connector', description: 'Stairwell emergency evacuation access corridor.' },
  
  // Emergency Hub
  { id: 'triage', name: 'Emergency Triage Space', x: 200, y: 90, type: 'emergency', description: 'Immediate trauma evaluation and routing berth.' },
  { id: 'er_hall', name: 'Trauma Wing Corridor', x: 120, y: 40, type: 'emergency', description: 'Severe trauma transition hallway. Keep clear.' },
  { id: 'icu', name: 'Intensive Care Unit (ICU)', x: 40, y: 40, type: 'emergency', description: 'Intensive therapy monitors and bio-support chambers.' },
  { id: 'ot_1', name: 'Operation Theater (OT)', x: 180, y: 40, type: 'emergency', description: 'Major surgical suites and high-precision medical machinery.' },
  
  // Specialist Clinics
  { id: 'cardiology', name: 'Cardiology Care Department', x: 360, y: 40, type: 'clinic', description: 'Cardiovascular screening chairs and ECG sensors.' },
  { id: 'neurology', name: 'Neurology Department', x: 440, y: 40, type: 'clinic', description: 'Synaptic neuro-scanning chairs and EEG telemetry.' },
  { id: 'orthopedics', name: 'Orthopedics & Joint Clinic', x: 520, y: 40, type: 'clinic', description: 'Splinting beds, bone repair casts, and walking supports.' },
  { id: 'dermatology', name: 'Dermatology Wing', x: 360, y: 90, type: 'clinic', description: 'Skin assessment chambers and custom sanitizing lasers.' },
  { id: 'labs', name: 'Laboratories & Pathology', x: 440, y: 90, type: 'clinic', description: 'Blood diagnostics centrifuge and automatic lab analyzers.' },
  { id: 'radiology', name: 'Radiology Imaging Suite', x: 520, y: 90, type: 'clinic', description: 'High-resolution MRI scanners and digital CT equipment.' },
  
  // Highly Restricted Zone
  { id: 'vault', name: 'Bio-Secured Research Lab', x: 440, y: 160, type: 'restricted', description: 'Restricted biological compound storage. Restricted personnel only.' },
  { id: 'maint', name: 'Core Server Room', x: 360, y: 220, type: 'restricted', description: 'Main servers and robotic chassis debug console.' }
];

export const HOSPITAL_EDGES: HospitalEdge[] = [
  // Lobby Connections
  { from: 'waiting_a', to: 'reception', weight: 60 },
  { from: 'waiting_b', to: 'reception', weight: 60 },
  { from: 'charging', to: 'reception', weight: 80, isRestricted: true },
  { from: 'parking', to: 'reception', weight: 70, isRestricted: true },
  { from: 'reception', to: 'pharmacy', weight: 80 },
  
  // Mid Connectors
  { from: 'pharmacy', to: 'elevators', weight: 80 },
  { from: 'elevators', to: 'crossroad', weight: 60 },
  { from: 'crossroad', to: 'stairs', weight: 60 },
  
  // Emergency Hub Connectors
  { from: 'reception', to: 'triage', weight: 70 },
  { from: 'triage', to: 'er_hall', weight: 80 },
  { from: 'er_hall', to: 'icu', weight: 80 },
  { from: 'er_hall', to: 'ot_1', weight: 60 },
  { from: 'triage', to: 'ot_1', weight: 90 },

  // Specialist Wing Connectors (East Corridor)
  { from: 'crossroad', to: 'cardiology', weight: 90 },
  { from: 'cardiology', to: 'neurology', weight: 80 },
  { from: 'neurology', to: 'orthopedics', weight: 80 },
  
  { from: 'crossroad', to: 'dermatology', weight: 80 },
  { from: 'dermatology', to: 'labs', weight: 80 },
  { from: 'labs', to: 'radiology', weight: 80 },
  
  // Vertical linkages on East block
  { from: 'cardiology', to: 'dermatology', weight: 50 },
  { from: 'neurology', to: 'labs', weight: 50 },
  { from: 'orthopedics', to: 'radiology', weight: 50 },

  // Restricted Vault Shortcut Links (Only searchable in emergency priority)
  { from: 'elevators', to: 'vault', weight: 160, isRestricted: true },
  { from: 'labs', to: 'vault', weight: 70, isRestricted: true },
  { from: 'radiology', to: 'vault', weight: 110, isRestricted: true },
  { from: 'vault', to: 'maint', weight: 100, isRestricted: true },
  { from: 'maint', to: 'parking', weight: 240, isRestricted: true }
];

// Straight-line heuristic distance for A*
export function getHeuristicDistance(n1: HospitalNode, n2: HospitalNode): number {
  const dx = n1.x - n2.x;
  const dy = n1.y - n2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * A* Pathfinding implementation for robot hospital navigation.
 * Accounts for:
 * 1. Restricted nodes (only accessible in isEmergency mode or with override)
 * 2. Blocked nodes/edges (dynamic obstacles, e.g., spilled fluids, elevator maintenance)
 * 3. Priority emergency routing (allows restricted shortcuts, which reduces distance)
 */
export function solvePath(
  startId: string,
  targetId: string,
  options: {
    isEmergency?: boolean;
    allowRestricted?: boolean;
    blockedNodeIds?: Set<string>;
    dynamicEdgeCosts?: Record<string, number>; // key is "from-to" or "to-from" string
  } = {}
): string[] {
  const {
    isEmergency = false,
    allowRestricted = false,
    blockedNodeIds = new Set<string>(),
    dynamicEdgeCosts = {}
  } = options;

  const nodesMap = new Map<string, HospitalNode>();
  HOSPITAL_NODES.forEach(n => nodesMap.set(n.id, n));

  const startNode = nodesMap.get(startId);
  const targetNode = nodesMap.get(targetId);

  if (!startNode || !targetNode) {
    return [];
  }

  // Pre-filter: Check if start or target are blocked
  if (blockedNodeIds.has(startId) || blockedNodeIds.has(targetId)) {
    return [];
  }

  // A* trackers
  const openSet = new Set<string>([startId]);
  const cameFrom = new Map<string, string>();

  const gScore = new Map<string, number>(); // Actual cost from start to node
  HOSPITAL_NODES.forEach(n => gScore.set(n.id, Infinity));
  gScore.set(startId, 0);

  const fScore = new Map<string, number>(); // Estimated total cost
  HOSPITAL_NODES.forEach(n => fScore.set(n.id, Infinity));
  fScore.set(startId, getHeuristicDistance(startNode, targetNode));

  // Build adjacency list
  const adj = new Map<string, Array<{ to: string; weight: number; isRestricted: boolean }>>();
  HOSPITAL_NODES.forEach(n => adj.set(n.id, []));

  HOSPITAL_EDGES.forEach(e => {
    // Bidirectional edges
    adj.get(e.from)?.push({ to: e.to, weight: e.weight, isRestricted: !!e.isRestricted });
    adj.get(e.to)?.push({ to: e.from, weight: e.weight, isRestricted: !!e.isRestricted });
  });

  while (openSet.size > 0) {
    // Node in openSet with lowest fScore
    let currentId = '';
    let lowestF = Infinity;
    openSet.forEach(id => {
      const f = fScore.get(id) ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        currentId = id;
      }
    });

    if (currentId === targetId) {
      // Reconstruct path
      const path: string[] = [currentId];
      let curr = currentId;
      while (cameFrom.has(curr)) {
        curr = cameFrom.get(curr)!;
        path.unshift(curr);
      }
      return path;
    }

    openSet.delete(currentId);
    const neighbors = adj.get(currentId) || [];

    for (const neighbor of neighbors) {
      const neighborId = neighbor.to;

      // Rule 1: Skip if neighbor node is in blocked list (dynamic obstacle)
      if (blockedNodeIds.has(neighborId)) {
        continue;
      }

      // Rule 2: Check restrictions.
      // Restricted zones are only accessible under emergency priority (isEmergency is true)
      // or if explicitly allowed (e.g. staff command bypass 'allowRestricted')
      const targetNodeData = nodesMap.get(neighborId);
      const isRestrictedTarget = targetNodeData?.type === 'restricted' || neighbor.isRestricted;
      if (isRestrictedTarget && !isEmergency && !allowRestricted) {
        // Under non-emergency, avoid restricted node
        continue;
      }

      // Dynamic edge weight adjustments
      let edgeCost = neighbor.weight;
      const costKey1 = `${currentId}-${neighborId}`;
      const costKey2 = `${neighborId}-${currentId}`;
      if (dynamicEdgeCosts[costKey1] !== undefined) {
        edgeCost = dynamicEdgeCosts[costKey1];
      } else if (dynamicEdgeCosts[costKey2] !== undefined) {
        edgeCost = dynamicEdgeCosts[costKey2];
      }

      // Compute potential gScore
      const tentativeG = (gScore.get(currentId) ?? Infinity) + edgeCost;

      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, currentId);
        gScore.set(neighborId, tentativeG);
        
        const neighborNode = nodesMap.get(neighborId)!;
        fScore.set(neighborId, tentativeG + getHeuristicDistance(neighborNode, targetNode));

        if (!openSet.has(neighborId)) {
          openSet.add(neighborId);
        }
      }
    }
  }

  // Return empty array if path is unresolvable
  return [];
}
