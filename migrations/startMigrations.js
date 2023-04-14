const mySQL = require('mysql')
const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv');

dotenv.config();

if((process.argv.length != 4 || process.argv[2] == 'allUp') && (process.argv.length != 3 || process.argv[2] != 'allUp')) throw new Error('Вызов должен выглядеть так:\n node startMigration.mjs <functionName> <folderName>, или node startMigrations.js allUp');

const functionName = process.argv[2]
const folderName = process.argv[3]

start(functionName, folderName);

function start(func, name){

  switch(func) {

    case 'createMigration': return  createMigration(name);

    case 'dellMigration': return  dellMigration(name);
    
    case 'up': return up(name);

    case 'down': return down(name)

    case 'allUp': return allUp()

    default: throw new Error('Такой функции не существует');

  }

}


function createMigration(name){

  fs.mkdir(path.join(__dirname, 'sqlQuery', name), (error) => {

    if(error) throw new Error('Не удалось создать. Возможно такая миграция уже существует, или вы используете запрещённые символы');

    fs.writeFile(path.join(__dirname, 'sqlQuery', name, 'up.sql'), '', ()=>{});
    fs.writeFile(path.join(__dirname, 'sqlQuery', name, 'down.sql'), '', ()=>{});
  
    console.log(`Миграция "${name}" создана`)

  });

}


function dellMigration(name){

  fs.rm(path.join(__dirname, 'sqlQuery', name), { recursive: true }, (error) => {
    
    if(error) throw new Error('Не удалось удалить миграцию');
    
    console.log('Миграция удалена')

  });

}


function up(name){

  fs.readFile(path.join(__dirname, 'sqlQuery', name, 'up.sql'), 'utf8', (error, data) => {

    if(error) throw new Error('Не удалось прочитать содержимое файла up.sql');

    sqlQuery(data);
 
  });

}


function allUp(){

  fs.readdir(path.join(__dirname, 'sqlQuery'), (error, files) => {
    
    if(error) throw new Error('Не удалось прочитать содержимое папки sqlQuery');
    
    const folders = files.filter(file => fs.statSync(path.join(__dirname, 'sqlQuery', file)).isDirectory());
  
    for(let i = 0; i < folders.length; i++){
      
      up(folders[i]);

    }

  });

}


function down(name){

  fs.readFile(path.join(__dirname, 'sqlQuery', name, 'down.sql'), 'utf8', (error, data) => {

    if(error) throw new Error('Не удалось прочитать содержимое файла down.sql');

    sqlQuery(data)
 
  });

}


function sqlQuery(query){

  const connection = mySQL.createConnection({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE
  });

  connection.query(query,(error, results)=>{

    if(error) throw new Error('Не удалось сделать запрос. Указаны неправильные данные подключения, или некорректный запрос');

    console.log('Миграция выполнена');
    
  });

  connection.end();

}