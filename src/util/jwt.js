const jwt = require('jsonwebtoken');
const TOKEN_SECRET_KEY = process.env.TOKEN_SECRET_KEY;
const TOKEN_EXSPIRESIN = process.env.TOKEN_EXSPIRESIN;

const createToken = async(userData) => {
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
    let token = req.headers.authorization || req.body.authorization || req.cookies.token ||req.query;

    try {
        const decoded = jwt.verify(token, TOKEN_SECRET_KEY);
        res.userDetail = decoded.userData;
        next()
    } catch (error) {
        console.log(error,'error');
        return res.render('account', { message: 'Invalid Token' });
    }
}

const getEmailTokenDetails = async (req,res,token) => {
    try {
        const decoded = jwt.verify(token, TOKEN_SECRET_KEY);
        let data  = decoded.userData;
        return data;
    } catch (error) {
         res.redirect('/account/token'); 
    }
}


const createResetToken = async (userData) => {
    const token = jwt.sign(
      { userData },
      TOKEN_SECRET_KEY,
      {
        expiresIn: '15m', 
      }
    );
    return token;
};


const tokenForWebPage = async (applicationId) => {
    try {
      const token = jwt.sign({ applicationId }, process.env.TOKEN_SECRET_KEY, {
        expiresIn: '6d',
      });

      return token; 
    } catch (error) {
      console.error('Error generating token:', error);
      throw new Error('Token generation failed');
    }
  };

module.exports = { createToken, verifyToken, getDetails, getEmailTokenDetails, createResetToken, tokenForWebPage }