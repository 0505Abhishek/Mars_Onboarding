const soModel = require('../../models/super_so/super_so.model');
const { decryptData } = require("../../util/encryption");
const navbar = require('../../models/super_navbar.model');

const renderSoPage = async (req, res) => {
    try {
        let email = decryptData(req.cookies.e);
        let data = await navbar.selectQuery(email);
        let navbarviews = await navbar.navbarviewesult(data);
        const regions = await soModel.getAllSo();
        res.render('super_so', { 
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


const renderAddSoPage = async (req, res) => {
    try {
        let email = decryptData(req.cookies.e);
        let data = await navbar.selectQuery(email);
        let navbarviews = await navbar.navbarviewesult(data);
        const regions = await soModel.getAllRegion();
        res.render('super_so/add', { 
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


const renderAsmTerritory = async (req, res) => {
    const { region_id } = req.query;
    try {
        const result = await soModel.getAsmTerritory(region_id);
        res.json(result);
        req.session.destroy();
    } catch (error) {
        console.error('Error rendering region page:', error);
        req.session.error = 'Failed to load regions';
        res.redirect('/dashboard');
    }
};

const AddSoTerritory = async(req, res)=>{
    try {
        const result = await soModel.AddSoTerritoryDb(req.body);

        res.redirect('/so')
    } catch (error) {
        console.error('Error rendering region page:', error);
        req.session.error = 'Failed to load regions';
        res.redirect('/dashboard');
    }
}


const updateSoTerritory = async(req, res)=>{
    try {

        const result = await soModel.UpdateSoTerritoryDb(req.body);

        res.redirect('/so')
    } catch (error) {
        console.error('Error rendering region page:', error);
        req.session.error = 'Failed to load regions';
        res.redirect('/dashboard');
    }
}


const renderUpdateterritory = async (req, res) => {
    try {
        let email = decryptData(req.cookies.e);
        let data = await navbar.selectQuery(email);
        let navbarviews = await navbar.navbarviewesult(data);
        
        const { id } = req.params;
        const SoTerritory = await soModel.getSoTerritoryById(id);
        const regions = await soModel.getAllRegion();
        
        console.log(SoTerritory,'SoTerritorySoTerritorySoTerritory')
        res.render('super_so/edit', { 
            title: 'Edit Territory', 
            token: navbarviews,
            regions,
            territory: {},
            success: req.session.success,
            error: req.session.error,
            user: req.session.user ,
            SoTerritory: SoTerritory[0]
        });
    } catch (error) {
        console.error('Error rendering edit territory page:', error);
        req.session.error = 'Failed to load edit territory page';
        res.redirect('/dashboard');
    }
};


module.exports = {
    renderSoPage,
    renderAddSoPage,
    renderAsmTerritory,
    AddSoTerritory,
    renderUpdateterritory,
    updateSoTerritory
};