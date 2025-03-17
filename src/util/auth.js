const { selectQueryByToken } = require("../models/account.model");
const jwt = require('jsonwebtoken');
const TOKEN_SECRET_KEY = process.env.TOKEN_SECRET_KEY;

const userAuth = async (req, res, next) => {
    let token = req.headers.authorization || req.body.authorization || req.cookies.token;
    
    if (!token) {
        return res.redirect('/account');
    }

    // let result = await selectQueryByToken(token);
    // if (result.length == 0 || !result) {
    //     return res.redirect('/account');
    // }
    jwt.verify(token, TOKEN_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.redirect('/account');
        }
        req.user = { userId: decoded };
        next();
    });
}

module.exports = { userAuth }