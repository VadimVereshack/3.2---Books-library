import {Request, Response} from 'express';
import path from 'path';
import booksQuery from '../SQLquery/booksQuery';
import authorsQuery from '../SQLquery/authorsQuery';
import connectQuery from '../SQLquery/connectionQuery';

const PROTOCOL = process.env.PROTOCOL;
const DOMEN = process.env.DOMEN;
const PORT = process.env.PORT;
const URL = `${PROTOCOL}://${DOMEN}:${PORT}`
const API_VERSION = process.env.VERSION_API;
const VIEV_COUNTBOOK_USER = Number(process.env.VIEV_COUNTBOOK_USER);
const PLUS_VIEV_COUNTBOOK_USER = Number(process.env.PLUS_VIEV_COUNTBOOK_USER);


export async function getPage(req: Request, res: Response){

    res.redirect(`/api/v${API_VERSION}/${VIEV_COUNTBOOK_USER}`);

}


export async function getPageParamsNumBook(req: Request, res: Response){

    const countBooks = await booksQuery.getCount() as Array<{count: number}> | undefined;

    if(!countBooks) return renderError(res, 'Неудалось установить связь с базой данных', 500);

    const numberBooks = countBooks[0].count;
    const numberBooksReceived = +req.params.offset > numberBooks ? numberBooks : +req.params.offset > VIEV_COUNTBOOK_USER ? +req.params.offset : VIEV_COUNTBOOK_USER;
    // http://url/1     =>    http://url/20
    // numberBooks = 80 && http://url/100   =>    http://url/80
    // http://url/текст   =>  http://url/20

    const books = await booksQuery.getElem({fields: {id: true, name: true, img: true}, limit: numberBooksReceived}) as Array<{id: string, author?: string | null}> | undefined;
    
    if(!books) return renderError(res, 'Неудалось установить связь с базой данных', 500);

    for(let i = 0; i < books.length; i++){
        
        books[i].author = await getAuthorList(books[i].id);
    
    }

    res.render(path.join(__dirname, '../../public/books-page.ejs'), {books, numberBooks, numberBooksReceived, numberVievBooks: VIEV_COUNTBOOK_USER, plusNumberVievBooks: PLUS_VIEV_COUNTBOOK_USER, keyWord: null, apiVersion: API_VERSION, url: URL});

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


export function getPageParamsSearch(req: Request, res: Response){

    const keyWord = req.params.search;
    res.redirect(`/api/v${API_VERSION}/search/${keyWord}/${VIEV_COUNTBOOK_USER}`);

}


export async function getPageParamsSearchAndNumBook(req: Request, res: Response){

    const keyWord = req.params.search

    const countBooks = await booksQuery.getCount({search: {name: keyWord}}) as Array<{count: number}> | undefined;

    if(!countBooks) return renderError(res, 'Неудалось установить связь с базой данных', 500);

    const numberBooks = countBooks[0].count;
    const numberBooksReceived = +req.params.offset > numberBooks ? numberBooks : +req.params.offset > VIEV_COUNTBOOK_USER ? +req.params.offset : VIEV_COUNTBOOK_USER;
    // http://url/1     =>    http://url/20
    // numberBooks = 80 && http://url/100   =>    http://url/80
    // http://url/текст   =>  http://url/20

    const books = await booksQuery.getElem({fields: {id: true, name: true, img: true}, search: {name: keyWord}, limit: numberBooksReceived}) as Array<{id: string, author?: string | null}> | undefined;

    if(!books) return renderError(res, 'Неудалось установить связь с базой данных', 500);

    for(let i = 0; i < books.length; i++){
        
        books[i].author = await getAuthorList(books[i].id);
        
    }

    res.render(path.join(__dirname, '../../public/books-page.ejs'), {books, numberBooks, numberBooksReceived, numberVievBooks: VIEV_COUNTBOOK_USER, plusNumberVievBooks: PLUS_VIEV_COUNTBOOK_USER, keyWord, apiVersion: API_VERSION, url: URL});

}


export async function getPageBook(req: Request, res: Response){

    const book = await booksQuery.getElemById({id: req.params.id, fields: {id:true, name: true, img: true, year: true, numberPages: true, info: true, clickBook: true}, isTrash: false}) as {id: string, name: string, img: string, author?: string | null, year: string, numberPages: string, info: string, clickBook: number}[] | undefined;

    if(!book) return renderError(res, 'Неудалось установить связь с базой данных', 500);

    if(book.length == 0) return renderError(res, 'Книги по такому номеру не существует', 404);


    if(!await plusViewBook(book[0].id, book[0].clickBook)) return renderError(res, 'Неудалось установить связь с базой данных', 500);

    book[0].author = await getAuthorList(req.params.id)

    res.render(path.join(__dirname, '../../public/book-page.ejs'),{book: book[0], apiVersion: API_VERSION, url: URL});

};


export async function plusViewRead(req: Request, res: Response){

    const element = await booksQuery.getElemById({id: req.body.id, fields: {clickRead: true}, isTrash: false}) as {clickRead: number}[] | undefined

    if(!element) return res.status(500).send(JSON.stringify({"error": "Неудалось установить связь с базой данных"}));

    if(element.length == 0) return res.status(404).send(JSON.stringify({"error": "Книги по такому номеру не существует"}));;

    const result = await booksQuery.setElemById({id: req.body.id, elem: {clickRead: element[0].clickRead + 1}})

    if(!result) return res.status(500).send(JSON.stringify({"error": "Неудалось установить связь с базой данных"}));

    res.send(JSON.stringify({"result": "ok"}));

};


async function plusViewBook(id: string, count: number){

    const result = await booksQuery.setElemById({id: id, elem: {clickBook: count + 1}});

    return result;

};


export async function getViewUser(req: Request, res: Response){
    
    const element = await booksQuery.getElemById({id: req.body.id, fields: {clickBook: true, clickRead: true}, isTrash: false}) as Array<{clickBook: number, clickRead: number}> | undefined

    if(!element) return res.status(500).send(JSON.stringify({"error": "Неудалось установить связь с базой данных"}));

    if(element.length == 0) return res.status(404).send(JSON.stringify({"error": "Книги по такому номеру не существует"}));;

    res.send(JSON.stringify({"clickBook":  element[0].clickBook, "clickRead": element[0].clickRead}));


};


function renderError(res: Response, errorMessage: String, status: number){

    res.status(status).render(path.join(__dirname, '../../public/errorPage.ejs'), {errorMessage, apiVersion: API_VERSION, url: URL});

};