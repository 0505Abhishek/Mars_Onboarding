const express = require('express');
const router = express.Router();
const { userAuth } = require('../../util/auth');
const { getDetails } = require("../../util/jwt");
const channelController = require('../../controllers/super_channel/channel.controller');

router.get('/', userAuth, getDetails, channelController.renderChannelPage);
router.get('/add', userAuth, getDetails, channelController.renderAddChannelPage);
router.post('/addchannel', userAuth, getDetails, channelController.addChannel);
router.get('/edit/:id', userAuth, getDetails, channelController.renderEditChannelPage);
router.post('/updatechannel', userAuth, getDetails, channelController.updateChannel);

module.exports = router;