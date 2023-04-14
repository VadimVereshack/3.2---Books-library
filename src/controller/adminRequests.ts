import {Request, Response} from 'express';
import path from 'path';
import fs from 'fs';
import booksQuery from '../SQLquery/booksQuery';
import authorsQuery from '../SQLquery/authorsQuery';
import connectQuery from '../SQLquery/connectionQuery';

const PROTOCOL = process.env.PROTOCOL;
const DOMEN = process.env.DOMEN;
const PORT = process.env.PORT;
const URL = `${PROTOCOL}://${DOMEN}:${PORT}`
const API_VERSION = process.env.VERSION_API;
const VIEV_COUNTBOOK_ADMIN = Number(process.env.VIEV_COUNTBOOK_ADMIN);


export function getAdminPage(req: Request, res: Response){

  
  res.redirect(`/admin/api/v${API_VERSION}/1`);

};


export async function getAdminPageParamsNumBook(req: Request, res: Response){

  const countBooks = await booksQuery.getCount() as {count: number}[] | undefined

  if(!countBooks) return renderError(res, 'Неудалось установить связь с базой данных', 500);

  const numberBooks = countBooks[0].count;
  const maxPage = Math.ceil(numberBooks / VIEV_COUNTBOOK_ADMIN);
  // Если на одной странице админа максимальное количество книг = 5: 
  // numberBooks == 10    =>    page = 2;
  // numberBooks == 11    =>    page = 3;
  // numberBooks == 15    =>    page = 3;

  const numberPage = +req.params.page <= maxPage && +req.params.page > 0 ? +req.params.page : 1;

  const books = await booksQuery.getElem({fields:{id: true, name: true, img: true, year: true, numberPages: true, info: true, clickBook: true, clickRead: true}, limit: VIEV_COUNTBOOK_ADMIN, offset: (numberPage-1)*VIEV_COUNTBOOK_ADMIN}) as Array<{id: string | number, author: string | null}> | undefined

  if(!books) return renderError(res, 'Неудалось установить связь с базой данных', 500);

  for(let i = 0; i < books.length; i++){
        
    books[i].author = await getAuthorList(books[i].id);

  }

  res.render(path.join(__dirname, '../../public/admin-page.ejs'), {books, maxPage, numberPage, keyWord: null, apiVersion: API_VERSION, url: URL});

};


export function getAdminPageParamsSearch(req: Request, res: Response){

  const keyWord = req.params.search;
  res.redirect(`/admin/api/v${API_VERSION}/search/${keyWord}/1`);

}


export async function getAdminPageParamsSearchAndPage(req: Request, res: Response){

  const keyWord = req.params.search

  const countBooks = await booksQuery.getCount({search: {name: keyWord}}) as Array<{count: number}> | undefined;

  if(!countBooks) return renderError(res, 'Неудалось установить связь с базой данных', 500);

  const numberBooks = countBooks[0].count;
  const maxPage = Math.ceil(numberBooks / VIEV_COUNTBOOK_ADMIN);
  // Если на одной странице админа максимальное количество книг = 5: 
  // numberBooks == 10    =>    page = 2;
  // numberBooks == 11    =>    page = 3;
  // numberBooks == 15    =>    page = 3;

  const numberPage = +req.params.page <= maxPage && +req.params.page > 0 ? +req.params.page : 1;

  const books = await booksQuery.getElem({fields: {id: true, name: true, img: true, year: true, numberPages: true, info: true, clickBook: true, clickRead: true}, search: {name: keyWord}, offset: (numberPage-1)*VIEV_COUNTBOOK_ADMIN, limit: VIEV_COUNTBOOK_ADMIN}) as Array<{id: number | string, author?: string | null}> | undefined;

  if(!books) return renderError(res, 'Неудалось установить связь с базой данных', 500);

  for(let i = 0; i < books.length; i++){
      
      books[i].author = await getAuthorList(books[i].id);
      
  }

  res.render(path.join(__dirname, '../../public/admin-page.ejs'), {books, maxPage, numberPage, keyWord, apiVersion: API_VERSION, url: URL});

}


async function getAuthorList(id: number | string){

  const result = await connectQuery.getConnectByIdBook({idBook: id}) as Array<{id_author: string}> | undefined;

  if(!result) return null;

  const arrayAuthorID = result[0].id_author.trim().split(' ');

  const arrayAuthors: string[] = [];

  for (let i = 0; i < arrayAuthorID.length; i++){

      const result = await authorsQuery.getAuthorById({id: arrayAuthorID[i]}) as Array<{name: string}> | undefined

      if(!result || result.length == 0) return null;

      arrayAuthors.push(result[0].name)

  }

  return arrayAuthors.join(', ');

}


export function addBook(req: Request, res: Response){

  if(req.file){

    const filename = req.file.filename;
    const {name, author, year, numberPages, info} = req.body;

    addBookSQL(res, name.trim(), filename.trim(), author.trim(), year.trim(), numberPages.trim(), info.trim());

  };

};


export async function markBookTrash(req: Request, res: Response){;

  const result = await booksQuery.setElemById({id: req.body.id, elem:{isTrash: true}})
 
  if(!result) return res.status(500).send(JSON.stringify({"error": "Неудалось установить связь с базой данных"}));

  res.send(JSON.stringify({"result": "ok"}));
  
};


async function addBookSQL(res: Response, name: string, img: string, author: string, year: string, numberPages: string, info: string){

  let authors = author.split(',').map(author => author.trim());
  authors = authors.filter((element, index) => element != '' && authors.indexOf(element) === index);

  let authors_id = '';

  for(let i =0; i < authors.length; i++){
    
    if(await authorsQuery.isAuthor({authorName: authors[i]})){

      authors_id += `${await getAuthorId(authors[i])} `;

    } else {

      authors_id +=`${await addAuthor(authors[i])} `

    }

  }

  authors_id = authors_id.trim();

  const newBook = await booksQuery.addElem({elem: {name,img,year,numberPages,info,clickBook: 0,clickRead: 0, isTrash: false}}) as {insertId: number} | undefined;
  
  if(!newBook) {

    fs.unlink(path.join(__dirname, `../../public/img/${img}`), (err) => {});
    return res.status(500).send(JSON.stringify({"error": "Неудалось установить связь с базой данных"}));
  
  }

  const newConnection = await connectQuery.addConnect({idBook: newBook.insertId, idAuthors: authors_id}) as {insertId: number} | undefined;

  if(!newConnection) return res.status(500).send(JSON.stringify({"error": "Неудалось установить связь с базой данных"}));

  res.send(JSON.stringify({"result": "ok"}));

};


async function getAuthorId(author: string){

  const authorID = await authorsQuery.getIdByAuthor({authorName: author}) as Array<{id: string | number}>;

  return !authorID ? null : authorID[0].id;
 
}

async function addAuthor(author: string){

  const newAuthor = await authorsQuery.addAuthor({authorName: author}) as {insertId: number} | undefined;

  return !newAuthor ? null : newAuthor.insertId
 
}


function renderError(res: Response, errorMessage: String, status: number){

  res.status(status).render(path.join(__dirname, '../../public/errorPage.ejs'), {errorMessage, apiVersion: API_VERSION, url: URL});

};