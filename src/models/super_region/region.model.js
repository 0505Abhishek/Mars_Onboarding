const dbconn = require('../../config/db');

const getAllRegions = () => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM s_tbl_region_master';
        dbconn.query(query, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

const createRegion = (regionData) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO s_tbl_region_master (region_name) VALUES (?)';
        dbconn.query(query, [regionData.region_name], (error, results) => {
            if (error) return reject(error);
            resolve(results.insertId);
        });
    });
};

const updateRegion = (regionData) => {
    return new Promise((resolve, reject) => {
        const query = 'UPDATE s_tbl_region_master SET region_name = ? WHERE id = ?';
        dbconn.query(query, [regionData.region_name, regionData.id], (error, results) => {
            if (error) return reject(error);
            resolve(results.affectedRows > 0);
        });
    });
};

const deleteRegion = (id) => {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM s_tbl_region_master WHERE id = ?';
        dbconn.query(query, [id], (error, results) => {
            if (error) return reject(error);
            resolve(results.affectedRows > 0);
        });
    });
};

const getRegionByName = (region_name) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM s_tbl_region_master WHERE region_name = ?';
        dbconn.query(query, [region_name], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};  

module.exports = {
    getAllRegions,
    createRegion,
    updateRegion,
    deleteRegion,
    getRegionByName
};