const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify/:token', authController.verifyEmail);
router.get('/me', authMiddleware.authMiddleware, authController.me);
router.get('/readmes', authMiddleware.authMiddleware, authController.readmes);
router.post('/readmes', authMiddleware.authMiddleware, authController.createReadme);
router.put('/readmes/:id', authMiddleware.authMiddleware, authController.updateReadme);
router.delete('/readmes/:id', authMiddleware.authMiddleware, authController.deleteReadme);


module.exports = router;
