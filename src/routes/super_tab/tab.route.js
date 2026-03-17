const express = require('express');
const router = express.Router();
const { userAuth } = require('../../util/auth');
const { getDetails } = require("../../util/jwt");
const tabController = require('../../controllers/super_tab/tab.controller');

router.get('/:id', userAuth, getDetails, tabController.renderTabPage);
router.get('/edit/:id', userAuth, tabController.renderEditUserPage);
router.post('/get-territories', tabController.getTerritories);
router.post('/insert', tabController.insertUser);
router.post('/update', userAuth, tabController.updateUser);

module.exports = router;