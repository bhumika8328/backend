// All REST routes in one readable place. Everything under /api goes through auth middleware.
const router = require('express').Router();
const auth = require('../middleware/auth');
const { validatePoint } = require('../middleware/validate');
const location = require('../controllers/locationController');
const students = require('../controllers/studentController');
const sos = require('../controllers/sosController');
const alerts = require('../controllers/alertController');

router.use(auth);

// Phone B -> backend
router.post('/location', validatePoint, location.postLocation);
router.post('/sos', validatePoint, sos.postSos);

// Faculty App -> backend
router.get('/students', students.listStudents);
router.get('/students/:studentId/location', location.getLatestLocation);
router.get('/students/:studentId/risk', students.getRisk);
router.get('/alerts', alerts.listAlerts);
router.get('/alerts/:id', alerts.getAlert);
router.post('/alerts/:id/acknowledge', alerts.acknowledgeAlert);

module.exports = router;
