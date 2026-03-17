const express = require('express');
const router = express.Router();
const { userAuth } = require('../../util/auth');
const { getDetails } = require("../../util/jwt");
const territoryController = require('../../controllers/super_territory/territory.controller');

router.get('/', userAuth, getDetails, territoryController.renderTerritoryPage);
router.get('/add', userAuth, getDetails, territoryController.renderAddTerritoryPage);
router.post('/addterritory', userAuth, getDetails, territoryController.addTerritory);
router.get('/edit/:id', userAuth, getDetails, territoryController.renderEditTerritoryPage);
router.post('/updateterritory', userAuth, getDetails, territoryController.updateTerritory);

module.exports = router;