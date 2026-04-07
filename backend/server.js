require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());
app.set('trust proxy', 1);

const MongoClient = require('mongodb').MongoClient;
let client;

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const hardcodedMongoUri = process.env.MONGODB_URI;

async function getMongoUri() {
    if (process.env.MONGODB_URI) {
        console.log('Using MONGODB_URI from .env');
        return process.env.MONGODB_URI;
    }

    try {
        console.log('MONGODB_URI not found locally, trying AWS Secrets Manager...');
        const client = new SecretsManagerClient({ region: "us-east-2" });
        const response = await client.send(
            new GetSecretValueCommand({ SecretId: "prod/readmemaybe/database" })
        );

        const secrets = JSON.parse(response.SecretString);
        if (!secrets.MONGODB_URI) {
            throw new Error('MONGODB_URI missing in Secrets');
        }

        return secrets.MONGODB_URI;
    } catch (err) {
        console.error('Could not get Mongo URI from AWS:', err);
        throw err;
    }
}

async function initDatabase() {
    const mongoUri = await getMongoUri();
    mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB connected (Mongoose)'))
    .catch(err => console.error(err));
}

initDatabase()
    .then(() => {
        console.log('Database ready, starting API...');
        app.listen(PORT, '127.0.0.1', () => {
            console.log(`API listening on 127.0.0.1:${PORT}`);
        });
    })
    .catch(err =>{
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    })

/*mongoose.connect(hardcodedMongoUri)
  .then(() => console.log('MongoDB connected (Mongoose)'))
  .catch(err => console.error(err));
*/

/*async function initializeDatabase() {
    let url = '';

    try {
        url = await getMongoUri();
    }
    catch (error) {
        if (error && error.name === 'CredentialsProviderError') {
            console.warn('AWS credentials not found, using hardcoded Mongo URI for local run.');
            url = hardcodedMongoUri;
        }
        else {
            throw error;
        }
    }

    if (!url) {
        throw new Error('Secret must contain MONGODB_URI');
    }

    const clientOptions = {
        tls: true,
        tlsAllowInvalidCertificates: false,
        serverSelectionTimeoutMS: 5000,
    };

    client = new MongoClient(url, clientOptions);
    await client.connect();
    console.log('Successfully connected to MongoDB!');
}
*/
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PATCH, DELETE, OPTIONS'
    );
    next();
});