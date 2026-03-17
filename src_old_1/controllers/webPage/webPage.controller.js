const webPageModel = require("../../models/webPage/webPage.model");
const mailer = require('../../util/offboarding_mail');

const webPageView = async (req, res) => {
    try {
      const { applicationId } = req.user;
      const token = req.params.token;

      const data = await webPageModel.getApplicationFromDB(applicationId);
      const distributorData = await webPageModel.getDistributorData(applicationId);

      if(distributorData.length > 0)
      {
        return res.redirect(`/thankYou`); 
      }
      res.render('webPage', { applicationId, data:data, token }); 
    } catch (error) {
      console.error("Error rendering web page:", error);
      res.status(500).send("Something went wrong");
    }
};

const webPageSubmit = async (req, res) => {
    const token = req.params.token; 
    try {
      const formData = req.body;
      const token = req.params.token;

      const { applicationId } = req.user;
      
      const distributorData = await webPageModel.getDistributorData(applicationId);

      if(distributorData.length > 0)
      {
        return res.redirect(`/thankYou`); 
      }
      await webPageModel.submitDBData(applicationId, formData);
      await webPageModel.offboardingDistributor(applicationId);
      const rsemData = await webPageModel.getRsemFromUsers(applicationId);
      let obj = {};
      obj.sendToEmail = rsemData.email_id;
      obj.sendToName = rsemData.employee_name;
      obj.firmName = rsemData.firmName;

      await mailer.sentEmailForOffboarding(obj, 'SUBMIT_WEBPAGE');

      res.redirect(`/thankYou`); 
    } catch (error) {
      console.error("Form submission error:", error);
      res.redirect(`/thankYou`); 
    }
};

  
  
const ThankYouPageView = async (req, res) => {
    try { 
      return res.render('thankyou'); 
    } catch (error) {
      console.error("Error rendering web page:", error);
      res.status(500).send("Something went wrong");
    }
};

module.exports={
  webPageView, webPageSubmit, ThankYouPageView
}
