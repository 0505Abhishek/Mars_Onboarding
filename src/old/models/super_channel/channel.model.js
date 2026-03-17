const dbconn = require('../../config/db');

const getAllChannels = () => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM s_tbl_channel_master';
        dbconn.query(query, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

const createChannel = (channelData) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO s_tbl_channel_master (channel_name) VALUES (?)';
        dbconn.query(query, [channelData.channel_name], (error, results) => {
            if (error) return reject(error);
            resolve(results.insertId);
        });
    });
};

const getChannelById = (id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM s_tbl_channel_master WHERE id = ?';
        dbconn.query(query, [id], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

const updateChannel = (channelData) => {
    return new Promise((resolve, reject) => {
        const query = 'UPDATE s_tbl_channel_master SET channel_name = ? WHERE id = ?';
        dbconn.query(query, [channelData.channel_name, channelData.id], (error, results) => {
            if (error) return reject(error);
            resolve(results.affectedRows > 0);
        });
    });
};

module.exports = {
    getAllChannels,
    createChannel,
    getChannelById,
    updateChannel
};