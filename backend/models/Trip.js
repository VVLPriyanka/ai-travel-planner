const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    estimatedCostINR: { type: Number, default: 0, min: 0 },
    timeOfDay: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening'],
      default: 'Morning',
    },
  },
  { _id: true }
);

const ItineraryDaySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true, min: 1 },
    theme: { type: String, default: '', trim: true },
    activities: [ActivitySchema],
  },
  { _id: false }
);

const HotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    tier: { type: String, default: 'Mid Range', trim: true },
    estimatedCostNightINR: { type: Number, default: 0, min: 0 },
    rating: { type: String, default: '4.0/5' },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const PackingItemSchema = new mongoose.Schema(
  {
    item: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Documents', 'Clothing', 'Gear', 'Other'],
      default: 'Other',
    },
    reason: { type: String, default: '' }, // why the AI included this item
    isPacked: { type: Boolean, default: false },
  },
  { _id: true }
);

const TripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // every query is scoped by this field -> data isolation
    },
    destination: { type: String, required: true, trim: true },
    durationDays: { type: Number, required: true, min: 1, max: 30 },
    budgetTier: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true,
    },
    interests: [{ type: String, trim: true }],

    itinerary: [ItineraryDaySchema],

    estimatedBudget: {
      transport: { type: Number, default: 0 },
      accommodation: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },

    hotels: [HotelSchema],

    // --- Creative feature: Weather-Aware Packing Assistant ---
    climateSummary: { type: String, default: '' },
    packingList: [PackingItemSchema],

    generationSource: {
      type: String,
      enum: ['gemini', 'mock'],
      default: 'mock',
    },
  },
  { timestamps: true }
);

TripSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Trip', TripSchema);
