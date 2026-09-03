/**
 * CrisisConnect AI Emergency Analyzer
 * 
 * Mock AI Service that performs keyword-based emergency intelligence extraction.
 * In production, this can be seamlessly replaced with a POST call to /api/emergencies/analyze.
 */

export const CATEGORY_OPTIONS = [
  { id: 'fire', name: 'Fire Emergency', icon: 'Flame', authority: 'Fire & Emergency Services', priority: 'P1', severity: 'Critical' },
  { id: 'rescue', name: 'Flood & Disaster Rescue', icon: 'LifeBuoy', authority: 'National Disaster Response Force (NDRF)', priority: 'P1', severity: 'Critical' },
  { id: 'medical', name: 'Medical Emergency', icon: 'Activity', authority: 'Emergency Medical Services (EMS)', priority: 'P1', severity: 'Critical' },
  { id: 'police', name: 'Police & Civil Safety', icon: 'ShieldAlert', authority: 'Police & Civil Defense Command', priority: 'P2', severity: 'High' },
  { id: 'food_water', name: 'Food & Water Relief', icon: 'Droplets', authority: 'Food & Shelter Relief Alliance', priority: 'P3', severity: 'Moderate' },
  { id: 'shelter', name: 'Emergency Shelter', icon: 'Home', authority: 'Civil Defense Shelter Operations', priority: 'P3', severity: 'Moderate' },
  { id: 'power', name: 'Hazard & Infrastructure', icon: 'Zap', authority: 'City Utility & Hazard Squad', priority: 'P2', severity: 'High' },
  { id: 'general', name: 'General Emergency', icon: 'AlertTriangle', authority: 'Disaster Operations Command (EOC)', priority: 'P3', severity: 'Moderate' },
];

export function analyzeEmergency(description = '', additionalDetails = {}) {
  const text = description.toLowerCase();

  // Keyword rules
  const fireKeywords = ['fire', 'smoke', 'burning', 'flame', 'blaze', 'explosion', 'ignited', 'burnt'];
  const medicalKeywords = ['accident', 'unconscious', 'injured', 'injury', 'bleeding', 'heart attack', 'cardiac', 'stroke', 'breath', 'diabetic', 'seizure', 'fainted', 'asthma'];
  const policeKeywords = ['attack', 'crime', 'robbery', 'robbed', 'violence', 'danger', 'weapon', 'gun', 'knife', 'theft', 'shooter', 'assault', 'threat'];
  const disasterKeywords = ['flood', 'water rising', 'trapped', 'submerged', 'drowning', 'cyclone', 'earthquake', 'landslide', 'tsunami', 'riverbank', 'inundation', 'water level', 'stranded'];
  const foodWaterKeywords = ['hungry', 'food', 'water', 'starvation', 'thirsty', 'rations', 'baby formula', 'drinking water', 'dehydrated'];
  const shelterKeywords = ['homeless', 'shelter', 'displaced', 'roof collapse', 'evacuated', 'blanket', 'cold', 'rain inside'];
  const hazardKeywords = ['gas leak', 'wire', 'power outage', 'blackout', 'transformer', 'spark', 'electric', 'pole fallen'];

  let matchedCategory;

  if (fireKeywords.some(k => text.includes(k))) {
    matchedCategory = CATEGORY_OPTIONS.find(c => c.id === 'fire');
  } else if (disasterKeywords.some(k => text.includes(k))) {
    matchedCategory = CATEGORY_OPTIONS.find(c => c.id === 'rescue');
  } else if (medicalKeywords.some(k => text.includes(k))) {
    matchedCategory = CATEGORY_OPTIONS.find(c => c.id === 'medical');
  } else if (policeKeywords.some(k => text.includes(k))) {
    matchedCategory = CATEGORY_OPTIONS.find(c => c.id === 'police');
  } else if (hazardKeywords.some(k => text.includes(k))) {
    matchedCategory = CATEGORY_OPTIONS.find(c => c.id === 'power');
  } else if (foodWaterKeywords.some(k => text.includes(k))) {
    matchedCategory = CATEGORY_OPTIONS.find(c => c.id === 'food_water');
  } else if (shelterKeywords.some(k => text.includes(k))) {
    matchedCategory = CATEGORY_OPTIONS.find(c => c.id === 'shelter');
  } else {
    matchedCategory = CATEGORY_OPTIONS.find(c => c.id === 'general');
  }

  // Evaluate Severity & Priority dynamically if vulnerabilities or hazards exist
  let priority = matchedCategory.priority;
  let severity = matchedCategory.severity;

  const hasVulnerable = (additionalDetails.vulnerabilities || []).length > 0;
  const peopleCount = Number(additionalDetails.peopleCount) || 1;

  if (peopleCount >= 5 || hasVulnerable) {
    if (priority === 'P2') priority = 'P1';
    if (priority === 'P3') priority = 'P2';
    if (severity === 'Moderate') severity = 'High';
  }

  // Priority Labels
  const priorityLabels = {
    P1: 'P1 — Immediate Response Required',
    P2: 'P2 — Urgent Response Needed',
    P3: 'P3 — Non-Life Threatening Assistance',
    P4: 'P4 — General Support',
  };

  // Generate unique tracking token CC-XXXXXX
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let tokenRand = '';
  for (let i = 0; i < 6; i++) {
    tokenRand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const trackingToken = `CC-${tokenRand}`;

  return {
    category: matchedCategory.name,
    categoryId: matchedCategory.id,
    categoryIcon: matchedCategory.icon,
    severity,
    priority,
    priorityLabel: priorityLabels[priority] || priority,
    authority: matchedCategory.authority,
    trackingToken,
    analyzedAt: new Date().toISOString(),
    confidenceScore: Math.floor(88 + Math.random() * 11) + '%',
    keywordsDetected: [
      ...fireKeywords.filter(k => text.includes(k)),
      ...disasterKeywords.filter(k => text.includes(k)),
      ...medicalKeywords.filter(k => text.includes(k)),
      ...policeKeywords.filter(k => text.includes(k)),
      ...foodWaterKeywords.filter(k => text.includes(k)),
      ...shelterKeywords.filter(k => text.includes(k)),
    ],
  };
}
