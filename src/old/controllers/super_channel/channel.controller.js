const channelModel = require('../../models/super_channel/channel.model');
const navbar = require('../../models/navbar.model');
const { decryptData } = require('../../util/encryption');

const renderChannelPage = async (req, res) => {
    try {
        let email = decryptData(req.cookies.e);
        let data = await navbar.selectQuery(email);
        let navbarviews = await navbar.navbarviewesult(data);
        
        const channels = await channelModel.getAllChannels();
        
        res.render('channel/index', { 
            title: 'Channel Management', 
            token: navbarviews,
            channels,
            success: req.session.success,
            error: req.session.error,
            user: req.session.user 
        });
    } catch (error) {
        console.error('Error rendering channel page:', error);
        req.session.error = 'Failed to load channel page';
        res.redirect('/dashboard');
    }
};

const renderAddChannelPage = async (req, res) => {
    try {
        let email = decryptData(req.cookies.e);
        let data = await navbar.selectQuery(email);
        let navbarviews = await navbar.navbarviewesult(data);
        
        res.render('channel/add', { 
            title: 'Add Channel', 
            token: navbarviews,
            success: req.session.success,
            error: req.session.error,
            user: req.session.user 
        });
    } catch (error) {
        console.error('Error rendering add channel page:', error);
        req.session.error = 'Failed to load add channel page';
        res.redirect('/dashboard');
    }
};

const addChannel = async (req, res) => {
    try {
        const { channel_name } = req.body;
        
        if (!channel_name) {
            req.session.error = 'Channel name is required';
            return res.redirect('/channel/add');
        }

        const result = await channelModel.createChannel({
            channel_name
        });

        if (result) {
            req.session.success = 'Channel added successfully';
        } else {
            req.session.error = 'Failed to add channel';
        }
        
        res.redirect('/channel');
    } catch (error) {
        console.error('Error adding channel:', error);
        req.session.error = 'An error occurred while adding the channel';
        res.redirect('/channel');
    }
};  

const renderEditChannelPage = async (req, res) => {
    try {
        let email = decryptData(req.cookies.e);
        let data = await navbar.selectQuery(email);
        let navbarviews = await navbar.navbarviewesult(data);
        
        const { id } = req.params;
        const channel = await channelModel.getChannelById(id);
        
        res.render('channel/edit', { 
            title: 'Edit Channel', 
            token: navbarviews,
            channel: channel[0],
            success: req.session.success,
            error: req.session.error,
            user: req.session.user 
        });
    } catch (error) {
        console.error('Error rendering edit channel page:', error);
        req.session.error = 'Failed to load edit channel page';
        res.redirect('/dashboard');
    }
};

const updateChannel = async (req, res) => {
    try {
        const { id, channel_name } = req.body;
        
        if (!id || !channel_name) {
            req.session.error = 'Channel ID and name are required';
            return res.redirect('/channel');
        }

        const result = await channelModel.updateChannel({
            id,
            channel_name
        });

        if (result) {
            req.session.success = 'Channel updated successfully';
        } else {
            req.session.error = 'Failed to update channel';
        }
        
        res.redirect('/channel');
    } catch (error) {
        console.error('Error updating channel:', error);
        req.session.error = 'An error occurred while updating the channel';
        res.redirect('/channel');
    }
};

module.exports = {
    renderChannelPage,
    renderAddChannelPage,
    addChannel,
    renderEditChannelPage,
    updateChannel
};