let dbconn = require("../../config/db");



const getDistributorList = async (user_id, email) => {
    try {
        const query = `
            SELECT *, prospective_info.id as prospect_id FROM prospective_info
            INNER JOIN tbl_approval_workflow 
            ON prospective_info.id = tbl_approval_workflow.application_id
            WHERE user_id = ? 
            AND aseemail = ? 
            AND applicationPhase_Flag IN (0, 1) 
            AND prospective_info.flag != 2
            AND tbl_approval_workflow.approver_id = ?
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


const insertDocument = async(application_id, user_id, fileData, remark)=>{
    try {
        let query = `INSERT INTO documentTable (
            application_id, asm_id, crf_form, gst_certificate, fssai_certificate, pan_card, 
            cancelled_cheque, db_agreement, godown_insurance, rsm_email_approval, 
            replacement_noc, sales_director_approval, fssai_amendment_copy, 
            freight_sheet, bank_statement, overallRemarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
        const values = [
            application_id, user_id,
            fileData.crf_form, fileData.gst_certificate, fileData.fssai_certificate,
            fileData.pan_card, fileData.cancelled_cheque, fileData.db_agreement,
            fileData.godown_insurance, fileData.rsm_email_approval, fileData.replacement_noc,
            fileData.sales_director_approval, fileData.fssai_amendment_copy, fileData.freight_sheet,
            fileData.bank_statement, remark.overallRemarks
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
        console.error("Unexpected error:", error);
    }

}



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
                      fssai_amendment_copy, freight_sheet, bank_statement, overallRemarks) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            data.application_id, data.asm_id, data.crf_form, data.gst_certificate, data.fssai_certificate,
            data.pan_card, data.cancelled_cheque, data.db_agreement, data.godown_insurance,
            data.rsm_email_approval, data.replacement_noc, data.sales_director_approval,
            data.fssai_amendment_copy, data.freight_sheet, data.bank_statement, data.overallRemarks
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


module.exports={insertDocumentLog, insertDocument, getDistributorDetails, getDistributorList, getDistributorDocument, updateApprovalWorkflow, getCorrectionData, updateDocument, updateProspectiveInfo, updateCorrection};