const router = require('express').Router();
const { imageStorage, videoStorage, documentStorage, image, video, document } = require('../libs/multer');
const { singleUpload, multiUpload, imagekit, generateQrCode, register, whoami, login , updateprofil} = require('../controllers/media.controllers');
const { restrict } = require('../middlewares/media.middlewares');


router.post('/storage/images', imageStorage.single('image'), singleUpload);
router.post('/storage/videos', videoStorage.single('video'), singleUpload);
router.post('/storage/documents', documentStorage.single('document'), singleUpload);

router.post('/storage/multi/images', imageStorage.array('image'), multiUpload);

router.post('/imagekit/images', image.single('image'), imagekit);
router.post('/imagekit/videos', video.single('video'), imagekit);
router.post('/imagekit/documents', document.single('document'), imagekit);
router.post('/imagekit/qr-codes', generateQrCode);
router.post('/imagekit/register', register);
router.post('/imagekit/login', login);
router.get('/imagekit/whoami', restrict, whoami);
router.put('/imagekit/update/:user_id', image.single('profile_picture'), updateprofil);




module.exports = router;