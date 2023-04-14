import { Router } from 'express';
import { getAdminPage, addBook, getAdminPageParamsNumBook, markBookTrash, getAdminPageParamsSearch, getAdminPageParamsSearchAndPage} from '../../controller/adminRequests';
import checkAuth from '../../middleware/auth';
import upload from '../../middleware/saveIMG';

const ROUTER = Router();

ROUTER.get('/', checkAuth, getAdminPage);
ROUTER.get('/:page', checkAuth, getAdminPageParamsNumBook);
ROUTER.get('/search/:search', checkAuth, getAdminPageParamsSearch);
ROUTER.get('/search/:search/:page', checkAuth, getAdminPageParamsSearchAndPage);
ROUTER.post('/addbook', checkAuth, upload.single('image'), addBook);
ROUTER.post('/dellbook', checkAuth, markBookTrash);

module.exports = ROUTER;