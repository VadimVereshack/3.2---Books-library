import express,{Request,Response, NextFunction} from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cron from './cron'

dotenv.config();
cron.start();

const PROTOCOL = process.env.PROTOCOL;
const DOMEN = process.env.DOMEN;
const PORT = process.env.PORT;
const URL = `${PROTOCOL}://${DOMEN}:${PORT}`;
const API_VERSION = process.env.VERSION_API;

const USER_ROUTER = require(`./router/v${API_VERSION}/user_router`);
const ADMIN_ROUTER = require(`./router/v${API_VERSION}/admin_router`);

const APP = express();

APP.set('view engine', 'ejs');
APP.use(bodyParser.urlencoded({ extended: false }));
APP.use(bodyParser.json());
APP.use(`/css1`, express.static(path.join(__dirname, '../public/style.css')));
APP.use(`/css2`, express.static(path.join(__dirname, '../public/libs.min.css')));
APP.use(`/img`, express.static(path.join(__dirname, '../public/img')));

APP.use(`/api/v${API_VERSION}`, USER_ROUTER);
APP.use(`/admin/api/v${API_VERSION}`, ADMIN_ROUTER);

APP.use((req: Request, res: Response, next: NextFunction)=>{

    res.redirect(`/api/v${API_VERSION}`);

});

APP.listen(PORT, ()=>{

    console.log(`Server started...\nURL: ${URL}`)

});