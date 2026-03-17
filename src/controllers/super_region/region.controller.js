const regionModel = require('../../models/super_region/region.model');
const { decryptData } = require("../../util/encryption");
const navbar = require('../../models/super_navbar.model');

const renderRegionPage = async (req, res) => {
    try {
        let email = decryptData(req.cookies.e);
        let data = await navbar.selectQuery(email);
        let navbarviews = await navbar.navbarviewesult(data);
        const regions = await regionModel.getAllRegions();
        res.render('region/index', { 
            title: 'Region Management', 
            regions: regions,
            token: navbarviews,
            success: req.session.success,
            error: req.session.error,
            user: req.session.user 
        });
        req.session.destroy();
    } catch (error) {
        console.error('Error rendering region page:', error);
        req.session.error = 'Failed to load regions';
        res.redirect('/dashboard');
    }
};

const renderAddRegionPage = async (req, res) => {
    try {
        let email = decryptData(req.cookies.e);
        let data = await navbar.selectQuery(email);
        let navbarviews = await navbar.navbarviewesult(data);
        res.render('region/add', { 
            title: 'Add Region', 
            token: navbarviews,
            success: req.session.success,
            error: req.session.error,
            user: req.session.user 
        });
    } catch (error) {
        console.error('Error rendering add region page:', error);
        req.session.error = 'Failed to load add region page';
        res.redirect('/dashboard');
    }
};

const addRegion = async (req, res) => {
    try {
        const { region_name } = req.body;
        
        if (!region_name) {
            req.session.error = 'Region name is required';
            return res.redirect('/region');
        }

        let regioncheck = await regionModel.getRegionByName(region_name);
        if(regioncheck.length > 0){
            req.session.error = "Region already exists";
            return res.redirect("/region");
        }
        const result = await regionModel.createRegion({ 
            region_name
        });

        if (result) {
            req.session.success = 'Region added successfully';
        } else {
            req.session.error = 'Failed to add region';
        }
        
        res.redirect('/region');
    } catch (error) {
        console.error('Error adding region:', error);
        req.session.error = 'An error occurred while adding the region';
        res.redirect('/region');
    }
};

const editRegion = async (req, res) => {
    try {
        const { id, region_name } = req.body;
        
        // Validate input
        if (!id || !region_name) {
            req.session.error = 'All fields are required for editing';
            return res.redirect('/region');
        }

        const result = await regionModel.updateRegion({ 
            id, 
            region_name
        });

        if (result) {
            req.session.success = 'Region updated successfully';
        } else {
            req.session.error = 'Failed to update region';
        }
        
        res.redirect('/region');
    } catch (error) {
        console.error('Error editing region:', error);
        req.session.error = 'An error occurred while editing the region';
        res.redirect('/region');
    }
};



module.exports = {
    renderRegionPage,
    addRegion,
    editRegion,
    renderAddRegionPage
};