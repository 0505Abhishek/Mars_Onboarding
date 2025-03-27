const bcrypt = require('bcrypt');


const { updateLoginAttempt, updateLockout} = require("../../models/account.model");


const MIN_PASSWORD_LENGTH = 12;
const PASSWORD_HISTORY_LIMIT = 15;
const PASSWORD_EXPIRY_DAYS = 180;
const LOCKOUT_DURATION_MINUTES = 30;
const MAX_FAILED_ATTEMPTS = 4;



function isPasswordComplex(password) {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return {
            isValid: false,
            message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
        };
    }
        const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/;
        if (!complexityRegex.test(password)) {
            return {
                isValid: false,
                message: "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
            };
        }

    return {
        isValid: true,
        message: "Password is valid.",
    };
}


async function storePassword(user, newPassword) {

    const passwordHistory = user || [];

    for (const oldPasswordEntry of passwordHistory) {

        console.log(oldPasswordEntry.password_hash,"................................",newPassword);

        if (newPassword === oldPasswordEntry.password_hash) {
            return {
                status: false,
                message: 'Cannot reuse any of the last 15 passwords.',
            };
        }
    }

    return {
        status: true,
        message: 'Password is acceptable.',
    };
    
}

async function checkPasswordExpiry(user) {

    const lastUpdated = user.password_last_updated;
    const now = new Date();
    const daysSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > PASSWORD_EXPIRY_DAYS) {
        return{
            status:true, 
            message:'Password has expired. Please reset your password.'
        };
    }

    return{
        status:false, 
    };
}

// Function to handle login lockout
async function handleLoginAttempt(user) {
    if (user.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
        await updateLockout(new Date(), 1, user.email);
        return{status:false, message:`Account locked. Try again after ${LOCKOUT_DURATION_MINUTES} minutes.`};
    }
    
    return{status:true};

}

// Function to set up MFA for a user
function setupMFA(user) {
    const secret = speakeasy.generateSecret({ length: 20 });
    user.mfaSecret = secret.base32; 
    user.mfaEnabled = true;
    console.log(`MFA setup complete. Secret: ${secret.otpauth_url}`); 
    return secret.otpauth_url;
}

// Function to verify MFA code
function verifyMFA(user, token) {
    const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: token
    });
    if (!verified) {
        throw new Error('Invalid MFA token.');
    }
    return true;
}


module.exports = {
    isPasswordComplex,
    storePassword,
    checkPasswordExpiry,
    handleLoginAttempt,
    setupMFA,
};
