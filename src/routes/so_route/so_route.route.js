const express = require('express');
const router = express.Router();
const soController = require('../../controllers/super_so/so.controller');
const { userAuth } = require("../../util/auth");

const { getDetails } = require("../../util/jwt");

router.get('/', userAuth, getDetails, soController.renderSoPage);
router.route('/add').get(userAuth, getDetails, soController.renderAddSoPage).post(userAuth, soController.AddSoTerritory);

router.get('/Asmterritory', userAuth, getDetails, soController.renderAsmTerritory);
router.route('/updateterritory/:id').get(userAuth, getDetails, soController.renderUpdateterritory).post(userAuth, soController.AddSoTerritory);
router.route('/updateterritory')
  .post(userAuth, soController.updateSoTerritory);

// router.post('/addregion', userAuth, getDetails, soController.addRegion);
// router.post('/edit', userAuth, getDetails, soController.editRegion);

module.exports = router;