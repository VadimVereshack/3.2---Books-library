import {Pool} from 'mysql';
import sql from '../mySQLConnect';

const nameTable = 'connections';

class Query{

    constructor(public sql: Pool) {}


    async getCountConnectByIdAuthor(params: {idAuthors: string | number}){
        const query = `SELECT COUNT(*) AS count FROM ${nameTable} WHERE id_author LIKE ? OR id_author LIKE ? OR id_author LIKE ? OR id_author = ?`;
        
        return await queryProm(sql, query, [`% ${params.idAuthors} %`, `${params.idAuthors} %`, `% ${params.idAuthors}`, `${params.idAuthors}`]).catch(()=>{});

    }


    async getConnectByIdBook(params: {idBook: string | number}){
        
        const query = `SELECT id_author FROM ${nameTable} WHERE id_book = ?`;

        return await queryProm(sql, query, [params.idBook]);

    }



    async addConnect(params: {idBook: string | number, idAuthors: string| number}){

        const query = `INSERT INTO ${nameTable} (id_book, id_author) VALUES (?, ?)`

        return await queryProm(sql, query, [params.idBook, params.idAuthors]).catch(()=>{});

    }


    async dellConnect(params: {idBook: string | number}){
        
        const query = `DELETE FROM ${nameTable} WHERE id_book = ?`;

        return await queryProm(sql, query, [params.idBook]).catch(()=>{}); 

    }
}


function queryProm(sql: Pool, query: string, elemArray: (string | number)[]){

    return new Promise ((resolve, reject) => {
        
        sql.query(`${query}`, elemArray, (error, results)=>{
  
          if (error) {
  
            reject(error);
  
          }
  
          resolve(results);
  
        });
  
      });
  
  }
  
  
  export default new Query(sql);