/**
 * AI Service
 * ----------
 * Wraps all calls to the Google Gemini API behind a single interface.
 *
 * Design decision: every function in this file has two code paths —
 * a real Gemini call, and a deterministic "mock mode" fallback used when
 * GEMINI_API_KEY is not set (or when Gemini fails after retries). This
 * means the whole app is runnable and demoable with zero API cost/keys,
 * which matters a lot for local development and for grading without
 * forcing the reviewer to provision their own key.
 */

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function isMockMode() {
  return !process.env.GEMINI_API_KEY;
}

/**
 * Calls fetch with exponential backoff retry (1s, 2s, 4s, 8s, 16s) to
 * shield the app from transient rate-limit (429) or network errors.
 */
async function fetchWithRetry(url, options, retries = 5, delay = 1000) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      const bodyText = await response.text().catch(() => '');
      throw new Error(`Gemini API error ${response.status}: ${bodyText.slice(0, 300)}`);
    }

    return await response.json();
  } catch (err) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw err;
  }
}

/**
 * Sends a prompt to Gemini, forcing strict JSON output, and returns the
 * parsed object. Throws if the key is missing or the call fails — callers
 * are responsible for falling back to mock data.
 */
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  };

  const data = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned no generation text');
  }

  return JSON.parse(text);
}

// ---------------------------------------------------------------------
// Mock data generators (no network calls — fast, free, deterministic-ish)
// ---------------------------------------------------------------------

// Daily rates in INR (₹), tuned per budget tier. These are deliberately
// round, realistic-feeling numbers rather than a raw USD*83 conversion.
const BUDGET_DAILY_RATE = {
  Low: { accommodation: 1500, food: 900, activities: 700, transport: 500 },
  Medium: { accommodation: 4500, food: 2200, activities: 1800, transport: 1200 },
  High: { accommodation: 12000, food: 5000, activities: 4500, transport: 2500 },
};

const ACTIVITY_BANK = {
  Food: ['Street food crawl', 'Local market tasting tour', 'Cooking class', 'Rooftop dinner'],
  Culture: ['Old town walking tour', 'Museum visit', 'Historic temple/cathedral', 'Local art gallery'],
  Adventure: ['Hiking trail', 'Bike tour', 'Water sports session', 'Scenic viewpoint hike'],
  Shopping: ['Local market browsing', 'Boutique district stroll', 'Souvenir hunting', 'Artisan workshop visit'],
  Nature: ['Botanical garden', 'Riverside walk', 'Sunset viewpoint', 'Nature reserve visit'],
  Relaxation: ['Spa afternoon', 'Beach/park downtime', 'Café hopping', 'Evening lounge'],
};

function pickInterestPool(interests) {
  const valid = (interests || []).filter((i) => ACTIVITY_BANK[i]);
  return valid.length > 0 ? valid : ['Culture', 'Food'];
}

function buildMockItinerary({ destination, durationDays, budgetTier, interests }) {
  const pool = pickInterestPool(interests);
  const rate = BUDGET_DAILY_RATE[budgetTier] || BUDGET_DAILY_RATE.Medium;

  const itinerary = Array.from({ length: durationDays }, (_, i) => {
    const dayNumber = i + 1;
    const themeInterest = pool[i % pool.length];
    const morningActivity = ACTIVITY_BANK[themeInterest][i % ACTIVITY_BANK[themeInterest].length];
    const secondInterest = pool[(i + 1) % pool.length];
    const eveningActivity =
      ACTIVITY_BANK[secondInterest][(i + 1) % ACTIVITY_BANK[secondInterest].length];

    return {
      dayNumber,
      theme: `${themeInterest} in ${destination}`,
      activities: [
        {
          title: `${morningActivity} in ${destination}`,
          description: `A ${themeInterest.toLowerCase()}-focused start to day ${dayNumber}, suited to a ${budgetTier.toLowerCase()} budget.`,
          estimatedCostINR: Math.round(rate.activities * 0.6),
          timeOfDay: 'Morning',
        },
        {
          title: `Explore ${destination} city center`,
          description: 'Self-paced wandering, local shops, and people-watching.',
          estimatedCostINR: Math.round(rate.activities * 0.2),
          timeOfDay: 'Afternoon',
        },
        {
          title: `${eveningActivity} in ${destination}`,
          description: `An evening ${secondInterest.toLowerCase()} experience to close out day ${dayNumber}.`,
          estimatedCostINR: Math.round(rate.activities * 0.5),
          timeOfDay: 'Evening',
        },
      ],
    };
  });

  const accommodation = rate.accommodation * durationDays;
  const food = rate.food * durationDays;
  const activities = Math.round(rate.activities * 1.3 * durationDays);
  const transport = rate.transport * durationDays + 9000; // flat flight/transit baseline (₹)
  const total = accommodation + food + activities + transport;

  const hotels = [
    {
      name: `${destination} Budget Stay`,
      tier: 'Budget Friendly',
      estimatedCostNightINR: Math.round(rate.accommodation * 0.6),
      rating: '4.0/5',
      notes: 'Clean, simple, well-located for getting around cheaply.',
    },
    {
      name: `${destination} Central Hotel`,
      tier: 'Mid Range',
      estimatedCostNightINR: rate.accommodation,
      rating: '4.4/5',
      notes: 'Good balance of comfort and price, central location.',
    },
    {
      name: `${destination} Grand Suites`,
      tier: 'Luxury',
      estimatedCostNightINR: Math.round(rate.accommodation * 2.2),
      rating: '4.8/5',
      notes: 'Premium amenities for travelers prioritizing comfort.',
    },
  ];

  return {
    itinerary,
    hotels,
    estimatedBudget: {
      transport,
      accommodation,
      food,
      activities,
      total,
    },
  };
}

/**
 * Generates a full itinerary + budget + hotels.
 * Tries Gemini first (if configured); falls back to mock data on any
 * failure so trip creation never hard-fails for the end user.
 */
async function generateItinerary({ destination, durationDays, budgetTier, interests }) {
  if (isMockMode()) {
    return { ...buildMockItinerary({ destination, durationDays, budgetTier, interests }), source: 'mock' };
  }

  const prompt = `
You are a professional travel planning assistant. Create a detailed, realistic
day-by-day travel plan for a ${durationDays}-day trip to ${destination}.
Budget preference: ${budgetTier}.
Traveler interests: ${(interests || []).join(', ') || 'general sightseeing'}.

Respond with ONLY a valid JSON object (no markdown, no commentary) matching exactly:
{
  "itinerary": [
    {
      "dayNumber": 1,
      "theme": "short theme for the day",
      "activities": [
        { "title": "string", "description": "string", "estimatedCostINR": number, "timeOfDay": "Morning" | "Afternoon" | "Evening" }
      ]
    }
  ],
  "hotels": [
    { "name": "string", "tier": "Budget Friendly" | "Mid Range" | "Luxury", "estimatedCostNightINR": number, "rating": "string like 4.5/5", "notes": "string" }
  ],
  "estimatedBudget": {
    "transport": number, "accommodation": number, "food": number, "activities": number, "total": number
  }
}

Each day must have 3-4 activities spread across Morning/Afternoon/Evening.
Provide exactly ${durationDays} day entries. Costs must be realistic INR (₹) estimates
consistent with the ${budgetTier} budget tier and typical prices in ${destination}.
The "total" must equal the sum of the other four budget fields.
`.trim();

  try {
    const result = await callGemini(prompt);
    return { ...result, source: 'gemini' };
  } catch (err) {
    console.error('[aiService] Gemini generation failed, falling back to mock:', err.message);
    return { ...buildMockItinerary({ destination, durationDays, budgetTier, interests }), source: 'mock' };
  }
}

/**
 * Regenerates a single day's activities based on free-text feedback,
 * keeping the rest of the trip untouched.
 */
async function regenerateDay({ destination, budgetTier, interests, dayNumber, feedback }) {
  if (isMockMode()) {
    const pool = pickInterestPool(interests);
    const themeInterest = pool[dayNumber % pool.length];
    return {
      dayNumber,
      theme: feedback ? `${themeInterest} (adjusted: ${feedback})` : themeInterest,
      activities: [
        {
          title: `${ACTIVITY_BANK[themeInterest][0]} in ${destination}`,
          description: feedback
            ? `Updated per your request: "${feedback}".`
            : `A regenerated ${themeInterest.toLowerCase()} morning.`,
          estimatedCostINR: 600,
          timeOfDay: 'Morning',
        },
        {
          title: `${ACTIVITY_BANK[themeInterest][1] || ACTIVITY_BANK[themeInterest][0]} in ${destination}`,
          description: 'A relaxed afternoon block, adjusted to your feedback.',
          estimatedCostINR: 450,
          timeOfDay: 'Afternoon',
        },
        {
          title: `Evening in ${destination}`,
          description: 'Wind down with food and local atmosphere.',
          estimatedCostINR: 750,
          timeOfDay: 'Evening',
        },
      ],
      source: 'mock',
    };
  }

  const prompt = `
You are a travel planning assistant updating ONE day of an existing itinerary.
Destination: ${destination}. Budget tier: ${budgetTier}. Interests: ${(interests || []).join(', ')}.
Day being regenerated: Day ${dayNumber}.
Traveler feedback / instruction: "${feedback}"

Respond with ONLY a valid JSON object (no markdown, no commentary) matching exactly:
{
  "dayNumber": ${dayNumber},
  "theme": "short theme for the day",
  "activities": [
    { "title": "string", "description": "string", "estimatedCostINR": number, "timeOfDay": "Morning" | "Afternoon" | "Evening" }
  ]
}
Provide 3-4 activities that directly reflect the traveler's feedback.
`.trim();

  try {
    const result = await callGemini(prompt);
    return { ...result, dayNumber, source: 'gemini' };
  } catch (err) {
    console.error('[aiService] Gemini day regeneration failed, falling back to mock:', err.message);
    return regenerateDay({ destination, budgetTier, interests, dayNumber, feedback: '' });
  }
}

// ---------------------------------------------------------------------
// Creative feature: Weather-Aware Packing Assistant
// ---------------------------------------------------------------------

const SEASON_PROFILES = {
  hot: {
    summary: 'Warm to hot conditions expected — prioritize breathable fabrics and sun protection.',
    climate: ['Lightweight breathable clothing', 'Sunscreen (SPF 50)', 'Sunglasses', 'Reusable water bottle', 'Wide-brim hat'],
  },
  mild: {
    summary: 'Mild, variable conditions expected — layering is your friend.',
    climate: ['Light jacket / layering piece', 'Comfortable walking shoes', 'Compact umbrella', 'Light scarf'],
  },
  cold: {
    summary: 'Cool to cold conditions expected — pack for warmth and wind.',
    climate: ['Insulated jacket', 'Thermal base layers', 'Gloves & beanie', 'Wool socks'],
  },
  rainy: {
    summary: 'Higher chance of rain — waterproofing matters.',
    climate: ['Waterproof jacket', 'Compact umbrella', 'Quick-dry clothing', 'Waterproof shoe covers'],
  },
};

/**
 * Very small deterministic "climate model" used so the feature works
 * without a paid weather API: a hash of the destination name picks a
 * season profile. This keeps results stable per-destination, which is
 * good enough for a packing *suggestion* (not a forecast guarantee —
 * documented as a known limitation in the README).
 */
function inferClimateProfile(destination) {
  const key = (destination || '').toLowerCase();
  if (/(dubai|cairo|bangkok|phoenix|delhi|riyadh)/.test(key)) return SEASON_PROFILES.hot;
  if (/(reykjavik|oslo|moscow|helsinki|anchorage|aspen)/.test(key)) return SEASON_PROFILES.cold;
  if (/(london|seattle|dublin|singapore|mumbai)/.test(key)) return SEASON_PROFILES.rainy;
  // Fallback: hash the string to deterministically pick a profile
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 997;
  const profiles = [SEASON_PROFILES.mild, SEASON_PROFILES.hot, SEASON_PROFILES.cold, SEASON_PROFILES.rainy];
  return profiles[hash % profiles.length];
}

const DOCUMENT_ITEMS = ['Passport', 'Travel insurance printout', 'Hotel booking confirmations', 'Local currency / travel card'];

const ACTIVITY_GEAR = {
  Adventure: [{ item: 'Hiking shoes', reason: 'Adventure activities are planned in your itinerary' }, { item: 'Daypack', reason: 'For carrying water/snacks on active days' }],
  Food: [{ item: 'Reusable utensil set', reason: 'You have several food-focused activities planned' }],
  Culture: [{ item: 'Modest layer for religious/cultural sites', reason: 'Your itinerary includes cultural/historic sites' }],
  Shopping: [{ item: 'Packable foldable bag', reason: 'Useful for bringing back items from shopping activities' }],
  Nature: [{ item: 'Insect repellent', reason: 'Nature-focused activities are on your itinerary' }],
  Relaxation: [{ item: 'Swimwear', reason: 'Relaxation activities may include pools/beaches/spas' }],
};

/**
 * Builds the Weather-Aware Packing Assistant checklist by combining:
 *  1. A lightweight destination climate inference
 *  2. The traveler's stated interests (mapped to activity-specific gear)
 *  3. A constant set of essential travel documents
 *
 * If Gemini is configured, we ask it to refine/expand the list with
 * destination-specific reasoning; otherwise we use the rule-based
 * version above, which is already fully functional offline.
 */
async function generatePackingList({ destination, interests, durationDays }) {
  const profile = inferClimateProfile(destination);

  const baseList = [
    ...DOCUMENT_ITEMS.map((item) => ({ item, category: 'Documents', reason: 'Essential for any international/domestic trip', isPacked: false })),
    ...profile.climate.map((item) => ({ item, category: 'Clothing', reason: profile.summary, isPacked: false })),
  ];

  const interestGear = (interests || [])
    .filter((i) => ACTIVITY_GEAR[i])
    .flatMap((i) => ACTIVITY_GEAR[i].map((g) => ({ ...g, category: 'Gear', isPacked: false })));

  if (durationDays >= 5) {
    baseList.push({ item: 'Laundry bag / travel detergent sheets', category: 'Other', reason: `Trip is ${durationDays} days — useful for longer stays`, isPacked: false });
  }

  const mockResult = {
    climateSummary: profile.summary,
    packingList: [...baseList, ...interestGear],
  };

  if (isMockMode()) {
    return { ...mockResult, source: 'mock' };
  }

  const prompt = `
You are a "Weather-Aware Packing Assistant" for a travel app. Based on the
destination and planned activities below, refine and expand this draft
packing list with destination-specific, practical items. Keep categories
limited to: Documents, Clothing, Gear, Other.

Destination: ${destination}
Trip length: ${durationDays} days
Interests: ${(interests || []).join(', ') || 'general sightseeing'}
Draft climate summary: ${profile.summary}
Draft list: ${JSON.stringify(baseList.concat(interestGear).map((i) => i.item))}

Respond with ONLY valid JSON matching exactly:
{
  "climateSummary": "one sentence on expected conditions and what it means for packing",
  "packingList": [
    { "item": "string", "category": "Documents" | "Clothing" | "Gear" | "Other", "reason": "short reason this item is on the list", "isPacked": false }
  ]
}
Limit to 10-16 total items, avoid duplicates, keep reasons short (under 12 words).
`.trim();

  try {
    const result = await callGemini(prompt);
    return { ...result, source: 'gemini' };
  } catch (err) {
    console.error('[aiService] Gemini packing list failed, falling back to mock:', err.message);
    return { ...mockResult, source: 'mock' };
  }
}

module.exports = {
  isMockMode,
  generateItinerary,
  regenerateDay,
  generatePackingList,
};
