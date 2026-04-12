const express = require('express');

const { getUserRepos } = require('../controllers/repoController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/api/repos', authMiddleware.authMiddleware, getUserRepos);

module.exports = router;
