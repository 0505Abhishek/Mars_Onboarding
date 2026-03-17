const navbar = require('../../models/super_navbar.model');
const dbManagment = require('../../models/super_dbmanagment/dbManagment.model');
const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const { decryptData } = require("../../util/encryption");
const { log } = require('console');
const createObjectCsvWriter = require('csv-writer').createObjectCsvWriter;

const DbManagmentPage = async (req, res, next) => {
    try {
        let email = decryptData(req.cookies.e);
        let data = await navbar.selectQuery(email);
        let navbarviews = await navbar.navbarviewesult(data);
        let getdbdata = await dbManagment.getdata();
        let offboardingdata = await dbManagment.offboardingdata();
        let regionandterritory = await dbManagment.regionandterritory();
        
        res.render('db_managment', {
            token: navbarviews,
            success: req.session.success,
            error: req.session.error,
            user: res.userDetail,
            getdbdata: getdbdata,
            offboardingdata: offboardingdata,
            regionandterritory: regionandterritory
        });
        req.session.destroy();
    } catch (error) {
        console.log("error:- ", error);
        return res.redirect("/dashboard");
    }
};


const EditDbManagmentPage = async (req, res, next) => {
    try {
        let email = decryptData(req.cookies.e);
        let data = await navbar.selectQuery(email);
        let navbarviews = await navbar.navbarviewesult(data);
        let getuserdata = await dbManagment.getuserdata();
        let id = req.params.id;
        let getdbdataById = await dbManagment.getdataById(id);

        if (!getdbdataById) {
            req.session.error = "No data found";
            return res.redirect('/db_managment');
        }

        let getdbdataByIdApproval = await dbManagment.getdataByIdApproval(id);
        let territory = await dbManagment.getterritory();
        res.render('db_managment/edit',
            {
                token: navbarviews, user: res.userDetail, success: req.session.success,
                error: req.session.error,
                getuserdata: getuserdata, getdbdataById: getdbdataById,
                getdbdataByIdApproval: getdbdataByIdApproval, territory: territory
            });
        req.session.destroy();
    } catch (error) {
        console.log("error:- ", error);
        return res.redirect("/");
    }
}

const OffboardingEditDbManagmentPage = async (req, res, next) => {
    try {
        let email = decryptData(req.cookies.e);
        let data = await navbar.selectQuery(email);
        let navbarviews = await navbar.navbarviewesult(data);
        let getuserdata = await dbManagment.getuserdata();
        let id = req.params.id;
        let getdbdataById = await dbManagment.getdataByIdOffboarding(id);

        let getdbdataByIdApproval = await dbManagment.getdataByIdApprovalOffboarding(id);

        return res.render('db_managment/offboardingedit',
            {
                token: navbarviews, user: res.userDetail,
                getuserdata: getuserdata, getdbdataById: getdbdataById,
                success: req.session.success,
                error: req.session.error, getdbdataByIdApproval: getdbdataByIdApproval
            });
    } catch (error) {
        console.log("error:- ", error);
        return res.redirect("/");
    }
}

const offboardingApproverupdate = async (req, res, next) => {
    try {
        const data = req.body;
        let loginsert = await dbManagment.getdataByIdApprovalOffboarding(data.application_id);

        const logInsertPromises = loginsert.map(row => dbManagment.insertApprovalLogoffboard(row));
        await Promise.all(logInsertPromises);

        await dbManagment.offboardingApproverupdate(data);

        req.session.success = "Approver updated successfully";
        return res.redirect("/db_managment");
    } catch (e) {
        console.log("error:- ", e);
        req.session.error = "Failed to update approver";
        return res.redirect("/db_managment");
    }
}

const getUsersByParentId = async (req, res, next) => {
    try {
        const parentId = req.params.parentId;

        const users = await dbManagment.getUsersByParentId(parentId);

        res.json({ users });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}

const approverupdate = async (req, res, next) => {
    try {
        const data = req.body;
       
        const currentIndex = 0; 
        let approverrole_id = data.approver_role_id[currentIndex];
        let approverid = data.approver_id[currentIndex];
        
        //return res.redirect("/db_managment");
        let loginsert = await dbManagment.getdataByIdApproval(data.application_id);

        const logInsertPromises = loginsert.map(row => dbManagment.insertApprovalLog(row));
        await Promise.all(logInsertPromises);

        await dbManagment.approverupdate(data);
        
        if (approverrole_id == 1) {
            let users = await dbManagment.getUsersByParentId(approverid);

            if (users.length > 0) {
                await dbManagment.updateDBStatus(data.application_id, users[0].id, users[0].email_id,data.territory);
            }
        }
        req.session.success = "Approver updated successfully";
        return res.redirect("/db_managment");
    } catch (e) {
        console.log("error:- ", e);
        req.session.error = "Failed to update approver";
        return res.redirect("/db_managment");
    }
};

const addUserPage = async (req, res, next) => {
    try {
        let email = decryptData(req.cookies.e);
        let data = await navbar.selectQuery(email);
        let navbarviews = await navbar.navbarviewesult(data);
        res.render('db_managment/add', {
            token: navbarviews,
            success: req.session.success,
            error: req.session.error,
            user: res.userDetail
        });
        req.session.destroy();
    } catch (error) {
        console.log("error:- ", error);
        return res.redirect("/dashboard");
    }
};

const addUser = async (req, res, next) => {
    try {
        const { distributorName, firmName, email_id, contactNumber } = req.body;
        const data = { distributorName, firmName, email_id, contactNumber };
        let checkdata = await dbManagment.checkDuplicateEmail(email_id);
        if (checkdata) {
            req.session.error = "Email already exists";
            return res.redirect("/db_managment");
        }
        await dbManagment.addUser(data);
        req.session.success = "DB added successfully";
        return res.redirect("/db_managment");
    } catch (e) {
        console.log("error:- ", e);
        req.session.error = "Failed to add DB";
        return res.redirect("/db_managment");
    }
};

const upload = async (req, res, next) => {
    try {
        if (!req.files || !req.files.file) {
            req.session.error = "No file uploaded";
            return res.redirect("/db_managment");
        }
        const csvFile = req.files.file;
        let csvData = await processCSV(csvFile.path);
        const expectedHeaders = [
            "ASM User Id",
            "Territory Name",
            "Distributor Code",
            "DistributorName",
            "PAN Number",
            "GST Number",
            "Address1",
            "City",
            "State",
            "Pincode",
            "Email Id",
            "Contact Number",
            "Contact Person",
            "Distributor Status",
            "Distributor CreatedOn",
            "Distributor DeactivatedOn",
            "PDF Document"
        ];

        if (csvData.length === 0) {
            req.session.error = "The uploaded CSV file is empty";
            return res.redirect("/db_managment");
        }
        const actualHeaders = Object.keys(csvData[0]);
        const headersMatch = expectedHeaders.every(header =>
            actualHeaders.some(actualHeader =>
                actualHeader.trim().toLowerCase() === header.trim().toLowerCase()
            )
        );

        if (!headersMatch) {
            req.session.error = "CSV headers do not match the expected format. Please check the file and try again.";
            return res.redirect("/db_managment");
        }

        const { filePath, filename } = await handleFileUpload(csvFile);

        let stats = {
            total: csvData.length,
            success: 0,
            failure: 0,
            filename,
            file_path: filePath
        };

        for await (const item of csvData) {


            const mappedItem = {
                user_id: item['ASM User Id'] || '',
                territory_id: item['Territory Name'] || '',
                applicationType: '',
                distributor_code: item['Distributor Code'] || '',
                distributorName: item['Contact Person'] || '',
                firmName: item['DistributorName'] || '',
                email: item['Email Id'] || '',
                contactNumber: item['Contact Number'] || '',
                applicationStatus: item['Distributor Status'] || 'Approved',
                final_flag: '1',
                type: 'EXISTING',
                pan_number: item['PAN Number'] || '',
                gst_number: item['GST Number'] || '',
                address1: item['Address1'] || '',
                city: item['City'] || '',
                state: item['State'] || '',
                pin_code: item['Pincode'] || '',
                distributor_status: item['Distributor Status'] || '',
                distributor_createdOn: item['Distributor CreatedOn'] || null,
                distributor_deactivatedOn: item['Distributor DeactivatedOn'] || null,
                pdf_document: item['PDF Document'] || ''
            };

            if (!mappedItem.user_id) {
                req.session.error = "User ID is required";
                return res.redirect("/db_managment");
            }

            mappedItem.user_id = mappedItem.user_id.replace(/^(cb|CB)/i, '');

            const user_email = await dbManagment.getduserById(mappedItem.user_id);

            if (!user_email || user_email.role_id !== 1) {
                req.session.error = "Invalid user ID or insufficient permissions";
                return res.redirect("/db_managment");
            }

            let checkterritory_id = await dbManagment.getterritory_id(mappedItem.territory_id);
            mappedItem.territory_id = checkterritory_id.id;
            mappedItem.region_id = checkterritory_id.region_id;
            let region_id = await dbManagment.getregion_id(checkterritory_id.region_id);
            region_name = region_id.region_name;

            if (!checkterritory_id) {
                req.session.error = "Invalid territory ID";
                return res.redirect("/db_managment");
            }
           
            
            mappedItem.aseemail = user_email.email_id;
            Object.keys(mappedItem).forEach(async key => {
                if (mappedItem[key] === null || mappedItem[key] === undefined) {
                    mappedItem[key] = '';
                }

            });

            let usercheck = await dbManagment.checkDuplicateEmail(mappedItem.email);
            if (!usercheck) {
                try {
                    let results = await dbManagment.insertdb(mappedItem);
                    if (results) {
                        let application_id = results.insertId;
                       let document = await dbManagment.insertdbdocument(application_id, mappedItem);
                       let createDistributors = await createDistributor(application_id, mappedItem,region_name);
                       if(createDistributors == false || document == false){
                        let id = results.insertId;
                        await dbManagment.deleteDB(id);
                        await dbManagment.deletedocument(id);
                        stats.failure++;
                       }else{
                        stats.success++;
                       }
                      
                        
                    }
                } catch (insertError) {
                    console.error('Insert error:', insertError);
                    stats.failure++;
                }
            } else {
                stats.failure++;
            }
        }

        await dbManagment.saveUploadStats(stats);
        if (stats.failure > 0) {
            req.session.error = `File uploaded successfully. Total: ${stats.total}, Success: ${stats.success}, Failure: ${stats.failure}`;
            return res.redirect("/db_managment");
        } else {
            req.session.success = `File uploaded successfully. Total: ${stats.total}, Success: ${stats.success}, Failure: ${stats.failure}`;
            return res.redirect("/db_managment");
        }
    } catch (e) {
        console.log("error:- ", e);
        req.session.error = "Failed to upload file";
        return res.redirect("/db_managment");
    }
};
const updateTerritory = async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            req.session.error = "No file uploaded";
            return res.redirect("/db_managment");
        }
        const csvFile = req.files.file;
        let csvData = await processCSV(csvFile.path);
        const expectedHeaders = [
            "Territory Name",
            "Distributor ID",
        ];

        if (csvData.length === 0) {
            req.session.error = "The uploaded CSV file is empty";
            return res.redirect("/db_managment");
        }
        const actualHeaders = Object.keys(csvData[0]);
        const headersMatch = expectedHeaders.every(header =>
            actualHeaders.some(actualHeader =>
                actualHeader.trim().toLowerCase() === header.trim().toLowerCase()
            )
        );

        if (!headersMatch) {
            req.session.error = "CSV headers do not match the expected format. Please check the file and try again.";
            return res.redirect("/db_managment");
        }
        const { filePath, filename } = await handleFileUpload(csvFile);

        let stats = {
            total: csvData.length,
            success: 0,
            failure: 0,
            filename,
            file_path: filePath
        };
        for await (const item of csvData) {
            let checkterritory_id = await dbManagment.getterritory_id(item['Territory Name']);
            let region_id = await dbManagment.getregion_id(checkterritory_id.region_id);
            let region_name = region_id.region_name;
            if(!checkterritory_id){
                req.session.error = "Invalid territory name";
                return res.redirect("/db_managment");
            }
            let checkuser_id = await dbManagment.getdbdataById(item['Distributor ID']);
            if(!checkuser_id){
                req.session.error = "Invalid distributor ID";
                return res.redirect("/db_managment");
            }
            if(checkterritory_id && checkuser_id){
                let createDistributors = await updateDistributorterritory(checkterritory_id.id, checkuser_id,region_name);

                if(createDistributors == true){
                   
                let getuser = await dbManagment.getuserdataById(checkterritory_id.id);
                let dataupdate = {
                    region_id:region_id.id,
                    territory_id:checkterritory_id.id,
                    user_id:getuser.id,
                    email:getuser.email_id
                }
                let updateProspectiveInfos = await dbManagment.updateProspectiveInfoasm(checkuser_id.id,dataupdate);

                stats.success++;
                }else{
                    stats.failure++;
                }
               
            }
        }
        await dbManagment.saveUploadStats(stats);
        if (stats.failure > 0) {
            req.session.error = `File uploaded successfully. Total: ${stats.total}, Success: ${stats.success}, Failure: ${stats.failure}`;
            return res.redirect("/db_managment");
        } else {
            req.session.success = `File uploaded successfully. Total: ${stats.total}, Success: ${stats.success}, Failure: ${stats.failure}`;
            return res.redirect("/db_managment");
        }
       
    } catch (error) {
        console.error('Error in updateTerritory:', error);
        req.session.error = 'Failed to update territory';
        return res.redirect('/db_managment');
    }
};

function processCSV(filename) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filename)
            .pipe(csvParser())
            .on("data", (data) => results.push(data))
            .on("end", () => {
                resolve(results);
            })
            .on("error", (error) => {
                reject(error);
            });
    });
}
const handleFileUpload = async (file) => {
    try {
        const uploadDir = path.join(__dirname, '../../public/dbfiles');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const timestamp = new Date().getTime();
        const extension = path.extname(file.name);
        const uniqueFilename = `db_upload_${timestamp}${extension}`;

        const filePath = path.join(uploadDir, uniqueFilename);

        fs.copyFileSync(file.path, filePath);
        fs.unlinkSync(file.path);

        return {
            filePath,
            filename: uniqueFilename
        };
    } catch (error) {
        console.error("Error in handleFileUpload:", error);
        throw error;
    }
};

 const updateDistributorterritory = async (territory_ids, item,region_name) => {
    try {
        const data = item;
        const user_id = item.user_id;
        const territory_id = territory_ids;
       
        data.aseemail = item.email;
        //data.user_id = user_id;
        data.application_id = item.id;
        let distributor1 = await dbManagment.getDistributorByEmail(item.email);
        let hierarchyPersons = await dbManagment.getAllhierarchyPersons(territory_id);

        let approvalHierarchy = ['RSEM', 'ASM', 'MIS', 'RSM', 'SUPPLY', 'CE', 'SNF', 'O2C', 'MDM', 'DT Team'];

        let hierarchy = [];
        let sequence = 1;
        
        // Step 1: Check for missing roles first
        let missingRoles = approvalHierarchy.filter(role => {
            const found = hierarchyPersons.find(p => p.role === role);
            // Also check for duplicate ASM case
            if (role === 'ASM') {
                return !hierarchyPersons.some(p => p.role === 'ASM');
            }
            return !found;
        });
        
        if (missingRoles.length > 0) {
            return false;
        }
        
        for (let role of approvalHierarchy) {
            let person = hierarchyPersons.find(p => p.role === role);
        
            if (role === 'ASM' && hierarchy.find(h => h.role === 'ASM' && h.user_id === person.user_id)) {
                continue;
            }
        
            person.approval_sequence = sequence++;
        
            hierarchy.push(person.user_id);
        
          let updateApprovalWorkflow =  await dbManagment.updateApprovalWorkflow(
                distributor1[0].id,
                person.user_id,
                person.user_role_id,
                person,
                role
            );
        }
        if (missingRoles.length > 0) {
            return false;
        }
        let lastApprover = hierarchy?.[hierarchy.length - 1] || null;
        if(region_name){
            const regionInitial = region_name.trim().charAt(0).toUpperCase();
            const paddedId = String(item.id).padStart(6, '0');
            data.mars_id = `MW${regionInitial}${paddedId}`;
        }
        
        let updateProspectiveInfo = await dbManagment.updateProspectiveInfo(hierarchy, hierarchy.length, hierarchy[0], lastApprover,data.mars_id, data.email);

        applicationASM = null;
        asmInserted = false;
        
      return true;
    } catch (error) {
        console.log(error,"errorerror");
        return false;
    }
}
const createDistributor = async (application_id, item,region_name) => {
    try {
        
        const data = item;
        const user_id = item.user_id;
        const territory_id = item.territory_id;
       
        data.aseemail = item.email;
        data.user_id = user_id;
        data.application_id = application_id;
       
        

        data.invite_send_flag = 1;
        data.invitecheckstatus = "send To RSEM";
       // await dbManagment.addDistributor(data);


        let distributor1 = await dbManagment.getDistributorByEmail(item.email);
        let hierarchyPersons = await dbManagment.getAllhierarchyPersons(territory_id);

        let approvalHierarchy = ['RSEM', 'ASM', 'MIS', 'RSM', 'SUPPLY', 'CE', 'SNF', 'O2C', 'MDM', 'DT Team'];

        let hierarchy = [];
        let sequence = 1;
        
        let missingRoles = approvalHierarchy.filter(role => {
            const found = hierarchyPersons.find(p => p.role === role);

            if (role === 'ASM') {
                return !hierarchyPersons.some(p => p.role === 'ASM');
            }
            return !found;
        });
        
        if (missingRoles.length > 0) {
            return false;
        }
        
        for (let role of approvalHierarchy) {
            let person = hierarchyPersons.find(p => p.role === role);
        
            if (role === 'ASM' && hierarchy.find(h => h.role === 'ASM' && h.user_id === person.user_id)) {
                continue;
            }
        
            person.approval_sequence = sequence++;
        
            hierarchy.push(person.user_id);
        
            await dbManagment.insertApprovalWorkflow(
                distributor1[0].id,
                person.user_id,
                person.user_role_id,
                person
            );
        }
        
        
          
        if (missingRoles.length > 0) {
          return false;
      }
      
        
        

        let lastApprover = hierarchy?.[hierarchy.length - 1] || null;
        if(region_name){
            const regionInitial = region_name.trim().charAt(0).toUpperCase();
            const paddedId = String(application_id).padStart(6, '0');
            data.mars_id = `MW${regionInitial}${paddedId}`;
        }
        
        let updateProspectiveInfo = await dbManagment.updateProspectiveInfo(hierarchy, hierarchy.length, hierarchy[0], lastApprover,data.mars_id, data.email);

        applicationASM = null;
        asmInserted = false;

       return true;
    } catch (error) {
        console.error("Error in createDistributor:", error);
        return false;
    }
};
const createDistributor222 = async (application_id, item) => {
    try {
        const data = item;
        const user_id = item.user_id;

        data.user_id = user_id;



        data.invite_send_flag = 1;
        data.invitecheckstatus = "send To RSEM";
        //await dbManagment.addDistributor(data);


        let distributor1 = await dbManagment.getDistributorByEmail(item.email);

        let hierarchy = [];
        let currentUserId = user_id;
        let sequence = 1;
        let previousUserId = null;

        let applicationASM = null;
        let asmInserted = false;

        const maxIterations = 50;
        for (let i = 0; currentUserId && i < maxIterations; i++) {
            const user = await dbManagment.getUserById(currentUserId);

            if (!user) {
                console.warn(`Warning: User with ID ${currentUserId} not found. Breaking loop.`);
                break;
            }

            if (user.role === "ASM" && !applicationASM) {
                applicationASM = user;
                previousUserId = user;
                currentUserId = user.parent_id;
                continue;
            }

            user.approval_sequence = sequence++;

            await dbManagment.insertApprovalWorkflow(distributor1[0].id, user.id, user.role_id, user);

            hierarchy.push(user.id);
            if (user.role === "RSEM" && applicationASM && !asmInserted) {
                applicationASM.approval_sequence = sequence++;
                await dbManagment.insertApprovalWorkflow(distributor1[0].id, applicationASM.id, applicationASM.role_id, applicationASM);
                hierarchy.push(applicationASM.id);
                asmInserted = true;
            }

            previousUserId = user;
            currentUserId = user.parent_id;
        }
        let lastApprover = hierarchy?.[hierarchy.length - 1] || null;
        await dbManagment.updateProspectiveInfo(hierarchy, hierarchy.length, hierarchy[0], lastApprover, item.email);

        applicationASM = null;
        asmInserted = false;

        // let hierarchyData = await dbManagment.getUserById(hierarchy[0]);
        // let distributorDetail = await addDistributor.getDistributorByEmail(req.body.email);

        // await mailer.sendEmail(hierarchyData.email_id, distributorDetail[0].firmName, hierarchyData.employee_name, hierarchyData.role, "Rsemapproval");

        //req.session.notification = { type: 'success', message: 'Invite sent to RSEM Successfully!' };
        return true;
    } catch (error) {
        console.error("Error in createDistributor:", error);
        //  req.session.notification = { type: 'error', message: 'Something went wrong!' };
        return false;
    }
};




const uploadDocument = async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            req.session.error = "No file uploaded";
            return res.redirect("/db_managment");
        }

        const allowedMimeTypes = ['application/pdf'];
        const files = Array.isArray(req.files.file) ? req.files.file : [req.files.file];
        const uploadedDocuments = [];

        const uploadDir = path.join(__dirname, '../../public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        for (const file of files) {
            if (!file || !file.path || !file.name) {
                req.session.error = "Failed to upload document";
                return res.redirect("/db_managment");
            }

            if (!allowedMimeTypes.includes(file.type)) {
                fs.unlinkSync(file.path);
                req.session.error = "Only PDF files are allowed";
                return res.redirect("/db_managment");
            }

            const originalName = file.name;
            const extension = path.extname(originalName) || '.pdf';
            const baseFileName = path.basename(originalName, extension);
            const uniqueFilename = `${baseFileName}${extension}`;
            const filePath = path.join(uploadDir, uniqueFilename);

            fs.copyFileSync(file.path, filePath);

            const fileType = extension.replace('.', '').toLowerCase() || 'unknown';

            const documentData = {
                originalName: originalName,
                uniqueFilename: uniqueFilename,
                filePath: filePath,
                fileSize: file.size || 0,
                fileType: fileType
            };

            await dbManagment.insertDocumentUpload(documentData);
            uploadedDocuments.push(documentData);

            fs.unlinkSync(file.path);
        }

        req.session.success = `${uploadedDocuments.length} document(s) uploaded successfully`;
        return res.redirect("/db_managment");
    } catch (e) {
        console.error("Upload Error: ", e);
        req.session.error = "Failed to upload document";
        return res.redirect("/db_managment");
    }
};










const exportDatabase = async (req, res) => {
    try {
        const getdbdata = await dbManagment.getdata();
        if (!getdbdata || getdbdata.length === 0) {
            req.session.error = "No data found";
            return res.redirect('/db_managment');
        }
        let approvalWorkflow = await dbManagment.getApprovalWorkflow(getdbdata.map(item => item.pid));
        let regionandterritory = await dbManagment.regionandterritorybyid(getdbdata.map(item => item.territory_id));
        let roleInfo = await dbManagment.getroleInfo();

        const uniqueApproverIds = [...new Set(approvalWorkflow.map(item => item.approver_id))];
        let users = (await Promise.all(
            uniqueApproverIds.map(id => dbManagment.getduserById(id))
        )).filter(Boolean);

        const offboardingdata = await dbManagment.offboardingdata();
        let approvalWorkflowoffboarding = [];
        let usersOffboarding = [];
        let regionandterritoryoffboarding = [];
        if (offboardingdata && offboardingdata.length > 0) {
            approvalWorkflowoffboarding = await dbManagment.getApprovalWorkflowoffboarding(offboardingdata.map(item => item.pid));
            regionandterritoryoffboarding = await dbManagment.regionandterritorybyid(offboardingdata.map(item => item.territory_id));
            const uniqueApproverIdsOffboarding = [...new Set(approvalWorkflowoffboarding.map(item => item.approver_id))];
            usersOffboarding = (await Promise.all(
                uniqueApproverIdsOffboarding.map(id => dbManagment.getduserById(id))
            )).filter(Boolean);
        }


        const workflowRoles = new Set();
        const combinedData = [
            ...getdbdata.map(item => {
                const itemWorkflows = approvalWorkflow.filter(workflow => workflow.application_id === item.id);

                const approvalInfos = itemWorkflows.map(workflow => {
                    const user = users.find(u => u.id === workflow.approver_id);
                    const roleInfo = {
                        role: workflow.role_name || 'N/A',
                        name: user ? user.employee_name || 'N/A' : 'N/A',
                        region: user ? user.region || 'N/A' : 'N/A',
                        channel: user ? user.channel || 'N/A' : 'N/A'
                    };
                    workflowRoles.add(roleInfo.role);
                    return roleInfo;
                });

                return {
                    regionName: regionandterritory?.region_name || 'N/A',
                    territory: regionandterritory?.territory_name || 'N/A',
                    type: item.type,
                    id: item.id,
                    db_id: item.mars_code,
                    distributor_name: item.firmName || 'N/A',
                    email: item.email,
                    status: item.distributor_status || 'N/A',
                    pan_number: item.pan_number || 'N/A',
                    gst_number: item.gst_number || 'N/A',
                    address1: item.address1 || 'N/A',
                    city: item.city || 'N/A',
                    state: item.state || 'N/A',
                    pincode: item.pincode || 'N/A',
                    contact_number: item.contactNumber || 'N/A',
                    contact_person: item.distributor_name || 'N/A',
                    distributor_createdOn: item.distributor_createdOn || 'N/A',
                    distributor_deactivatedOn: item.distributor_deactivatedOn || 'N/A',
                    ...Object.fromEntries(
                        Array.from(workflowRoles).map((role, index) => {
                            const matchingWorkflow = approvalInfos.find(info => info.role === role);
                            return [`approvalWorkflow_${index}`, matchingWorkflow ? matchingWorkflow.name : 'N/A'];
                        })
                    ),
                    approvalWorkflow: approvalInfos.map(info => `${info.role}: ${info.name}`).join(' | ')
                };
            }),
            
            ...offboardingdata.map(item => {
                const itemWorkflows = approvalWorkflowoffboarding.filter(workflow => workflow.application_id === item.id);

                const approvalInfos = itemWorkflows.map(workflow => {
                    const user = usersOffboarding.find(u => u.id === workflow.approver_id);
                    const roleInfo = {
                        role: workflow.role_name || 'N/A',
                        name: user ? user.employee_name || 'N/A' : 'N/A',
                        region: user ? user.region || 'N/A' : 'N/A',
                        channel: user ? user.channel || 'N/A' : 'N/A'
                    };
                    workflowRoles.add(roleInfo.role);
                    return roleInfo;
                });

                return {
                    regionName: regionandterritoryoffboarding?.region_name || 'N/A',
                    territory: regionandterritoryoffboarding?.territory_name || 'N/A',
                    type: 'Offboarding',
                    id: item.id,
                    db_id: item.mars_code || 'N/A',
                    distributor_name: item.firmName || 'N/A',
                    email: item.email,
                    status: item.distributor_status || 'N/A',
                    pan_number: item.pan_number || 'N/A',
                    gst_number: item.gst_number || 'N/A',
                    address1: item.address1 || 'N/A',
                    city: item.city || 'N/A',
                    state: item.state || 'N/A',
                    pincode: item.pin_code || 'N/A',
                    contact_number: item.contactNumber || 'N/A',
                    contact_person: item.distributor_name || 'N/A',
                    distributor_createdOn: item.distributor_createdOn || 'N/A',
                    distributor_deactivatedOn: item.distributor_deactivatedOn || 'N/A',
                    ...Object.fromEntries(
                        Array.from(workflowRoles).map((role, index) => {
                            const matchingWorkflow = approvalInfos.find(info => info.role === role);
                            return [`approvalWorkflow_${index}`, matchingWorkflow ? matchingWorkflow.name : 'N/A'];
                        })
                    ),
                    approvalWorkflow: approvalInfos.length > 0
                        ? approvalInfos.map(info => `${info.role}: ${info.name}`).join(' | ')
                        : 'N/A'
                };
            })
        ];

        const roleInfo_name = await dbManagment.getroleInfo();
        const roleOrder = roleInfo_name.map(r => r.role);  

        const header = [
            { id: 'regionName', title: 'Region Name' },
            { id: 'territory', title: 'Territory' },
            { id: 'db_id', title: 'Distributor Code' },
            { id: 'type', title: 'RECORD TYPE' },
            { id: 'distributor_name', title: 'Distributor Name' },
            { id: 'pan_number', title: 'PAN Number' },
            { id: 'gst_number', title: 'GST Number' },
            { id: 'address1', title: 'Address1' },
            { id: 'city', title: 'City' },
            { id: 'state', title: 'State' },
            { id: 'pincode', title: 'Pincode' },
            { id: 'email', title: 'Email Id' },
            { id: 'contact_number', title: 'Contact Number' },
            { id: 'contact_person', title: 'Contact Person' },
            { id: 'status', title: 'Distributor Status' },
            { id: 'distributor_createdOn', title: 'Distributor CreatedOn' },
            { id: 'distributor_deactivatedOn', title: 'Distributor DeactivatedOn' },

            ...roleOrder.map((role, index) => ({
                id: `approvalWorkflow_${index}`,
                title: `${role}`
            })),

        ];
        const downloadDir = path.join(__dirname, '../../public/downloads');

        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }

        const filename = `DB_Management_export_${Date.now()}.csv`;
        const filePath = path.join(downloadDir, filename);

        const csvWriter = createObjectCsvWriter({
            path: filePath,
            header: header
        });


        await csvWriter.writeRecords(combinedData);
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.redirect('/db_managment');
            }
        });
        //fs.copyFileSync(filePath);
        // fs.unlinkSync(filePath);

    } catch (error) {
        console.error('Export Database Error:', error);
        req.session.error = "Failed to export DB_Management";
        res.redirect('/db_managment');
    }
};
const exportDatabase222 = async (req, res) => {
    try {
        const getdbdata = await dbManagment.getdata();
        if (!getdbdata || getdbdata.length === 0) {
            req.session.error = "No data found";
            return res.redirect('/db_managment');
        }
        let approvalWorkflow = await dbManagment.getApprovalWorkflow(getdbdata.map(item => item.pid));
        let regionandterritory = await dbManagment.regionandterritorybyid(getdbdata.map(item => item.territory_id));
        let roleInfo_name = await dbManagment.getroleInfo();
        const roleOrder = roleInfo_name.map(r => r.role);  // Get ordered list of roles

        const uniqueApproverIds = [...new Set(approvalWorkflow.map(item => item.approver_id))];
        let users = (await Promise.all(
            uniqueApproverIds.map(id => dbManagment.getduserById(id))
        )).filter(Boolean);

        const offboardingdata = await dbManagment.offboardingdata();
        let approvalWorkflowoffboarding = [];
        let usersOffboarding = [];
        let regionandterritoryoffboarding = [];
        if (offboardingdata && offboardingdata.length > 0) {
            approvalWorkflowoffboarding = await dbManagment.getApprovalWorkflowoffboarding(offboardingdata.map(item => item.pid));
            regionandterritoryoffboarding = await dbManagment.regionandterritorybyid(offboardingdata.map(item => item.territory_id));
            const uniqueApproverIdsOffboarding = [...new Set(approvalWorkflowoffboarding.map(item => item.approver_id))];
            usersOffboarding = (await Promise.all(
                uniqueApproverIdsOffboarding.map(id => dbManagment.getduserById(id))
            )).filter(Boolean);
        }


        const workflowRoles = new Set();
        const combinedData = [
            ...getdbdata.map(item => {
                const itemWorkflows = approvalWorkflow.filter(workflow => workflow.application_id === item.id);

                const approvalInfos = itemWorkflows.map(workflow => {
                    const user = users.find(u => u.id === workflow.approver_id);
                    const roleInfo = {
                        role: workflow.role_name || 'N/A',
                        name: user ? user.employee_name || 'N/A' : 'N/A',
                        region: user ? user.region || 'N/A' : 'N/A',
                        channel: user ? user.channel || 'N/A' : 'N/A'
                    };
                    workflowRoles.add(roleInfo.role);
                    return roleInfo;
                });

                return {
                    regionName: regionandterritory?.region_name || 'N/A',
                    territory: regionandterritory?.territory_name || 'N/A',
                    type: item.type,
                    id: item.id,
                    db_id: item.pid,
                    distributor_name: item.firmName || 'N/A',
                    email: item.email,
                    status: item.distributor_status || 'N/A',
                    pan_number: item.pan_number || 'N/A',
                    gst_number: item.gst_number || 'N/A',
                    address1: item.address1 || 'N/A',
                    city: item.city || 'N/A',
                    state: item.state || 'N/A',
                    pincode: item.pincode || 'N/A',
                    contact_number: item.contactNumber || 'N/A',
                    contact_person: item.distributor_name || 'N/A',
                    distributor_createdOn: item.distributor_createdOn || 'N/A',
                    distributor_deactivatedOn: item.distributor_deactivatedOn || 'N/A',
                    ...Object.fromEntries(
                        roleOrder.map((role, index) => {
                            const matchingWorkflow = approvalInfos.find(info => info.role === role);
                            return [`approvalWorkflow_${index}`, matchingWorkflow ? matchingWorkflow.name : 'N/A'];
                        })
                    ),
                    approvalWorkflow: approvalInfos.map(info => `${info.role}: ${info.name}`).join(' | ')
                };
            }),
            
            ...offboardingdata.map(item => {
                const itemWorkflows = approvalWorkflowoffboarding.filter(workflow => workflow.application_id === item.id);

                const approvalInfos = itemWorkflows.map(workflow => {
                    const user = usersOffboarding.find(u => u.id === workflow.approver_id);
                    const roleInfo = {
                        role: workflow.role_name || 'N/A',
                        name: user ? user.employee_name || 'N/A' : 'N/A',
                        region: user ? user.region || 'N/A' : 'N/A',
                        channel: user ? user.channel || 'N/A' : 'N/A'
                    };
                    workflowRoles.add(roleInfo.role);
                    return roleInfo;
                });

                return {
                    regionName: regionandterritoryoffboarding?.region_name || 'N/A',
                    territory: regionandterritoryoffboarding?.territory_name || 'N/A',
                    type: 'Offboarding',
                    id: item.id,
                    db_id: item.pid || 'N/A',
                    distributor_name: item.firmName || 'N/A',
                    email: item.email,
                    status: item.distributor_status || 'N/A',
                    pan_number: item.pan_number || 'N/A',
                    gst_number: item.gst_number || 'N/A',
                    address1: item.address1 || 'N/A',
                    city: item.city || 'N/A',
                    state: item.state || 'N/A',
                    pincode: item.pin_code || 'N/A',
                    contact_number: item.contactNumber || 'N/A',
                    contact_person: item.distributor_name || 'N/A',
                    distributor_createdOn: item.distributor_createdOn || 'N/A',
                    distributor_deactivatedOn: item.distributor_deactivatedOn || 'N/A',
                    ...Object.fromEntries(
                        roleOrder.map((role, index) => {
                            const matchingWorkflow = approvalInfos.find(info => info.role === role);
                            return [`approvalWorkflow_${index}`, matchingWorkflow ? matchingWorkflow.name : 'N/A'];
                        })
                    ),
                    approvalWorkflow: approvalInfos.length > 0
                        ? approvalInfos.map(info => `${info.role}: ${info.name}`).join(' | ')
                        : 'N/A'
                };
            })
        ];

        const header = [
            { id: 'regionName', title: 'Region Name' },
            { id: 'territory', title: 'Territory' },
            { id: 'db_id', title: 'Distributor Code' },
            { id: 'type', title: 'RECORD TYPE' },
            { id: 'distributor_name', title: 'Distributor Name' },
            { id: 'pan_number', title: 'PAN Number' },
            { id: 'gst_number', title: 'GST Number' },
            { id: 'address1', title: 'Address1' },
            { id: 'city', title: 'City' },
            { id: 'state', title: 'State' },
            { id: 'pincode', title: 'Pincode' },
            { id: 'email', title: 'Email Id' },
            { id: 'contact_number', title: 'Contact Number' },
            { id: 'contact_person', title: 'Contact Person' },
            { id: 'status', title: 'Distributor Status' },
            { id: 'distributor_createdOn', title: 'Distributor CreatedOn' },
            { id: 'distributor_deactivatedOn', title: 'Distributor DeactivatedOn' },

            ...roleOrder.map((role, index) => ({
                id: `approvalWorkflow_${index}`,
                title: `${role}`
            })),

        ];
        const downloadDir = path.join(__dirname, '../../public/downloads');

        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }

        const filename = `DB_Management_export_${Date.now()}.csv`;
        const filePath = path.join(downloadDir, filename);

        const csvWriter = createObjectCsvWriter({
            path: filePath,
            header: header
        });


        await csvWriter.writeRecords(combinedData);
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.redirect('/db_managment');
            }
        });
        //fs.copyFileSync(filePath);
        // fs.unlinkSync(filePath);

    } catch (error) {
        console.error('Export Database Error:', error);
        req.session.error = "Failed to export DB_Management";
        res.redirect('/db_managment');
    }
};
const getApproversByTerritory = async (req, res) => {
    try {
        const territoryId = req.params.territoryId;
        const approvers = await dbManagment.getApproversByTerritory(territoryId);
        res.json({ success: true, approvers });
    } catch (error) {
        console.error('Error in getApproversByTerritory:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};


module.exports = {
    DbManagmentPage,
    EditDbManagmentPage,
    getUsersByParentId,
    approverupdate,
    addUserPage,
    addUser,
    upload,
    uploadDocument,
    exportDatabase,
    OffboardingEditDbManagmentPage,
    offboardingApproverupdate,
    getApproversByTerritory,
    updateTerritory
};
