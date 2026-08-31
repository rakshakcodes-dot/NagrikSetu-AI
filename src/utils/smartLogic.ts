import {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  GoaTaluka,
  RoadType,
} from '../types';

interface PredictionResult {
  category: ComplaintCategory;
  confidence: number;
  matchedKeywords: string[];
}

// Keyword rules for predicting pothole/defect category
export function predictCategory(title: string, description: string): PredictionResult {
  const text = `${title} ${description}`.toLowerCase();

  const rules: { category: ComplaintCategory; keywords: string[]; weight: number }[] = [
    {
      category: 'Waterlogged Crater',
      keywords: ['water', 'rain', 'flooded', 'crater', 'waterlogged', 'monsoon', 'puddle', 'submerged', 'drain pool'],
      weight: 1.2,
    },
    {
      category: 'Deep Pothole',
      keywords: ['deep', 'huge', 'crater', 'big hole', 'skid', 'accident', 'depth', 'tyre burst', 'bottoming out', 'severe pit', 'large pothole'],
      weight: 1.0,
    },
    {
      category: 'Trench / Utility Cut',
      keywords: ['trench', 'pipe', 'pipeline', 'pwd cut', 'cable', 'digging', 'johar', 'sewerage', 'gas line', 'excavation', 'unfilled ditch'],
      weight: 1.1,
    },
    {
      category: 'Road Edge Erosion',
      keywords: ['edge', 'shoulder', 'erosion', 'side collapse', 'gutter edge', 'curb broke', 'soil wash', 'caved in side', 'narrowing'],
      weight: 1.0,
    },
    {
      category: 'Culvert / Bridge Depression',
      keywords: ['bridge', 'culvert', 'flyover', 'slab', 'depression', 'expansion joint', 'span', 'approach road sank', 'viaduct'],
      weight: 1.2,
    },
    {
      category: 'Manhole / Drain Hazard',
      keywords: ['manhole', 'cover missing', 'drain grill', 'chamber', 'sewer lid', 'grating broken', 'open drain', 'gutters'],
      weight: 1.3,
    },
    {
      category: 'Asphalt Surface Crack',
      keywords: ['crack', 'alligator', 'rough patch', 'peeling tar', 'uneven', 'loose gravel', 'tar worn', 'surface broken'],
      weight: 0.9,
    },
  ];

  let bestCategory: ComplaintCategory = 'Deep Pothole';
  let maxScore = 0;
  let matchedList: string[] = [];

  for (const rule of rules) {
    const matched = rule.keywords.filter((kw) => text.includes(kw));
    const score = matched.length * rule.weight;
    if (score > maxScore) {
      maxScore = score;
      bestCategory = rule.category;
      matchedList = matched;
    }
  }

  const confidence = Math.min(100, Math.round(maxScore * 30 + (matchedList.length > 0 ? 35 : 10)));

  return {
    category: bestCategory,
    confidence: maxScore > 0 ? confidence : 40,
    matchedKeywords: matchedList,
  };
}

// Calculate priority based on severity keywords, road classification, and waiting time
export function calculatePriority(
  category: ComplaintCategory,
  roadType: RoadType,
  createdAtDateStr?: string,
  extraDetails?: { isNearSchoolOrHospital?: boolean; trafficVolume?: 'high' | 'medium' | 'low' }
): { priority: ComplaintPriority; reason: string; waitDays: number } {
  let score = 0;
  const reasons: string[] = [];

  // 1. Road type severity
  if (roadType === 'National Highway') {
    score += 4;
    reasons.push('High-speed National Highway corridor (NH-66 / NH-748)');
  } else if (roadType === 'State Highway') {
    score += 3;
    reasons.push('High-traffic State Highway');
  } else if (roadType === 'Major District Road') {
    score += 2;
    reasons.push('Major District arterial link');
  } else {
    score += 1;
  }

  // 2. Category hazard
  if (category === 'Deep Pothole' || category === 'Waterlogged Crater' || category === 'Manhole / Drain Hazard') {
    score += 3;
    reasons.push('Critical two-wheeler skid & vehicle damage risk');
  } else if (category === 'Culvert / Bridge Depression' || category === 'Trench / Utility Cut') {
    score += 2;
    reasons.push('Structural transition hazard');
  } else {
    score += 1;
  }

  // 3. Waiting time calculation
  let waitDays = 0;
  if (createdAtDateStr) {
    const created = new Date(createdAtDateStr).getTime();
    const now = new Date().getTime();
    waitDays = Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
    if (waitDays >= 5) {
      score += 3;
      reasons.push(`Awaiting resolution for ${waitDays} days`);
    } else if (waitDays >= 2) {
      score += 1;
      reasons.push(`Awaiting resolution for ${waitDays} days`);
    }
  }

  if (extraDetails?.isNearSchoolOrHospital) {
    score += 2;
    reasons.push('Proximity to school/hospital zone');
  }

  let priority: ComplaintPriority = 'medium';
  if (score >= 6) {
    priority = 'high';
  } else if (score <= 3) {
    priority = 'low';
  } else {
    priority = 'medium';
  }

  return {
    priority,
    reason: reasons.join(' • ') || 'Standard road maintenance priority',
    waitDays,
  };
}

// Distance calculation using Haversine formula in Kilometers
export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest Goa Taluka from any given latitude and longitude
export function findNearestGoaTaluka(lat: number, lng: number): {
  taluka: GoaTaluka;
  distanceKm: number;
  isWithinGoa: boolean;
} {
  const isWithin = lat >= 14.8 && lat <= 15.9 && lng >= 73.6 && lng <= 74.4;

  let nearestTaluka: GoaTaluka = 'Panaji (Tiswadi)';
  let minDistance = Infinity;

  const talukas = Object.keys(GOA_TALUKA_COORDINATES) as GoaTaluka[];
  for (const t of talukas) {
    const coords = GOA_TALUKA_COORDINATES[t];
    const dist = getDistanceFromLatLonInKm(lat, lng, coords.lat, coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestTaluka = t;
    }
  }

  return {
    taluka: nearestTaluka,
    distanceKm: Math.round(minDistance * 10) / 10,
    isWithinGoa: isWithin,
  };
}

// Format coordinates nicely with Cardinal directions (e.g. 15.4989° N, 73.8278° E)
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}


// Proximity & category duplicate check
export function findNearbyDuplicate(
  params: {
    category: ComplaintCategory;
    location: {
      taluka: GoaTaluka;
      latitude: number;
      longitude: number;
      landmark?: string;
      roadName?: string;
    };
  },
  existingComplaints: Complaint[],
  thresholdKm = 1.5
): { duplicate: Complaint; distanceKm: number; matchReason: string } | null {
  const { category, location } = params;

  for (const c of existingComplaints) {
    // Only check unresolved complaints
    if (c.status === 'resolved') continue;

    // Check if category matches or is identical
    const isSameCategory = c.category.toLowerCase() === category.toLowerCase();
    const isRelatedCategory =
      (c.category === 'Deep Pothole' && category === 'Waterlogged Crater') ||
      (c.category === 'Waterlogged Crater' && category === 'Deep Pothole') ||
      (c.category === 'Asphalt Surface Crack' && category === 'Deep Pothole');

    const categoryMatches = isSameCategory || isRelatedCategory;

    // 1. Check GPS distance if coordinates exist
    if (c.location.latitude && c.location.longitude && location.latitude && location.longitude) {
      const dist = getDistanceFromLatLonInKm(
        location.latitude,
        location.longitude,
        c.location.latitude,
        c.location.longitude
      );

      // If category matches and is within threshold (1.5km), or within 250m regardless of category
      if ((categoryMatches && dist <= thresholdKm) || dist <= 0.25) {
        return {
          duplicate: c,
          distanceKm: Math.round(dist * 10) / 10,
          matchReason: `Active ${c.category} complaint #${c.id} (${c.title}) is located ${
            dist < 0.1 ? 'at the same spot' : `approx. ${(dist * 1000).toFixed(0)}m away`
          } in ${c.location.taluka}`,
        };
      }
    }

    // 2. Check same Taluka & similar road name / landmark text with matching category
    if (categoryMatches && c.location.taluka === location.taluka) {
      const targetStr = `${location.roadName || ''} ${location.landmark || ''}`.toLowerCase().trim();
      const existingStr = `${c.location.roadName || ''} ${c.location.landmark || ''}`.toLowerCase().trim();

      if (targetStr.length > 3 && existingStr.length > 3) {
        const words = targetStr.split(/\s+/).filter((w) => w.length > 3);
        const matched = words.some((w) => existingStr.includes(w));
        if (matched && words.length > 0) {
          return {
            duplicate: c,
            distanceKm: 0.4,
            matchReason: `Active ${c.category} complaint #${c.id} exists for a similar road or landmark in ${c.location.taluka}`,
          };
        }
      }
    }
  }

  return null;
}

// Generate unique sequential & branded complaint ID
export function generateComplaintId(): string {
  const year = 2026;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `GRF-${year}-${randomSuffix}`;
}

// Taluka coordinates map center points for realistic Goa geolocation
export const GOA_TALUKA_COORDINATES: Record<GoaTaluka, { lat: number; lng: number; defaultRoads: string[] }> = {
  'Panaji (Tiswadi)': {
    lat: 15.4989,
    lng: 73.8278,
    defaultRoads: ['18th June Road', 'Miramar Beach Road', 'DB Marg (Campal)', 'St. Inez Road', 'Ribandar Bypass'],
  },
  'Margao (Salcete)': {
    lat: 15.2736,
    lng: 73.958,
    defaultRoads: ['Colva Circle Road', 'Old Station Road', 'MMC Market Area', 'Fatorda Stadium Link', 'Navelim NH-66'],
  },
  'Mapusa (Bardez)': {
    lat: 15.5937,
    lng: 73.8142,
    defaultRoads: ['Gandhi Chowk', 'Kadamba Bus Stand Road', 'Khorlim-Anjuna Road', 'Morod Junction', 'Ganeshpuri Road'],
  },
  'Vasco da Gama (Mormugao)': {
    lat: 15.3982,
    lng: 73.8113,
    defaultRoads: ['Swatantra Path', 'Port Road (Baina)', 'FL Gomes Road', 'Mormugao Harbour Link', 'Vaddem Lake Road'],
  },
  'Ponda (Ponda)': {
    lat: 15.4026,
    lng: 74.0086,
    defaultRoads: ['Tisk Junction', 'Upper Bazaar Road', 'Farmagudi Highway', 'Durbhat Link', 'Curti Bypass'],
  },
  'Bicholim': {
    lat: 15.5921,
    lng: 73.9535,
    defaultRoads: ['Bicholim Market Road', 'Sanquelim Link', 'Bordem Main Road'],
  },
  'Curchorem (Quepem)': {
    lat: 15.2603,
    lng: 74.1084,
    defaultRoads: ['Sanvordem Bridge Road', 'Curchorem Railway Gate', 'Tilamol Junction'],
  },
  'Pernem': {
    lat: 15.7171,
    lng: 73.7947,
    defaultRoads: ['Mopa Airport Link Road', 'Pernem Bazaar Road', 'Malpe Junction'],
  },
};
