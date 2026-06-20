const Trip = require('../models/Trip');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const aiService = require('../services/aiService');

const VALID_BUDGET_TIERS = ['Low', 'Medium', 'High'];
const VALID_TIME_OF_DAY = ['Morning', 'Afternoon', 'Evening'];

/** Recomputes the "activities" and "total" budget fields from the live itinerary. */
function recomputeBudget(trip) {
  const activitiesSum = trip.itinerary.reduce(
    (sum, day) => sum + day.activities.reduce((s, a) => s + (a.estimatedCostINR || 0), 0),
    0
  );
  trip.estimatedBudget.activities = activitiesSum;
  trip.estimatedBudget.total =
    (trip.estimatedBudget.transport || 0) +
    (trip.estimatedBudget.accommodation || 0) +
    (trip.estimatedBudget.food || 0) +
    activitiesSum;
}

/** Fetches a trip and throws 404/403-as-404 if it doesn't belong to the requesting user. */
async function getOwnedTrip(tripId, userId) {
  const trip = await Trip.findOne({ _id: tripId, userId });
  if (!trip) {
    // Use 404 (not 403) so we never confirm/deny existence of another user's trip
    throw new ApiError(404, 'Trip not found.');
  }
  return trip;
}

// POST /api/trips  — create a trip and generate itinerary + budget + hotels + packing list
const createTrip = asyncHandler(async (req, res) => {
  const { destination, durationDays, budgetTier, interests } = req.body;

  if (!destination || !durationDays || !budgetTier) {
    throw new ApiError(400, 'destination, durationDays, and budgetTier are required.');
  }
  if (!VALID_BUDGET_TIERS.includes(budgetTier)) {
    throw new ApiError(400, `budgetTier must be one of: ${VALID_BUDGET_TIERS.join(', ')}`);
  }
  const days = Number(durationDays);
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    throw new ApiError(400, 'durationDays must be an integer between 1 and 30.');
  }

  const generated = await aiService.generateItinerary({
    destination,
    durationDays: days,
    budgetTier,
    interests: Array.isArray(interests) ? interests : [],
  });

  const packing = await aiService.generatePackingList({
    destination,
    interests: Array.isArray(interests) ? interests : [],
    durationDays: days,
  });

  const trip = await Trip.create({
    userId: req.user.id,
    destination,
    durationDays: days,
    budgetTier,
    interests: Array.isArray(interests) ? interests : [],
    itinerary: generated.itinerary,
    hotels: generated.hotels,
    estimatedBudget: generated.estimatedBudget,
    climateSummary: packing.climateSummary,
    packingList: packing.packingList,
    generationSource: generated.source === 'gemini' ? 'gemini' : 'mock',
  });

  res.status(201).json(trip);
});

// GET /api/trips — list the authenticated user's trips only
const getTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(trips);
});

// GET /api/trips/:id
const getTripById = asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.params.id, req.user.id);
  res.json(trip);
});

// DELETE /api/trips/:id
const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.params.id, req.user.id);
  await trip.deleteOne();
  res.json({ message: 'Trip deleted.' });
});

// POST /api/trips/:id/activities — add a new activity to a specific day
const addActivity = asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.params.id, req.user.id);
  const { dayNumber, title, description, estimatedCostINR, timeOfDay } = req.body;

  if (!dayNumber || !title) {
    throw new ApiError(400, 'dayNumber and title are required.');
  }
  if (timeOfDay && !VALID_TIME_OF_DAY.includes(timeOfDay)) {
    throw new ApiError(400, `timeOfDay must be one of: ${VALID_TIME_OF_DAY.join(', ')}`);
  }

  const day = trip.itinerary.find((d) => d.dayNumber === Number(dayNumber));
  if (!day) {
    throw new ApiError(404, `Day ${dayNumber} does not exist on this trip.`);
  }

  day.activities.push({
    title,
    description: description || '',
    estimatedCostINR: Number(estimatedCostINR) || 0,
    timeOfDay: timeOfDay || 'Afternoon',
  });

  recomputeBudget(trip);
  await trip.save();
  res.status(201).json(trip);
});

// DELETE /api/trips/:id/activities/:activityId — remove a single activity
const removeActivity = asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.params.id, req.user.id);
  const { activityId } = req.params;

  let found = false;
  trip.itinerary.forEach((day) => {
    const before = day.activities.length;
    day.activities = day.activities.filter((a) => String(a._id) !== activityId);
    if (day.activities.length !== before) found = true;
  });

  if (!found) {
    throw new ApiError(404, 'Activity not found on this trip.');
  }

  recomputeBudget(trip);
  await trip.save();
  res.json(trip);
});

// POST /api/trips/:id/regenerate-day — AI regenerates one day based on feedback
const regenerateDay = asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.params.id, req.user.id);
  const { dayNumber, feedback } = req.body;

  if (!dayNumber) {
    throw new ApiError(400, 'dayNumber is required.');
  }

  const dayIndex = trip.itinerary.findIndex((d) => d.dayNumber === Number(dayNumber));
  if (dayIndex === -1) {
    throw new ApiError(404, `Day ${dayNumber} does not exist on this trip.`);
  }

  const newDay = await aiService.regenerateDay({
    destination: trip.destination,
    budgetTier: trip.budgetTier,
    interests: trip.interests,
    dayNumber: Number(dayNumber),
    feedback: feedback || '',
  });

  trip.itinerary[dayIndex] = {
    dayNumber: Number(dayNumber),
    theme: newDay.theme || trip.itinerary[dayIndex].theme,
    activities: newDay.activities || [],
  };

  recomputeBudget(trip);
  await trip.save();
  res.json(trip);
});

// PATCH /api/trips/:id/packing/:itemId — toggle a packing list item's checked state
const togglePackingItem = asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.params.id, req.user.id);
  const item = trip.packingList.id(req.params.itemId);

  if (!item) {
    throw new ApiError(404, 'Packing item not found on this trip.');
  }

  item.isPacked = typeof req.body.isPacked === 'boolean' ? req.body.isPacked : !item.isPacked;
  await trip.save();
  res.json(trip);
});

// POST /api/trips/:id/packing/regenerate — regenerate the AI packing checklist
const regeneratePackingList = asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.params.id, req.user.id);

  const packing = await aiService.generatePackingList({
    destination: trip.destination,
    interests: trip.interests,
    durationDays: trip.durationDays,
  });

  trip.climateSummary = packing.climateSummary;
  trip.packingList = packing.packingList;
  await trip.save();
  res.json(trip);
});

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  deleteTrip,
  addActivity,
  removeActivity,
  regenerateDay,
  togglePackingItem,
  regeneratePackingList,
};
