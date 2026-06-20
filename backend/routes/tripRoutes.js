const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  createTrip,
  getTrips,
  getTripById,
  deleteTrip,
  addActivity,
  removeActivity,
  regenerateDay,
  togglePackingItem,
  regeneratePackingList,
} = require('../controllers/tripController');

const router = express.Router();

// Every route below requires a valid JWT, and every controller scopes
// its query by req.user.id — this is what enforces multi-user isolation.
router.use(requireAuth);

router.post('/', createTrip);
router.get('/', getTrips);
router.get('/:id', getTripById);
router.delete('/:id', deleteTrip);

router.post('/:id/activities', addActivity);
router.delete('/:id/activities/:activityId', removeActivity);

router.post('/:id/regenerate-day', regenerateDay);

router.patch('/:id/packing/:itemId', togglePackingItem);
router.post('/:id/packing/regenerate', regeneratePackingList);

module.exports = router;
