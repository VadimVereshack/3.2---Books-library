import { Request, Response, NextFunction } from 'express';
import basicAuth from 'basic-auth';

const AUTH_LOGIN = process.env.AUTH_LOGIN;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;


export default function checkAuth(req: Request, res: Response, next: NextFunction) {
  
  const user = basicAuth(req);

  if (!user || user.name !== AUTH_LOGIN || user.pass !== AUTH_PASSWORD) {

    res.set('WWW-Authenticate', 'Basic');
    res.status(401).send();
    return;
  
  }

  next();

}
