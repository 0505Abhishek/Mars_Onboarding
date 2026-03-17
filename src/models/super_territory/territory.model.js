const dbconn = require('../../config/db');

const getAllTerritories = () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT t.*, r.region_name 
            FROM s_tbl_territory_master t
            LEFT JOIN s_tbl_region_master r ON t.region_id = r.id
        `;
        dbconn.query(query, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

const createTerritory = (territoryData) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO s_tbl_territory_master (territory_name, region_id) VALUES (?, ?)';
        dbconn.query(query, [territoryData.territory_name, territoryData.region_id], (error, results) => {
            if (error) return reject(error);
            resolve(results.insertId);
        });
    });
};

const getTerritoryById = (id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM s_tbl_territory_master WHERE id = ?';
        dbconn.query(query, [id], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

const updateTerritory = (territoryData) => {
    return new Promise((resolve, reject) => {
        const query = 'UPDATE s_tbl_territory_master SET territory_name = ?, region_id = ? WHERE id = ?';
        dbconn.query(query, [territoryData.territory_name, territoryData.region_id, territoryData.id], (error, results) => {
            if (error) return reject(error);
            resolve(results.affectedRows > 0);
        });
    });
};

const getTerritoryByName = (territory_name,region_id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM s_tbl_territory_master WHERE territory_name in (?) AND region_id in (?)';
        dbconn.query(query, [territory_name,region_id], (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

module.exports = {
    getAllTerritories,
    createTerritory,
    getTerritoryById,
    updateTerritory,
    getTerritoryByName
};