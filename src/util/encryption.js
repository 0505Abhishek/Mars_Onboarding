const CryptoJS = require("crypto-js");
const secretKey = "mnh&phy$secret*kjy@ou20!rc";

const encryptData = (data) => {
  try {
    if (data === undefined || data === null) {
      throw new Error("Invalid data for encryption");
    }

    const stringData = String(data); // ✅ Convert to string safely

    return CryptoJS.AES.encrypt(stringData, secretKey).toString();
  } catch (error) {
    console.error("Encryption error:", error.message);
    return null;
  }
};

const decryptData = (encryptedData) => {
    const bytes = CryptoJS.AES.decrypt(
      encryptedData,
      "mnh&phy$secret*kjy@ou20!rc"
    );
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  module.exports = { encryptData, decryptData };