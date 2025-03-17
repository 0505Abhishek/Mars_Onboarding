const { exportKycData, updateFreshKycStatus, updateReKycStatus, updateReplaceKycStatus, selectKycData, filterKycData, getAWSMCity, updateKycStatus, SaveThirdPartyData, CurrentUser, selectAWSM } = require("../../models/reset_kyc.model");

const { updateNotification } = require("../../models/notification.model");
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const kycView = async (req, res) => {
  let allDetails = await filterKycData(req.query);
  let awsmCity = await getAWSMCity();
  res.render('reset_kyc', { user: res.userDetail, kycData: allDetails, QueryData: req.query, awsmCity, notification: res.notification });
}

const updateKYCStatus = async (req, res) => {
  req.body.kyc_id = req.query.kyc_id;

  try {
    let currentUser = await CurrentUser(req.user.userId.userData.email);
    req.body.userName = currentUser[0].firstName;
  }
  catch (error) {
    res.redirect('/reset_kyc');
  }
  if (req.body.awsm_code && req.body.photo) {
    axios({
      method: 'GET',
      url: req.body.photo,
      responseType: 'stream'
    })
      .then(response => {
        const formData = new FormData();
        formData.append('file', response.data, {
          filename: 'image.jpg', 
          contentType: 'image/jpeg'
        });
        formData.append('name', req.body.awsm_code);

        const headers = {
          'Accept': 'application/json',
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
        };

      })
      .catch(error => {
        console.error('Error downloading image:', error);
      });
  } else {
    console.error('Error: No awsm_code or photo provided');
  }



  if (req.body.kyc_status === 'PENDING') {
    try {
      if (req.body.kyc_type == 'RE-KYC') {
        req.body.kyc_type = 'RE-KYC';
      }

      const parts = req.body.dob.split('/');
      const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      req.body.dob = formattedDate;

      const partsa = req.body.JoiningDate.split('/');
      const JoiningDate = `${partsa[2]}-${partsa[1]}-${partsa[0]}`;
      req.body.JoiningDate = JoiningDate;

      const requestData = {
        userId: 'abc',
        password: 'password'
      };
      let awsmInsertResult = await selectAWSM(req.body.awsm_code);
      let awsmId;
      if (awsmInsertResult) {

        awsmId = awsmInsertResult.id;
        axios.post('https://mars-in-uat-api.ivydms.com/stackbox_download/api/CreateToken', requestData)
          .then(response => {

            const accessToken = response.data;

            if (!accessToken) {
              console.error('Error: Access token is undefined');
              return; // Exit early if access token is undefined
            }
            let salesman = req.body.kyc_type === 'FRESH' ? 'Field change' :
              req.body.kyc_type === 'RE-KYC' ? 'Field change' : req.body.kyc_type === 'Replace-KYC-Request' ? 'Field change' :
                req.body.kyc_type;
            let nameParts = req.body.awsm_name.split(" ");
            // Define the data for the second POST request
            const datapost = [
              {
                "DB_Code": req.body.distributorcode,
                "DB_Name": req.body.name,
                "Salesman_Code": req.body.awsm_code,
                "User_Title": '',
                "First_Name": nameParts[0] || '',
                "Middle_Name": nameParts.slice(1, -1).join(' ') || '',
                "Last_Name": nameParts[nameParts.length - 1] || '',
                "Gender": req.body.gender,
                "DOB": formattedDate,
                "DOJ": JoiningDate,
                "Mobile_No": req.body.mobile_no,
                "Email": req.body.awEmail,
                "Role": "Distributor Sales Representative",
                "Seller_Type": req.body.SellerType = req.body.SellerType === 'PRE_SELLER' ? 'Pre-Seller' : req.body.SellerType,
                "Emp_Code": 'CB' + awsmId,
                "Designation": '',
                "KYC": req.body.kyc_status = req.body.kyc_status === 'SUCCESS' ? 'completed' : req.body.kyc_status,
                "Status": "active",
                "Salesman": salesman,
              }
            ];

            return axios.post('https://mars-in-uat-api.ivydms.com/stackbox_download/api/NewSalesman', datapost, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            });
          })
          .then(response => {
          })
          .catch(error => {
            console.error('Error obtaining access token or in second POST request:', error);
            // Handle error here
          });
      }


      if (req.body.kyc_type === 'FRESH') {
        let currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();

        const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        req.body.todayDate = formattedDate;
        await updateFreshKycStatus(req.body);


      } else if (req.body.kyc_type === 'Edited-KYC') {

        let currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();

        const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        req.body.todayDate = formattedDate;
        await updateReplaceKycStatus(req.body);
      } else if (req.body.kyc_type === 'RE-KYC') {
        let currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();

        const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        req.body.todayDate = formattedDate;
        await updateReKycStatus(req.body);
      }
      await SaveThirdPartyData(data);
    } catch (error) {
      return res.redirect('/reset_kyc');
    }
  } else {
    if (req.body.kyc_type === 'FRESH') {

      let currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();

      const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      req.body.todayDate = formattedDate;
      await updateFreshKycStatus(req.body);


    } else if (req.body.kyc_type === 'Replace-KYC-Request') {
      let currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();

      const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      req.body.todayDate = formattedDate;
      await updateReplaceKycStatus(req.body);
    } else if (req.body.kyc_type === 'RE-KYC') {
      let currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();

      const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      req.body.todayDate = formattedDate;
      await updateReKycStatus(req.body);
    }
    else if (req.body.kyc_type === 'Edited-KYC') {

      let currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();

      const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      req.body.todayDate = formattedDate;
      await updateReplaceKycStatus(req.body);
    }
    res.redirect('/reset_kyc');
  }
};


module.exports = {
    updateKYCStatus,
    kycView
  }