const jwt = require('jsonwebtoken');
const TOKEN_SECRET_KEY = process.env.TOKEN_SECRET_KEY;
const TOKEN_EXSPIRESIN = process.env.TOKEN_EXSPIRESIN;

const createToken = (userData) => {
    const token = jwt.sign(
        { userData },
        TOKEN_SECRET_KEY,
        {
            expiresIn: TOKEN_EXSPIRESIN,
        }
    );
    return token;
}


const verifyToken = (token) => {
    const decode = jwt.verify(token, TOKEN_SECRET_KEY);
    return decode;
}


const getDetails = async (req, res, next) => {
    let token = req.headers.authorization || req.body.authorization || req.cookies.token;

    try {
        const decoded = jwt.verify(token, TOKEN_SECRET_KEY);
        res.userDetail = decoded.userData;
        next()
    } catch (error) {
        return res.render('account', { message: 'Invalid Token' });
    }
}

module.exports = { createToken, verifyToken, getDetails }