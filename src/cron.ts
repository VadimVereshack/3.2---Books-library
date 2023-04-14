import cron from 'node-cron';
import mysqldump from 'mysqldump';
import fs from 'fs';
import path from 'path';
import booksQuery from './SQLquery/booksQuery';
import authorsQuery from './SQLquery/authorsQuery';
import connectQuery from './SQLquery/connectionQuery';

export default cron.schedule('0 0 18 * * *', async () => {
    const dayNumber = new Date().getDay();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    await mysqldump({
        connection: {
            host: process.env.SQL_HOST as string,
            user: process.env.SQL_USER as string,
            password: process.env.SQL_PASSWORD as string,
            database: process.env.SQL_DATABASE as string
        },
        dumpToFile: `./backUpDB/${dayNumber != 0 ? dayNumber : 7}-${daysOfWeek[dayNumber]}.sql`,
    });
    console.log('save BackUP');

    const count = await dellElements();

    console.log(`Удалено книг - ${count}`)
});


async function dellElements(){

    let count = 0;

    const result = await booksQuery.getElem({fields: {id: true, img: true}, isTrash: true}) as Array<{id: string | number, img: string}> | undefined;

    if(result == undefined) return console.log('Не удалось очистить базу данных от мусора')

    for (let i = 0; i < result.length; i++){

        const idBook = result[i].id;

        dellImg(result[i].img);
        await booksQuery.dellElementById({id: idBook});

        count++;

        const connect = await connectQuery.getConnectByIdBook({idBook}) as Array<{id_author: string}> | undefined;

        if(connect == undefined) return console.log('Ошибка работы с базой данных');

        await connectQuery.dellConnect({idBook})

        const arrayAuthorsID = connect[0].id_author.split(' ');

        for(let j = 0; j < arrayAuthorsID.length; j++){

            const countConnect = await connectQuery.getCountConnectByIdAuthor({idAuthors: arrayAuthorsID[j]}) as Array<{count: number | string}> | undefined;

            if(countConnect == undefined) return console.log('Ошибка работы с базой данных');

            if(countConnect[0].count == 0) {

                authorsQuery.dellAuthorById({id: arrayAuthorsID[j]});

            }

        }

    }
    
    return count;

}


function dellImg(imgName: string){

    fs.unlink(path.join(__dirname, `../public/img/${imgName}`), (err) => {
  
        if(err) return console.log(`Не удалось удалить изображение "${imgName}"`);

        console.log(`Изображение "${imgName}" удалено`)
  
    });

}