import {Pool} from 'mysql';
import sql from '../mySQLConnect';

const nameTable = 'authors';

class Query{

    constructor(public sql: Pool) {
        this.sql = sql;
      }


      async isAuthor(params: {authorName: string}): Promise<boolean>{

        const query = `SELECT COUNT(*) AS count FROM ${nameTable} WHERE name = ?`;

        const result = await queryProm(sql, query, [`${params.authorName}`]).catch(()=>{}) as Array<{count: number}> | undefined;

        return result == undefined ? false : result[0].count == 0 ? false : true;
      
      }


      async getIdByAuthor(params: {authorName: string | number}){

        const query = `SELECT id FROM ${nameTable} WHERE name = ?`;

        return await queryProm(sql, query, [params.authorName]);

      }


      async getAuthorById(params: {id: string | number}){

        const query = `SELECT name FROM ${nameTable} WHERE id = ?`;

        return await queryProm(sql, query, [params.id]);

      }


      async addAuthor(params: {authorName: string}){

        const query = `INSERT INTO ${nameTable} (name) VALUES (?)`

        return await queryProm(sql, query, [params.authorName]).catch(()=>{});

      }


      async dellAuthorById(params: {id: string | number}){

        const query = `DELETE FROM ${nameTable} WHERE id = ?`;

        return await queryProm(sql, query, [params.id]).catch(()=>{});

      }
}


function queryProm(sql: Pool, query: string, elemArray: (string | number)[]){
  
    return new Promise ((resolve, reject) => {
        
        sql.query(`${query}`, elemArray, (error, results)=>{
  
          if (error) reject(error);
  
          resolve(results);
  
        });
  
      });
  
  }
  
  
  export default new Query(sql);