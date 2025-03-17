
function generateOTP() {
  const digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 4; i++) {
    OTP += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return OTP;
}


module.exports = { generateOTP }
