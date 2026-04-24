const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('../controllers/preservation.controller');
const { protect } = require('../middleware/auth');

const upload = multer({
  dest: process.env.UPLOAD_DIR || './uploads',
  limits: { fileSize: parseInt(process.env.MAX_UPLOAD_SIZE || '52428800') }
});

router.get('/archives', controller.listArchives);
router.get('/archives/:id', controller.getArchive);
router.post('/archives', protect, upload.single('audio'), controller.createArchive);
router.post('/archives/:id/like', protect, controller.likeArchive);
router.get('/categories', controller.listCategories);
router.get('/endangered', controller.listEndangered);
router.get('/stats', controller.getStats);

module.exports = router;
