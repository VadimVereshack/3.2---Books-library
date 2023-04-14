import {Pool} from 'mysql';
import sql from '../mySQLConnect';

const nameTable = 'books'

type fieldsName = 'id' | 'name' | 'img' | 'year' | 'numberPages' | 'info' | 'clickBook' | 'clickRead' | 'isTrash'

type availabilityFields = {
  id?: boolean
  name?: boolean, 
  img?: boolean, 
  year?: boolean,  
  numberPages?: boolean, 
  info?: boolean, 
  clickBook?: boolean, 
  clickRead?: boolean,
  isTrash?: boolean
}

type valueFields = {
  id?: string | number,
  name?: string, 
  img?: string, 
  year?: string, 
  numberPages?: string, 
  info?: string, 
  clickBook?: string | number, 
  clickRead?: string | number
}

type getCountParams = {
  search?: Omit<valueFields, 'id'>
  isTrash?: boolean
}

type getElemParams = {
  fields?: availabilityFields;
  search?: Omit<valueFields, 'id'>
  limit?: number,
  offset?: number
  isTrash?: boolean
}


type getElemByIdParams = {
  id: string | number,
  isTrash?: boolean;
  fields?: availabilityFields
}

type setElemByIdParams = {
  id: string | number,
  elem: Omit<valueFields, 'id'> & {isTrash?: boolean},
  isTrash?: boolean
}

type addElemParams = {
  elem: Required<Omit<valueFields, 'id'>> & {isTrash?: boolean},
}

type dellElemByIdParams = {
    id: string | number,
}


class Query{

    constructor(public sql: Pool) {
        this.sql = sql;
      }

      async getCount(params?: getCountParams) {

        let search = '';
        const elem = [];
        elem.push(params != undefined && params.isTrash ? `${params.isTrash}` : 'false');

        if(params != undefined && params.search) {

          const keys = Object.keys(params.search); 
          search = keys.length > 0 ? ' AND' : '';

          for(let i = 0; i < keys.length; i++){

            search += ` ${keys[i]} LIKE ?`

            if(keys.length > i+1) search += ' OR';

            elem.push(`%${params.search[keys[i] as Exclude<fieldsName, 'id' | 'isTrash'>]}%`);

          }
           

        }

        const query = `SELECT COUNT(*) AS count FROM ${nameTable} WHERE isTrash = ?${search}`;
        return await queryProm(sql, query, elem).catch(()=>{});

      }
    

      async getElem(params?: getElemParams){

        const fields = getFieldsStr(params != undefined ? params.fields : undefined);
        let search = '';
        const elem = [];
        elem.push(params != undefined && params.isTrash ? `${params.isTrash}` : 'false');

        if(params != undefined && params.search){

          const keys = Object.keys(params.search);

          if(keys.length > 0) search = ' AND'

          for (let i = 0; i < keys.length; i++){

            search += ` ${keys[i]} LIKE ?`
            elem.push(`%${params.search[keys[i] as Exclude<fieldsName, 'id' | 'isTrash'>]}%`);

            if(keys.length>i+1) search += ' OR';

          }

        }

        const paramsLimit = params != undefined ? params.limit : undefined
        const paramsOffset = params != undefined ? params.offset : undefined
        const limit = paramsLimit ? (()=>{elem.push(paramsLimit); return ' LIMIT ?'})() : '';
        const offset = paramsOffset ? (()=>{elem.push(paramsOffset); return ' OFFSET ?'})() : '';

        const query = `SELECT ${fields} FROM ${nameTable} WHERE isTrash = ?${search}${limit}${offset}`;
        return await queryProm(sql, query, elem).catch(()=>{});

      }

      async getElemById(params: getElemByIdParams){

        const fields = getFieldsStr(params.fields);
        const elem = []
        elem.push(params != undefined && params.isTrash ? `${params.isTrash}` : 'false');
        elem.push(`${params.id}`)

        const query = `SELECT ${fields} FROM ${nameTable}  WHERE isTrash = ? AND id = ?`;
        
        return await queryProm(sql, query, elem).catch(()=>{});

      }


      async setElemById(params: setElemByIdParams){

        const queryElem: string[] = [];
        const elem = [];

        if(params.elem == null) return undefined

        const elemKey = Object.keys(params.elem);

        elemKey.forEach(key => {

          const partQuery = `${key} = ?`
          queryElem.push(partQuery);
          elem.push(`${params.elem[key as Exclude<fieldsName, 'id'>]}`)
        });
        
        const arrayPartQuery = queryElem.join(',') || '';
        elem.push(params != undefined && params.isTrash ? `${params.isTrash}` : 'false');
        elem.push(`${params.id}`);

        const query =`UPDATE ${nameTable} SET ${arrayPartQuery} WHERE isTrash = ? AND id = ?;`
        return await queryProm(sql, query, elem).catch(()=>{});

      }
      

      async addElem(params: addElemParams){
      
      const key = Object.keys(params.elem);
      const partQuery = key.join(',');
      const elem = key.map(key => `${params.elem[key as Exclude<fieldsName, 'id'>]}`)
      const valuesQuery = (elem.map(elem => `?`)).join(',')

      const query = `INSERT INTO ${nameTable} (${partQuery}) VALUES (${valuesQuery})`
      return await queryProm(sql, query, elem).catch(()=>{});

      }

      async dellElementById(params: dellElemByIdParams){

        const query = `DELETE FROM ${nameTable} WHERE isTrash = ? AND id = ?`;
        return await queryProm(sql, query, ['true', params.id]).catch(()=>{});

      }

}


function getFieldsStr(fields: availabilityFields | undefined){

    if (fields){

        const keys = Object.keys(fields).filter(key => fields[key as fieldsName]);

        if (keys.length != 0) return keys.join(',')

    }

    return '*'

  }


function queryProm(sql: Pool, query: string, elemArray: (string | number)[]){

  return new Promise ((resolve, reject) => {
    
    if(elemArray.length > 0){
      
      sql.query(query, elemArray, (error, results)=>{

        if (error) {

          reject(error);

        }

        resolve(results);

      });

    } else {

      sql.query(`${query}`, (error, results)=>{

        if (error) {

          reject(error);

        }

        resolve(results);

      });

    }

    });

}


export default new Query(sql);