const { selectQueryByToken } = require("../models/account.model");
const jwt = require('jsonwebtoken');
const TOKEN_SECRET_KEY = process.env.TOKEN_SECRET_KEY;

const userAuth = async (req, res, next) => {
    try{
    let token = req.headers.authorization || req.body.authorization || req.cookies.token;
    
    
    if (!token) {
        return res.redirect('/');
    }

    // let result = await selectQueryByToken(token);
    // if (result.length == 0 || !result) {
    //     return res.redirect('/account');
    // }
    jwt.verify(token, TOKEN_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.redirect('/');
        }
        req.user = { userId: decoded };
        next();
    });
  }catch(error){
    console.log(error,'.............error...................');
  }
}


const TerritoryToken = async (req, res, next) => {
    let token = req.headers.authorization || req.body.authorization || req.cookies.TerritoryToken;
    

    if (!token) {
        return res.redirect('/');
    }

    jwt.verify(token, TOKEN_SECRET_KEY, (err, decoded) => {
        if (err) {
            console.log(err,".................................");
            return res.redirect('/');
        }
        req.user = { userId: decoded };
        next();
    });
}


const emailAuth = async (req, res, next) => {
    let token = req.query.token ;

    if (!token) {
        console.log({ message: ' Token has expired!' });
        return res.redirect('/account/token'); 
    }
    jwt.verify(token, TOKEN_SECRET_KEY, (err, decoded) => {
        if (err) {
            console.log(err);
            return res.redirect('/account/token'); 
        }
        req.user = { userId: decoded };
        next();
    });
}


const offboardEmailAuth = async (req, res, next) => {
    let token = req.params.token; 

    if (!token) {
        console.log({ message: 'Token is missing or expired!' });
        return res.redirect('/account/token'); 
    }

    jwt.verify(token, TOKEN_SECRET_KEY, (err, decoded) => {
        if (err) {
            console.log("Token verification failed:", err);
            return res.redirect('/account/token');
        }

        req.user = decoded; 
        next();
    });
};

module.exports = { userAuth, emailAuth, offboardEmailAuth, TerritoryToken }