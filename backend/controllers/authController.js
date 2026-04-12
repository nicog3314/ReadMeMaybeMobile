const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isMailerConfigured, sendEmail } = require('../utils/mailer');

const EMAIL_VERIFICATION_TTL = '1d';

function buildVerificationUrl(req, token) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}/api/auth/verify/${token}`;
}

function normalizeReadmes(rawReadmes = [], fallbackCreatedAt = new Date()) {
    if (!Array.isArray(rawReadmes)) {
        return [];
    }

    return rawReadmes
        .map((entry, index) => {
            if (typeof entry === 'string') {
                return {
                    id: `readme-${index}`,
                    title: `README ${index + 1}`,
                    repository: '',
                    repositoryUrl: '',
                    content: entry,
                    tags: [],
                    createdAt: fallbackCreatedAt,
                };
            }

            const source = entry && typeof entry.toObject === 'function' ? entry.toObject() : entry || {};
            const content = source.content || source.markdown || source.readme || source.text || '';
            const title =
                source.title ||
                source.name ||
                source.repositoryName ||
                source.repoName ||
                source.repository ||
                `README ${index + 1}`;
            const repository = source.repository || source.repositoryName || source.repoName || title;
            const repositoryUrl = source.repositoryUrl || source.repoUrl || source.url || '';
            const rawTags = Array.isArray(source.tags)
                ? source.tags
                : Array.isArray(source.topics)
                    ? source.topics
                    : [];

            return {
                id: String(source._id || `readme-${index}`),
                title,
                repository,
                repositoryUrl,
                content,
                tags: rawTags
                    .filter((tag) => typeof tag === 'string' && tag.trim())
                    .map((tag) => tag.trim()),
                createdAt: source.createdAt || source.updatedAt || fallbackCreatedAt,
                updatedAt: source.updatedAt || source.createdAt || fallbackCreatedAt,
            };
        })
        .filter((entry) => entry.content || entry.repository || entry.title);
}

function buildStoredReadmes(rawReadmes = [], fallbackCreatedAt = new Date()) {
    return normalizeReadmes(rawReadmes, fallbackCreatedAt).map((entry) => ({
        title: entry.title,
        repository: entry.repository,
        repositoryUrl: entry.repositoryUrl,
        content: entry.content,
        tags: entry.tags,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt || entry.createdAt,
    }));
}

function getStoredReadmes(source) {
    if (Array.isArray(source.readmes) && source.readmes.length > 0) {
        return source.readmes;
    }

    if (Array.isArray(source.generatedReadmes) && source.generatedReadmes.length > 0) {
        return source.generatedReadmes;
    }

    if (Array.isArray(source.savedReadmes) && source.savedReadmes.length > 0) {
        return source.savedReadmes;
    }

    return Array.isArray(source.readmes) ? source.readmes : [];
}

function getLegacyReadmes(source) {
    if (Array.isArray(source.generatedReadmes) && source.generatedReadmes.length > 0) {
        return source.generatedReadmes;
    }

    if (Array.isArray(source.savedReadmes) && source.savedReadmes.length > 0) {
        return source.savedReadmes;
    }

    return [];
}

async function ensurePrimaryReadmes(user) {
    if (Array.isArray(user.readmes) && user.readmes.length > 0) {
        return;
    }

    const legacyReadmes = getLegacyReadmes(user);

    if (legacyReadmes.length === 0) {
        return;
    }

    user.readmes = buildStoredReadmes(legacyReadmes, user.createdAt);
    await user.save();
}

function normalizeReadmeInput(body = {}) {
    const rawTags = Array.isArray(body.tags)
        ? body.tags
        : typeof body.tags === 'string'
            ? body.tags.split(',')
            : [];

    return {
        title: typeof body.title === 'string' ? body.title.trim() : '',
        repository: typeof body.repository === 'string' ? body.repository.trim() : '',
        repositoryUrl: typeof body.repositoryUrl === 'string' ? body.repositoryUrl.trim() : '',
        content: typeof body.content === 'string' ? body.content : '',
        tags: rawTags
            .filter((tag) => typeof tag === 'string' && tag.trim())
            .map((tag) => tag.trim()),
    };
}

function serializeUser(user) {
    const source = user && typeof user.toObject === 'function' ? user.toObject() : user;
    const storedReadmes = getStoredReadmes(source);

    return {
        _id: source._id,
        FirstName: source.FirstName,
        LastName: source.LastName,
        Login: source.Login,
        Email: source.Email,
        createdAt: source.createdAt,
        readmes: normalizeReadmes(storedReadmes, source.createdAt),
    };
}

const register = async (req, res) => {
    try{
        const{FirstName, LastName, Login = '', Email = '', Password} = req.body;
        const normalizedLogin = Login.trim().toLowerCase();
        const normalizedEmail = Email.trim().toLowerCase();

        // check if the login is taken
        const existingLogin = await User.findOne({Login: normalizedLogin});
        if (existingLogin){
            return res.status(400).json({message: 'Login already in use'});
        }

        // check if the email is taken
        const existingEmail = await User.findOne({Email: normalizedEmail});
        if (existingEmail){
            return res.status(400).json({message: 'Email already in use'});
        }

        // hash and salt password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(Password, saltRounds);

        // create the user
        const newUser = await User.create({
            FirstName,
            LastName,
            Login: normalizedLogin,
            Email: normalizedEmail,
            EmailVerified: false,
            hashedPassword
        });

        const emailToken = jwt.sign(
            { id: newUser._id.toString(), type: 'email-verification' },
            process.env.JWT_SECRET,
            { expiresIn: EMAIL_VERIFICATION_TTL }
        );
        const verificationUrl = buildVerificationUrl(req, emailToken);
        const subject = 'Verify your email for ReadMeMaybe';
        const text = [
            'Welcome to ReadMeMaybe.',
            `Open this link to verify your account: ${verificationUrl}`,
            'This link expires in 24 hours.'
        ].join('\n\n');
        const html = `
            <h2>Welcome to ReadMeMaybe</h2>
            <p>Click below to verify your account.</p>
            <p><a href="${verificationUrl}">Verify Email</a></p>
            <p>This link expires in 24 hours.</p>
        `;

        if (isMailerConfigured()) {
            await sendEmail({
                to: newUser.Email,
                subject,
                text,
                html
            });
        } else {
            console.log(`[register] Mailer not configured. Verification link for ${newUser.Email}: ${verificationUrl}`);
        }

        //return on success
        res.status(201).json({
            user: serializeUser(newUser),
            message: 'User registered. Please check email to verify your account.'
        });
    }catch(error){
        console.error(error);
        res.status(500).json({message: 'Server Error'});
    }
};

const login = async (req, res) => {
    try{
        // get email and password
        const{Email = '', Password} = req.body;
        const normalizedEmail = Email.trim().toLowerCase();

        // find user by email
        const returnUser = await User.findOne({Email: normalizedEmail});
        if(!returnUser){
            return res.status(400).json({message: 'Invalid Email'});
        }

        if (returnUser.EmailVerified === false) {
            return res.status(400).json({message: 'Please verify your email before logging in'});
        }

        // compare the password
        const match = await bcrypt.compare(Password, returnUser.hashedPassword);
        if(!match){
            return res.status(400).json({message: 'Incorrect Password'});
        }

        // generate jwt token
        const jwtToken = jwt.sign({id: returnUser._id}, process.env.JWT_SECRET, {expiresIn: '1h'});

        // return on success
        res.status(201).json({jwtToken, user: serializeUser(returnUser)});
    }catch(error){
        console.error(error);
        res.status(500).json({message: 'Server Error'})
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).send('Invalid verification link.');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'email-verification' || !decoded.id) {
            return res.status(400).send('Invalid verification link.');
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(400).send('User not found.');
        }

        if (user.EmailVerified) {
            return res.send('Email is already verified.');
        }

        user.EmailVerified = true;
        user.EmailVerifiedAt = new Date();
        await user.save();

        return res.send('Email was successfully verified! You may now login.');
    } catch (error) {
        console.error(error);
        return res.status(400).send('Invalid verification link.');
    }
};

const me = async(req, res) => {
    try{
        const user = await User.findById(req.user.id);
        if (!user) return res.status(400).json({message:'User not found.'});
        res.status(200).json(serializeUser(user));
    }catch (err){
        console.error(err);
        res.status(500).json({message: 'Server Error'});
    }
};

const readmes = async(req, res) => {
    try{
        const user = await User.findById(req.user.id).select('readmes generatedReadmes savedReadmes createdAt');
        if (!user) return res.status(400).json({message:'User not found.'});

        await ensurePrimaryReadmes(user);

        res.status(200).json({
            readmes: normalizeReadmes(user.readmes, user.createdAt),
        });
    }catch (err){
        console.error(err);
        res.status(500).json({message: 'Server Error'});
    }
};

const createReadme = async(req, res) => {
    try{
        const user = await User.findById(req.user.id).select('readmes generatedReadmes savedReadmes createdAt');
        if (!user) return res.status(400).json({message:'User not found.'});

        await ensurePrimaryReadmes(user);

        const nextReadme = normalizeReadmeInput(req.body);

        if (!nextReadme.content.trim() && !nextReadme.title && !nextReadme.repository) {
            return res.status(400).json({message: 'README content or title is required.'});
        }

        user.readmes.unshift(nextReadme);
        await user.save();

        const createdReadme = user.readmes[0];

        res.status(201).json({
            readme: normalizeReadmes([createdReadme], user.createdAt)[0],
            readmes: normalizeReadmes(user.readmes, user.createdAt),
        });
    }catch (err){
        console.error(err);
        res.status(500).json({message: 'Server Error'});
    }
};

const updateReadme = async(req, res) => {
    try{
        const user = await User.findById(req.user.id).select('readmes generatedReadmes savedReadmes createdAt');
        if (!user) return res.status(400).json({message:'User not found.'});

        await ensurePrimaryReadmes(user);

        const readme = user.readmes.id(req.params.id);
        if (!readme) return res.status(404).json({message:'README not found.'});

        const nextReadme = normalizeReadmeInput(req.body);

        readme.title = nextReadme.title;
        readme.repository = nextReadme.repository;
        readme.repositoryUrl = nextReadme.repositoryUrl;
        readme.content = nextReadme.content;
        readme.tags = nextReadme.tags;

        await user.save();

        res.status(200).json({
            readme: normalizeReadmes([readme], user.createdAt)[0],
            readmes: normalizeReadmes(user.readmes, user.createdAt),
        });
    }catch (err){
        console.error(err);
        res.status(500).json({message: 'Server Error'});
    }
};

const deleteReadme = async(req, res) => {
    try{
        const user = await User.findById(req.user.id).select('readmes generatedReadmes savedReadmes createdAt');
        if (!user) return res.status(400).json({message:'User not found.'});

        await ensurePrimaryReadmes(user);

        const readme = user.readmes.id(req.params.id);
        if (!readme) return res.status(404).json({message:'README not found.'});

        readme.deleteOne();
        await user.save();

        res.status(200).json({
            message: 'README deleted.',
            readmes: normalizeReadmes(user.readmes, user.createdAt),
        });
    }catch (err){
        console.error(err);
        res.status(500).json({message: 'Server Error'});
    }
};

module.exports = {
    register,
    login,
    verifyEmail,
    me,
    readmes,
    createReadme,
    updateReadme,
    deleteReadme
};
