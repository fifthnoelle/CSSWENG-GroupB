/**
 * One-time setup script — creates the first Admin account.
 *
 * Bug fix (#9): this replaces users.json, which stored a real admin
 * password ("admin1234") in PLAINTEXT, committed to source control. That
 * was a security problem on its own, but it was also functionally broken:
 * the app compares passwords with bcrypt.compare(), which can never match
 * a plaintext value, so if that file were ever imported directly into
 * MongoDB, the resulting account could never actually log in. It also
 * didn't meet the app's own 12-character/complexity password policy.
 *
 * Since the registration endpoint (POST /api/register) is Admin-only,
 * there's no way to create the very first Admin through the UI — this
 * script is the correct way to bootstrap that account instead.
 *
 * Usage:
 *   node backend/seed_admin.js
 *   (or: npm run seed:admin — see the script added to package.json)
 *
 * Reads the new admin's details from environment variables (e.g. in your
 * .env file) so no real credentials ever have to be committed to the repo:
 *
 *   SEED_ADMIN_EMAIL=owner@example.com
 *   SEED_ADMIN_PASSWORD=SomeStrongP@ssw0rd123
 *   SEED_ADMIN_FIRST_NAME=Admin
 *   SEED_ADMIN_LAST_NAME=Account
 *   SEED_ADMIN_SECURITY_QUESTION=What was your first job?
 *   SEED_ADMIN_SECURITY_ANSWER=Something only you know
 *
 * The script hashes the password and security answer with bcrypt before
 * writing anything to the database — nothing is ever stored in plaintext.
 */
try {
    require('dotenv').config();
} catch (e) {
    // dotenv not installed, skip .env loading — env vars may already be
    // set in the shell/deployment environment instead.
}

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const UsersModel = require('./models/user.model');
const { validatePasswordPolicy, validateSecurityAnswer } = require('./utils/auth');

async function main() {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    const firstName = process.env.SEED_ADMIN_FIRST_NAME || 'Admin';
    const lastName = process.env.SEED_ADMIN_LAST_NAME || 'Account';
    const securityQuestion = process.env.SEED_ADMIN_SECURITY_QUESTION;
    const securityAnswer = process.env.SEED_ADMIN_SECURITY_ANSWER;

    if (!email || !password || !securityQuestion || !securityAnswer) {
        console.error(
            'Missing required environment variables. Please set SEED_ADMIN_EMAIL, ' +
            'SEED_ADMIN_PASSWORD, SEED_ADMIN_SECURITY_QUESTION, and SEED_ADMIN_SECURITY_ANSWER ' +
            '(in your .env file, or in the shell before running this script).'
        );
        process.exit(1);
    }

    const policyError = validatePasswordPolicy(password);
    if (policyError) {
        console.error(`SEED_ADMIN_PASSWORD ${policyError}`);
        process.exit(1);
    }
    const answerError = validateSecurityAnswer(securityAnswer);
    if (answerError) {
        console.error(`SEED_ADMIN_SECURITY_ANSWER ${answerError}`);
        process.exit(1);
    }

    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not set.');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const existing = await UsersModel.findOne({ email: normalizedEmail });
        if (existing) {
            console.error(`A user with email ${normalizedEmail} already exists — nothing to do.`);
            process.exitCode = 1;
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const securityAnswerHash = await bcrypt.hash(securityAnswer.trim(), 10);

        const admin = new UsersModel({
            email: normalizedEmail,
            firstName,
            lastName,
            password: hashedPassword,
            passwordHistory: [hashedPassword],
            passwordChangedAt: new Date(),
            securityQuestion: securityQuestion.trim(),
            securityAnswerHash,
            role: 'admin'
        });

        await admin.save();
        console.log(`Admin account created: ${admin.email}`);
        console.log('Log in and change the password from the account menu right away.');
    } finally {
        await mongoose.disconnect();
    }
}

main().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
