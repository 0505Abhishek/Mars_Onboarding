const regionModel = require('../../models/super_region/region.model');
const territoryModel = require('../../models/super_territory/territory.model');
const navbar = require('../../models/super_navbar.model');
const { decryptData } = require('../../util/encryption');

const renderTerritoryPage = async (req, res) => {
    try {
        let email = decryptData(req.cookies.e);
        let data = await navbar.selectQuery(email);
        let navbarviews = await navbar.navbarviewesult(data);
        
        const territories = await territoryModel.getAllTerritories();
        
        res.render('territory/index', { 
            title: 'Territory Management', 
            token: navbarviews,
            territories,
            success: req.session.success,
            error: req.session.error,
            user: req.session.user 
        });
        req.session.destroy();
    } catch (error) {
        console.error('Error rendering territory page:', error);
        req.session.error = 'Failed to load territory page';
        res.redirect('/dashboard');
    }
};

const renderAddTerritoryPage = async (req, res) => {
    try {
        let email = decryptData(req.cookies.e);
        let data = await navbar.selectQuery(email);
        let navbarviews = await navbar.navbarviewesult(data);
        
        const regions = await regionModel.getAllRegions();
        
        res.render('territory/add', { 
            title: 'Add Territory', 
            token: navbarviews,
            regions,
            success: req.session.success,
            error: req.session.error,
            user: req.session.user 
        });
    } catch (error) {
        console.error('Error rendering add territory page:', error);
        req.session.error = 'Failed to load add territory page';
        res.redirect('/dashboard');
    }
};

const addTerritory = async (req, res) => {
    try {
        const { territory_names, region_id } = req.body;
        
        if (!territory_names || !region_id || territory_names.length === 0) {
            req.session.error = 'Territory names and region are required';
            return res.redirect('/territory/add');
        }

        let territorycheck = await territoryModel.getTerritoryByName(territory_names,region_id);
        if(territorycheck.length > 0){
            req.session.error = "Territory already exists";
            return res.redirect("/territory");
        }
        const results = await Promise.all(territory_names.map(territory_name => 
            territoryModel.createTerritory({
                territory_name, 
                region_id
            })
        ));

        if (results.length > 0) {
            req.session.success = `${results.length} territories added successfully`;
        } else {
            req.session.error = 'Failed to add territories';
        }
        
        res.redirect('/territory');
    } catch (error) {
        console.error('Error adding territories:', error);
        req.session.error = 'An error occurred while adding territories';
        res.redirect('/territory');
    }
};

const renderEditTerritoryPage = async (req, res) => {
    try {
        let email = decryptData(req.cookies.e);
        let data = await navbar.selectQuery(email);
        let navbarviews = await navbar.navbarviewesult(data);
        
        const { id } = req.params;
        const regions = await regionModel.getAllRegions();
        const territory = await territoryModel.getTerritoryById(id);
        
        res.render('territory/edit', { 
            title: 'Edit Territory', 
            token: navbarviews,
            regions,
            territory: territory[0],
            success: req.session.success,
            error: req.session.error,
            user: req.session.user 
        });
    } catch (error) {
        console.error('Error rendering edit territory page:', error);
        req.session.error = 'Failed to load edit territory page';
        res.redirect('/dashboard');
    }
};

const updateTerritory = async (req, res) => {
    try {
        const { id, territory_names, region_id } = req.body;
        
        if (!id || !territory_names || !region_id || territory_names.length === 0) {
            req.session.error = 'Territory ID, names, and region are required';
            return res.redirect('/territory');
        }

        const results = await Promise.all(territory_names.map(territory_name => 
            territoryModel.updateTerritory({
                id,
                territory_name, 
                region_id
            })
        ));

        if (results.some(result => result)) {
            req.session.success = `${results.length} territories updated successfully`;
        } else {
            req.session.error = 'Failed to update territories';
        }
        
        res.redirect('/territory');
    } catch (error) {
        console.error('Error updating territories:', error);
        req.session.error = 'An error occurred while updating territories';
        res.redirect('/territory');
    }
};

module.exports = {
    renderTerritoryPage,
    renderAddTerritoryPage,
    addTerritory,
    renderEditTerritoryPage,
    updateTerritory
};