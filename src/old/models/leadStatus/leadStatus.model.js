let dbconn = require("../../config/db");



const getDistributorList = async (user_id, email) => {
    try {
        const query = `
            SELECT *, prospective_info.id AS prospect_id, pending_approver.role_name AS pending_role_name, 
            pending_approver.approval_sequence AS pending_sequence FROM prospective_info 
            INNER JOIN tbl_approval_workflow ON prospective_info.id = tbl_approval_workflow.application_id 
            LEFT JOIN s_tbl_region_master ON s_tbl_region_master.id = prospective_info.region_id  
            LEFT Join s_tbl_territory_master on s_tbl_territory_master.id = prospective_info.territory_id 
            LEFT JOIN ( SELECT taw.application_id, taw.role_name, taw.approval_sequence 
                         FROM tbl_approval_workflow taw 
              WHERE taw.is_final_approver = 0 AND NOT EXISTS 
              ( SELECT 1 FROM tbl_approval_workflow taw2 WHERE taw2.application_id = taw.application_id AND taw2.is_final_approver = 0 AND taw2.approval_sequence < taw.approval_sequence ) ) 
              AS pending_approver ON pending_approver.application_id = prospective_info.id 
              WHERE prospective_info.user_id = ? 
              AND prospective_info.aseemail = ? 
              AND prospective_info.applicationPhase_Flag IN (0, 1, 2) 
              AND tbl_approval_workflow.approver_id = ? AND prospective_info.type != 'EXISTING'
        `;

        const values = [user_id, email, user_id];

        return new Promise((resolve, reject) => {
            dbconn.query(query, values, (error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    return reject(error);
                }
                return resolve(results);
            });
        });
    } catch (error) {
        console.error("Error in getDistributorList:", error);
        throw error;
    }
};


const getDistributorDocument = async (application_id) => {  
  try{
    const query = `
      SELECT * from documenttable
      inner join prospective_info on prospective_info.id = documenttable.application_id
      where application_id = ?`;

    return new Promise((resolve, reject) => {
        dbconn.query(query, [application_id], (error, results) => {
          if (error) {
            console.error("Database error:", error);
            return reject(error);
          }

          return resolve(results); 
        });
      });
  }
  catch{

  }
}

const getUploadDocumentData = async (application_id) => {  
  try{
    const query = `
      SELECT documenttable.* from documenttable
      inner join prospective_info on prospective_info.id = documenttable.application_id
      where application_id = ?`;

    return new Promise((resolve, reject) => {
        dbconn.query(query, [application_id], (error, results) => {
          if (error) {
            console.error("Database error:", error);
            return reject(error);
          }

          return resolve(results); 
        });
      });
  }
  catch{

  }
}

const updateApprovalWorkflow = async (application_id, user_id, remark) => {
  try {
      let query = `
          UPDATE tbl_approval_workflow 
          SET status = ?, is_final_approver = ?, remarks = ?, approved_by = ?, approval_status = ?
          WHERE application_id = ? AND approver_id = ?`;

      let values = ["Approved", 1, remark.overallRemarks, user_id, 1 ,application_id, user_id];

      return new Promise((resolve, reject) => {
          dbconn.query(query, values, (error, results) => {
              if (error) {
                  console.error("Database error:", error);
                  return reject(error);
              }
              return resolve(results);
          });
      });
  } catch (error) {
      console.error("Error in updateApprovalWorkflow:", error);
      throw error;
  }
};


const getCorrectionData = (id)=>{
    try{

    let query = 'select * from applicationscorrection where application_id = ? and status = ?'

    const values = [id,'Pending'];

    return new Promise((resolve, reject) => {
        dbconn.query(query, values, (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }
            return resolve(results[0]);
        });
    });
} catch (error) {
    console.error("Error in getDistributorList:", error);
    throw error;
}
}

const updateDocument = async (application_id, updatedFields) => {

    if (!application_id || Object.keys(updatedFields).length === 0) {
        return;
    }

    let query = "UPDATE documenttable SET ";
    const values = [];
    const updates = [];

    Object.keys(updatedFields).forEach((key) => {
        updates.push(`${key} = ?`);
        values.push(updatedFields[key]);
    });

    query += updates.join(", ") + " WHERE application_id = ?";
    values.push(application_id);

    dbconn.query(query, values, (err, result) => {
        if (err) {
            console.error("Error updating documentTable:", err);
            return;
        }
    });
};

const updateProspectiveInfo = async(applicationId)=>{
  try{
   let query = `update prospective_info SET flag = ?, applicationStatus = ?
                WHERE id = ?`;

          return new Promise((resolve, reject) => {
            dbconn.query(query, [0,'Pending', applicationId], (error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    return reject(error);
                }
                return resolve(results[0]);
            });
        });
    } catch (error) {
        console.error("Error in getDistributorList:", error);
        throw error;
    }       
}


const insertDocument = async (application_id, user_id, fileData, remark) => {

    const query = `
        INSERT INTO documenttable (
            application_id, asm_id, 
            crf_form, gst_certificate, fssai_certificate, pan_card, cancelled_cheque, db_agreement,
            godown_insurance, rsm_email_approval, replacement_noc, sales_director_approval,
            fssai_amendment_copy, freight_sheet, noc_document, Resignation_DB, rsm_document, bank_statement,
            overallRemarks,
            other_doc_1_name, other_doc_1_file,
            other_doc_2_name, other_doc_2_file,
            other_doc_3_name, other_doc_3_file
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;


    const values = [
        application_id, user_id,
        fileData.crf_form || null, fileData.gst_certificate || null, fileData.fssai_certificate || null,
        fileData.pan_card || null, fileData.cancelled_cheque || null, fileData.db_agreement || null,
        fileData.godown_insurance || null, fileData.rsm_email_approval || null, fileData.replacement_noc || null,
        fileData.sales_director_approval || null, fileData.fssai_amendment_copy || null, fileData.freight_sheet || null,
        fileData.noc_document || null, fileData.Resignation_DB, fileData.rsm_document || null, fileData.bank_statement || null,
        remark.overallRemarks || null,
        remark.other_doc_name_1 || null, fileData.other_doc_file_1 || null,
        remark.other_doc_name_2 || null, fileData.other_doc_file_2 || null,
        remark.other_doc_name_3 || null, fileData.other_doc_file_3 || null
    ];

    try {
        return await new Promise((resolve, reject) => {
            dbconn.query(query, values, (error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    return reject(error);
                }
                resolve(results);
            });
        });
    } catch (error) {
        console.error("Unexpected error in insertDocument:", error);
        throw error; // or return null if you want to handle it silently
    }
};



const insertOriginalNames = async (application_id, originalFileNames) => {
    try {
        let query = `INSERT INTO document_file_originals (
            application_id, 
            crf_form_original, 
            gst_certificate_original, 
            fssai_certificate_original,
            pan_card_original, 
            cancelled_cheque_original, 
            db_agreement_original,
            godown_insurance_original, 
            rsm_email_approval_original, 
            fssai_amendment_copy_original, 
            freight_sheet_original,
            noc_document,
            Resignation_DB,
            rsm_document,
            other_doc_1_original,
            other_doc_2_original,
            other_doc_3_original
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            application_id,
            originalFileNames.crf_form || null,
            originalFileNames.gst_certificate || null,
            originalFileNames.fssai_certificate || null,
            originalFileNames.pan_card || null,
            originalFileNames.cancelled_cheque || null,
            originalFileNames.db_agreement || null,
            originalFileNames.godown_insurance || null,
            originalFileNames.rsm_email_approval || null,
            originalFileNames.fssai_amendment_copy || null,
            originalFileNames.freight_sheet || null,
            originalFileNames.noc_document || null,
            originalFileNames.Resignation_DB || null,
            originalFileNames.rsm_document || null,
            originalFileNames.other_doc_file_1 || null,
            originalFileNames.other_doc_file_2 || null,
            originalFileNames.other_doc_file_3 || null
        ];

        return new Promise((resolve, reject) => {
            dbconn.query(query, values, (error, results) => {
                if (error) {
                    console.error("Original name insert error:", error);
                    return reject(error);
                }
                return resolve(results);
            });
        });
    } catch (error) {
        console.error("Unexpected error:", error);
    }
};


const updateOriginalNames = async (application_id, originalFileNames) => {

    try {
        const allowedFields = {
            crf_form_original: originalFileNames.crf_form,
            gst_certificate_original: originalFileNames.gst_certificate,
            fssai_certificate_original: originalFileNames.fssai_certificate,
            pan_card_original: originalFileNames.pan_card,
            cancelled_cheque_original: originalFileNames.cancelled_cheque,
            db_agreement_original: originalFileNames.db_agreement,
            godown_insurance_original: originalFileNames.godown_insurance,
            rsm_email_approval_original: originalFileNames.rsm_email_approval,
            fssai_amendment_copy_original: originalFileNames.fssai_amendment_copy,
            freight_sheet_original: originalFileNames.freight_sheet,
            noc_document: originalFileNames.noc_document || null,
            Resignation_DB: originalFileNames.Resignation_DB || null,
            rsm_document: originalFileNames.rsm_document || null,
            other_doc_1_original: originalFileNames.other_doc_1_file || null,
            other_doc_2_original: originalFileNames.other_doc_2_file || null,
            other_doc_3_original: originalFileNames.other_doc_3_file || null
        };

        let setClauses = [];
        let values = [];

        for (const [column, value] of Object.entries(allowedFields)) {
            if (value !== null && value !== undefined) {
                setClauses.push(`${column} = ?`);
                values.push(value);
            }
        }

        if (setClauses.length === 0) {
            console.log("No fields to update.");
            return;
        }

        let query = `UPDATE document_file_originals SET ${setClauses.join(', ')} WHERE application_id = ?`;
        values.push(application_id);

        return new Promise((resolve, reject) => {
            dbconn.query(query, values, (error, results) => {
                if (error) {
                    console.error("Original name dynamic update error:", error);
                    return reject(error);
                }

                return resolve(results);
            });
        });
    } catch (error) {
        console.error("Unexpected error in dynamic update:", error);
    }
};

const getDistributorDetails = async(application_id, user_id)=>{

   let query = `select * from prospective_info where id = ? and user_id = ?`;

   return new Promise((resolve, reject)=>{
    dbconn.query(query, [application_id, user_id],(error,results)=>{
        if(error)
        {
           console.log(error,"error");
           return reject(error);
        }

        return resolve(results);
   })
 })
};



const updateCorrection = async (application_id) => {
    let query = `UPDATE applicationscorrection SET status = ? WHERE application_id = ?`;

    return new Promise((resolve, reject) => {
        dbconn.query(query, ['corrected', application_id], (error, results) => { 
            if (error) {
                console.log(error, "error");
                return reject(error);
            }

            return resolve(results);
        });
    });
};

const insertDocumentLog = async (data) => {

    try {
        let query = `INSERT INTO documenttable_log 
                     (application_id, asm_id, crf_form, gst_certificate, fssai_certificate, 
                      pan_card, cancelled_cheque, db_agreement, godown_insurance, 
                      rsm_email_approval, replacement_noc, sales_director_approval, 
                      fssai_amendment_copy, freight_sheet, bank_statement, noc_document, 
                      Resignation_DB, rsm_document, overallRemarks,
                      other_doc_1_name, other_doc_1_file,
                      other_doc_2_name, other_doc_2_file,
                      other_doc_3_name, other_doc_3_file)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            data.application_id,
            data.asm_id,
            data.crf_form,
            data.gst_certificate,
            data.fssai_certificate,
            data.pan_card,
            data.cancelled_cheque,
            data.db_agreement,
            data.godown_insurance,
            data.rsm_email_approval,
            data.replacement_noc,
            data.sales_director_approval,
            data.fssai_amendment_copy,
            data.freight_sheet,
            data.bank_statement,
            data.noc_document,
            data.Resignation_DB,
            data.rsm_document,
            data.overallRemarks,
            data.other_doc_1_name,
            data.other_doc_1_file,
            data.other_doc_2_name,
            data.other_doc_2_file,
            data.other_doc_3_name,
            data.other_doc_3_file
        ];

        return new Promise((resolve, reject) => {
            dbconn.query(query, values, (error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    return reject(error);
                }
                return resolve(results);
            });
        });
    } catch (error) {
        console.log(error);
        throw error;
    }
};


const getUserById = async (userId) => {

    try {
        return new Promise((resolve, reject) => {
            dbconn.query(
                `SELECT * FROM users WHERE id = ?`, 
                [userId],
                (error, results) => {
                    if (error) {
                        console.error("Database error in getUserById:", error);
                        return reject(error);
                    }

                    resolve(results.length > 0 ? results[0] : null);
                }
            );
        });
    } catch (error) {
        console.error("Database error in getUserById:", error);
        throw error;
    }
};


const getOriginalFileNames = async (application_id) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM document_file_originals WHERE application_id = ?`;
        dbconn.query(query, [application_id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

const getTerritory = async(id)=>{
    try{
        return new Promise((resolve, reject) => {
            const query = `SELECT s_tbl_user_territories.territory_id, s_tbl_territory_master.territory_name FROM s_tbl_user_territories
            INNER JOIN s_tbl_territory_master ON s_tbl_territory_master.id = s_tbl_user_territories.territory_id
            where s_tbl_user_territories.user_id = ?`;
    
            dbconn.query(query,[id],(error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
     }catch(error){
        console.log(error);
        throw error;
     }
}
 
const getRegion = async(id)=>{
    try{
        return new Promise((resolve, reject) => {
            const query = `SELECT s_tbl_region_master.region_name, s_tbl_region_master.id FROM s_tbl_user_territories
            INNER JOIN s_tbl_territory_master ON s_tbl_territory_master.id = s_tbl_user_territories.territory_id
            INNER JOIN s_tbl_region_master ON s_tbl_region_master.id = s_tbl_territory_master.region_id
            where s_tbl_user_territories.user_id = ?
            group by  s_tbl_region_master.region_name`;
    
            dbconn.query(query,[id],(error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
     }catch(error){
        console.log(error);
        throw error;
     }
}


const getTerritoryByRegion = async(id, region_id)=>{

    try{
        return new Promise((resolve, reject) => {
            const query = `SELECT s_tbl_user_territories.territory_id, s_tbl_territory_master.territory_name FROM s_tbl_user_territories
            INNER JOIN s_tbl_territory_master ON s_tbl_territory_master.id = s_tbl_user_territories.territory_id
            where s_tbl_user_territories.user_id = ? and s_tbl_territory_master.region_id = ?`;
    
            dbconn.query(query,[id, region_id],(error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
     }catch(error){
        console.log(error);
        throw error;
     }
}
 

const getDistributorFilterList = async (user_id, email, region) => {
    try {
        const query = `
            SELECT *, prospective_info.id AS prospect_id, pending_approver.role_name AS pending_role_name, 
            pending_approver.approval_sequence AS pending_sequence FROM prospective_info 
            INNER JOIN tbl_approval_workflow ON prospective_info.id = tbl_approval_workflow.application_id 
            LEFT JOIN s_tbl_region_master ON s_tbl_region_master.id = prospective_info.region_id  
            LEFT Join s_tbl_territory_master on s_tbl_territory_master.id = prospective_info.territory_id 
            LEFT JOIN ( SELECT taw.application_id, taw.role_name, taw.approval_sequence 
                         FROM tbl_approval_workflow taw 
              WHERE taw.is_final_approver = 0 AND NOT EXISTS 
              ( SELECT 1 FROM tbl_approval_workflow taw2 WHERE taw2.application_id = taw.application_id AND taw2.is_final_approver = 0 AND taw2.approval_sequence < taw.approval_sequence ) ) 
              AS pending_approver ON pending_approver.application_id = prospective_info.id 
              WHERE prospective_info.user_id = ? 
              AND prospective_info.aseemail = ? 
              AND prospective_info.applicationPhase_Flag IN (0, 1, 2) 
              AND tbl_approval_workflow.approver_id = ?
              AND prospective_info.region_id = ? 
        `;

        const values = [user_id, email, user_id, region];

        return new Promise((resolve, reject) => {
            dbconn.query(query, values, (error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    return reject(error);
                }
                return resolve(results);
            });
        });
    } catch (error) {
        console.error("Error in getDistributorList:", error);
        throw error;
    }
};


const getAllEmailsToSend = async (roleid, region_id) => {
    let query = `SELECT users.email_id FROM users WHERE role_id = ? AND region LIKE ?`;
    let values = [roleid, `%${region_id}%`]; 

    return new Promise((resolve, reject) => {
        dbconn.query(query, values, (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }
            return resolve(results); 
        });
    });
};

module.exports={getAllEmailsToSend, getRegion, getUploadDocumentData, getTerritory, getTerritoryByRegion, getDistributorFilterList, updateOriginalNames, getUserById, insertOriginalNames, insertDocumentLog, insertDocument, getDistributorDetails, getDistributorList, getDistributorDocument, updateApprovalWorkflow, getCorrectionData, updateDocument, updateProspectiveInfo, updateCorrection, getOriginalFileNames};