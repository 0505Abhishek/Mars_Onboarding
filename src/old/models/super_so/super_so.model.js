const dbconn = require("../../config/db");

const getAllSo = () => {
  return new Promise((resolve, reject) => {
    const query =
      "SELECT s_tbl_so_territories.id as so_id,s_tbl_territory_master.*, s_tbl_so_territories.*  FROM s_tbl_so_territories inner join s_tbl_territory_master on s_tbl_territory_master.id = s_tbl_so_territories.territory_id";
    dbconn.query(query, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
};

const getAllRegion = () => {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM s_tbl_region_master";
    dbconn.query(query, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
};

const getSoTerritoryById = (id) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM s_tbl_so_territories where id = ?`;
    dbconn.query(query, [id], (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
};

const getTerritoryById = (region_id) => {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM s_tbl_territory_master where region_id= ?";
    dbconn.query(query, [region_id], (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
};
const getAsmTerritory = (region_id) => {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM s_tbl_territory_master where region_id= ?";
    dbconn.query(query, [region_id], (error, results) => {
      if (error) return reject(error);

      resolve(results);
    });
  });
};

const AddSoTerritoryDb = (data) => {
  return new Promise((resolve, reject) => {
    const query = `
            INSERT INTO s_tbl_so_territories 
            (region_id, territory_id, so_territory_name, so_name, so_email) 
            VALUES (?, ?, ?, ?, ?)
        `;
    dbconn.query(
      query,
      [
        data.region_id,
        data.asm_territory_id,
        data.territory_names,
        data.so_names,
        data.so_email,
      ],
      (error, results) => {
        if (error) return reject(error);
        resolve(results);
      }
    );
  });
};

const UpdateSoTerritoryDb = async (data) => {
  try {
    return await new Promise((resolve, reject) => {
      const query = `
                UPDATE s_tbl_so_territories 
                SET region_id = ?, 
                    territory_id = ?, 
                    so_name = ?, 
                    so_email = ? 
                WHERE id = ?`;

      dbconn.query(
        query,
        [
          data.region_id,
          data.asm_territory_id,
          data.so_names,
          data.so_email,
          data.id,
        ],
        (error, results) => {
          if (error) return reject(error);
          resolve(results);
        }
      );
    });
  } catch (err) {
    console.error("Error updating SO territory:", err);
    throw err; // re-throw so the calling function can handle it
  }
};

module.exports = {
  getAllSo,
  getAllRegion,
  getAsmTerritory,
  AddSoTerritoryDb,
  getTerritoryById,
  getSoTerritoryById,
  UpdateSoTerritoryDb,
};
