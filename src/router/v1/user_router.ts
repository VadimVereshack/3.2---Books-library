import { Router } from 'express';
import {getPage, getPageParamsNumBook, getPageParamsSearch, getPageParamsSearchAndNumBook, getPageBook, plusViewRead, getViewUser} from '../../controller/userRequests';

const ROUTER = Router();

ROUTER.get('/', getPage);
ROUTER.post('/getviewcount', getViewUser);
ROUTER.get('/:offset', getPageParamsNumBook);
ROUTER.get('/search/:search', getPageParamsSearch)
ROUTER.get('/search/:search/:offset', getPageParamsSearchAndNumBook);
ROUTER.get('/book/:id', getPageBook);
ROUTER.post('/viewread', plusViewRead);

module.exports = ROUTER;