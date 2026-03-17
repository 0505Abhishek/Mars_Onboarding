const express = require('express');
const router = express.Router();
const regionController = require('../../controllers/super_region/region.controller');
const { userAuth } = require("../../util/auth");

const { getDetails } = require("../../util/jwt");

router.get('/', userAuth, getDetails, regionController.renderRegionPage);
router.get('/add', userAuth, getDetails, regionController.renderAddRegionPage);
router.post('/addregion', userAuth, getDetails, regionController.addRegion);
router.post('/edit', userAuth, getDetails, regionController.editRegion);

module.exports = router;