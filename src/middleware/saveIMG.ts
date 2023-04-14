import multer from 'multer';
import moment from 'moment';
import path from 'path';

const pathIMG = path.join(__dirname, '../../public/img');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      
      cb(null, pathIMG);

    },
    filename: (req, file, cb) => {

      const name =  moment().format('DDMMYYYY-HHmmss_SSS')
      cb(null, name + file.originalname);

    }
});

const upload = multer({ storage });

export default upload;