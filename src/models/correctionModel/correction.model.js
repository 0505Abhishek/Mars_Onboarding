let dbconn = require('../../config/db');

const updateDistributor = async (data, id) => {
try{
    let query = `UPDATE prospective_info SET 
        applicationType = ?, 
        dbType = ?, 
        firmName = ?, 
        distributorName = ?, 
        email = ?, 
        contactNumber = ?, 
        experienceDistribution = ?, 
        experienceFMCG = ?, 
        outletsCovered = ?, 
        monthlyTurnover = ?, 
        stores_covered = ?, 
        roi = ?, 
        fmcg_companies = ?, 
        fmcg_experience = ?, 
        stores_mars = ?, 
        sales_reps = ?, 
        growth_percentage = ?, 
        perfect_store_score = ?, 
        selling_model = ?, 
        mw_compliance = ?, 
        cost_structure = ?, 
        data_operator = ?, 
        internet_access = ?, 
        printer_use = ?, 
        dms_count = ?, 
        print_system = ?,
        logistics_dms = ?, 
        delivery_time = ?, 
        returns_rate = ?, 
        mw_sales_share = ?, 
        openness_change = ?, 
        capital_infrastructure = ?
    WHERE id = ?`;

   let values = [
    data.applicationType,
    data.dbType,
    data.firmName,
    data.distributorName,
    data.email,
    data.contactNumber,
    data.experienceDistribution,
    data.experienceFMCG,
    data.outletsCovered,
    data.monthlyTurnover,
    data.stores_covered,
    data.roi,
    data.fmcg_companies,
    data.fmcg_experience,
    data.stores_mars,
    data.sales_reps,
    data.growth_percentage,
    data.perfect_store_score,
    data.selling_model,
    data.mw_compliance,
    data.cost_structure,
    data.data_operator,
    data.internet_access,
    data.printer_use,
    data.dms_count,
    data.print_system,
    data.logistics_dms,
    data.delivery_time,
    data.returns_rate,
    data.mw_sales_share,
    data.openness_change,
    data.capital_infrastructure,
    id
];

    return new Promise((resolve, reject) => {
        dbconn.query(query,values, (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }
            return resolve(results);
        });
    });
 }catch(error){
    console.log("error: ",error)
    throw error;
 }
};



const updateCorrectionDoc = async(applicationId)=>{
    try{
    let query = `UPDATE maincorrection SET document_page_status = ? WHERE application_id = ?`;

    return new Promise((resolve, reject) => {
        dbconn.query(query,[1, applicationId], (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return reject(error);
            }
            return resolve(results);
        });
    });
  }catch(error){
    console.log('error: ', error)
    throw error;
  }
}

const updateCorrectionBasic = async (applicationId) => {
    try {
        // Ensure applicationId is properly formatted
        if (!applicationId) {
            throw new Error("applicationId is missing or invalid");
        }

        let query = `UPDATE maincorrection SET basic_page_status = ? WHERE application_id = ?`;

        return new Promise((resolve, reject) => {
            dbconn.query(query, [1, applicationId], (error, results) => {
                if (error) {
                    console.error("Database error:", error);
                    return reject(error);
                }
                return resolve(results);
            });
        });
    } catch (error) {
        console.log("Error in updateCorrectionBasic:", error);
        throw error;
    }
};


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
module.exports={updateDistributor, updateCorrectionDoc, updateCorrectionBasic, updateDocument}
