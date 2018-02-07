'use strict';
const { keys } = require('./helper-keys');
const { usersListSelectStatement, oppsListSelectStatement } = require('./helper-sql');

let helper = {}; 

helper.buildUsersList = function(queryObject) {
  const knex = require('../db');
  const table = 'users';
  const selectStatement = usersListSelectStatement();
  const rawSql = rawSqlFromQuery(queryObject, table, selectStatement);
  console.log('rawSql',rawSql);
  return knex
    .raw(rawSql)
    .then( users => {
      console.log('users',users);

      const usersList = users.rows;
      const usersListCauses = pushPrimitiveRepsIntoArray(usersList, 'causes');
      const usersListSkills = pushPrimitiveRepsIntoArray(usersListCauses, 'skills');
      const usersListLinks = pushLinksIntoArray(usersListSkills);
      return usersListLinks.map(user=> convertCase(user, 'snakeToCC'));
    });
};

helper.buildOppsList = function(rawSql = 'SELECT * FROM opportunities') {
  const knex = require('../db');
  return knex
    .raw(rawSql) 
    .then( opps => {
      const oppsList = opps.rows.map(opp=> convertCase(opp, 'snakeToCC'));
      const oppsListCauses = pushPrimitiveRepsIntoArray(oppsList, 'causes');
      const oppsListUsers = pushNestedKeysIntoArray(oppsListCauses, 'users', keys.usersKeysAppendToOpportunityRaw);
      // console.log('oppsListUsers',oppsListUsers);

      return oppsListUsers.sort((a,b)=>{ // sort is not immutable
        return a.timestamp_start < b.timestamp_start ? -1 :
          a.timestamp_start > b.timestamp_start ? 1 : 0;
      });      
    });
};

helper.buildUser = function (idUser) {
  let user = {};
  const knex = require('../db');

  // get user base info
  return knex('users')
    .select(keys.usersKeys)
    .where('id', '=', idUser)
    .then( users => {
      user = (users[0]);

      // get links
      return knex('links')
        .select('link_type as linkType', 'link_url as linkUrl')
        .where('id_user', '=', idUser);
    })
    .then( links => {
      user.links = links;

      // get causes
      return knex('users_causes')
        .join('causes', 'users_causes.id_cause', '=', 'causes.id')
        .select('causes.id', 'causes.cause')
        .where('id_user', '=', idUser);
    })
    .then( causes => {
      user.causes = causes.length > 0 ?
        causes.map( cause => cause.cause ) : [];

      // get skills
      return knex('users_skills')
        .join('skills', 'users_skills.id_skill', '=', 'skills.id')
        .select('skills.id', 'skills.skill')
        .where('id_user', '=', idUser);
    })
    .then( skills => {
      skills.length > 0 ?
        user.skills = skills.map( skill => skill.skill ) :
        user.skills = [];

      // console.log(user);
      return user;
    })
    .catch( err => {
      return {err: 500, message: `Internal server error: ${err}`};
    });
};

helper.getExtUserInfo = function(idUser) {
  let user = {};
  let adminOfArr = [];
  let adminsArr = [];
  let followsArr = [];
  let oppsArr = [];
  let responsesList = [];

  const knex = require('../db');

  // admin of
  return knex('roles')
    .join('users', 'roles.id_user_adding', '=', 'users.id')
    .where('capabilities', '=', 'admin')
    .andWhere('id_user_receiving', '=', idUser)
    .select( keys.rolesKeys )

    .then( adminOfs => {
      adminOfArr = adminOfs.slice();

      // admins
      return knex('roles')
        .join('users', 'roles.id_user_receiving', '=', 'users.id')
        .where('capabilities', '=', 'admin')
        .andWhere('id_user_adding', '=', idUser)
        .select(keys.rolesKeys);
    })
    .then( admins => {
      adminsArr = admins.slice();

      // following
      return knex('roles')
        .join('users', 'roles.id_user_receiving', '=', 'users.id')
        .where('capabilities', '=', 'following')
        .andWhere('id_user_adding', '=', idUser)
        .select(keys.rolesKeys);
    })
    .then( follows => {
      followsArr = follows.slice();

      // following
      return knex('opportunities')
        .where('id_user', '=', idUser)
        .select(keys.opportunitiesKeys)
        .orderBy('timestamp_start');
    })
    .then( opportunities => {
      oppsArr = opportunities.slice();

      const causePromisesArray = oppsArr.map((opp,index)=>{
        return knex('opportunities_causes')
          .join('causes', 'opportunities_causes.id_cause', '=', 'causes.id')
          .select('causes.cause')
          .where('opportunities_causes.id_opportunity', '=', opp.id)
          .orderBy('causes.cause')
          .then( causes => {
            oppsArr[index].causes = causes.map( cause => cause.cause);
          });
      });
      return Promise.all(causePromisesArray);
    })
    .then(()=>{
      const oppResponsePromisesArray = oppsArr.map((opp,index)=>{
        return knex('responses')
          .join('users', 'responses.id_user', '=', 'users.id')
          .select(keys.responsesUsersKeys)
          .where('id_opportunity', '=', opp.id)
          .then( responses => {
            oppsArr[index].responses = responses;
          });
      });
      return Promise.all(oppResponsePromisesArray);
    })
    .then(()=>{

      // responses
      return knex('responses')
        .join('opportunities', 'responses.id_opportunity', '=', 'opportunities.id')
        .where('responses.id_user', '=', idUser)
        .select(keys.responsesOpportunitiesKeys)
        .orderBy('responses.timestamp_created');
    })
    .then( responses => {
      responsesList = responses.slice();
      const responsePromisesArray = responses.map((response,index)=>{
        return knex('opportunities')
          .join('users', 'opportunities.id_user', '=', 'users.id')
          .select(keys.opportunitiesUsersKeys)
          .where('opportunities.id', '=', response.idOpportunity)
          .then( user => {
            if (user[0]) {
              if(user[0].length > 0) {
                const thisUser = user[0];
                responsesList[index].organization = thisUser.organization;
                responsesList[index].firstName = thisUser.firstName;
                responsesList[index].lastName = thisUser.lastName;
                responsesList[index].userType = thisUser.userType;
                responsesList[index].logo = thisUser.logo;
              }
            }
          });
      });
      return Promise.all(responsePromisesArray);
    })
    .then(()=>{

      user = Object.assign( {}, {
        adminOf: adminOfArr,
        admins: adminsArr,
        following: followsArr,
        opportunities: oppsArr,
        responses: responsesList
      });

      return user;
    });
};

helper.buildOpp = function(idOpp) {
  // console.log('start built opp',idOpp);
  let causesList = [];
  let responsesList = [];
  let opportunity = {};
  let oppOrg;
  const knex = require('../db');

  // get causes
  return knex('opportunities_causes')
    .join('causes', 'opportunities_causes.id_cause', '=', 'causes.id')
    .select('causes.cause')
    .where('opportunities_causes.id_opportunity', '=', idOpp)
    .orderBy('causes.cause')
    .then( causesFound => {
      causesList = causesFound.map( cause => cause.cause);

      // get responses
      return knex('responses')
        .join('users', 'responses.id_user', '=', 'users.id')
        .select(keys.responsesUsersKeys)
        .where('responses.id_opportunity', '=', idOpp)
        .debug(false);
    })
    .then( responses => {
      // console.log('responses',responses);
      responsesList = responses.slice();

      // get opportunity and user info
      return knex('opportunities')
        .join('users', 'opportunities.id_user', '=', 'users.id')
        .select(keys.opportunitiesUsersKeys)
        .where('opportunities.id', '=', idOpp)
        .debug(false);
    })
    .then( opportunities => {
      opportunity = convertCase(opportunities[0], 'snakeToCC');
      return Object.assign( {}, opportunity, {
        organization: opportunity.userType === 'organization' ? 
          opportunity.organization : 
          [opportunity.firstName, opportunity.lastName].join(' '),
        causes: causesList,
        responses: responsesList
      });
    });
};

helper.getOppTitle = function(oppId) {
  const knex = require('../db');
  return knex('opportunities')
    .select('title')
    .where('id', '=', oppId)
    .then( result => {
      return (result[0].title);
    });
};

helper.buildOppCausesArr = function(idOpportunity, causesStringArray) {
  const causesObjectArray = [];
  const knex = require('../db');
  
  return knex('causes')
    .select('id', 'cause')
    .then( allCauses => {
      causesStringArray.forEach( cause => {
        const foundCause = allCauses.filter( item => item.cause === cause )[0];
        if (typeof foundCause === 'object') {
          causesObjectArray.push(
            Object.assign( {}, {
              id_opportunity: idOpportunity,
              id_cause: foundCause.id
            })
          );
        }
      });
      return causesObjectArray;
    })
    .catch( err => {
      return {err: 500, message: `Internal server error: ${err}`};
    });
};

helper.buildResponse = function(idResponse) {
  let response = {};
  const knex = require('../db');

  const rawSql = `SELECT ${keys.responsesUsersKeysRaw.join(', ')} FROM responses JOIN users ON users.id = responses.id_user WHERE responses.id = ${idResponse}`;
  console.log('rawSql', rawSql);
  return knex
    .raw(rawSql)
  // return knex('responses')
  //   .join('users', 'responses.id_user', '=', 'users.id')
  //   .where('responses.id', '=', idResponse)
  //   .select(keys.responsesUsersKeys)
    .then( responseFound => {
      // console.log('responseFound',responseFound.rows[0]);
      response = convertCase(responseFound.rows[0], 'snakeToCC');
      return this.getOppTitle(response.idOpportunity)
        .then( title => {
          response = Object.assign( {}, response, {
            title: title
          });
          return response;
        });
    });
};

helper.getOrgName = function(idUser) {
  const knex = require('../db');
  return knex('users')
    .select('organization')
    .where('id', '=', idUser)
    .then( result => {
      return (result[0].organization);
    });
};

const rawSqlFromQuery = (queryObjectCC = {}, table, selectStatement) => {
  console.log('queryObjectCC',queryObjectCC);
  let select = selectStatement ? selectStatement : 'SELECT *' ;
  let join = ' ';
  let rawSql = `${select} FROM ${table}`;

  if(typeof queryObjectCC === 'object') { 
    if(Object.keys(queryObjectCC).length > 0) {  // there is a query, if not skip to end

      const queryObject = convertCase(queryObjectCC, 'ccToSnake');
      let arrayOfQueries = [];
      let operand = 'AND';
      const proxyColumns = {
        user: {
          columns: ['username', 'first_name', 'last_name', 'organization'],
          join: ' ', // must be empty string or blank space
        },
        opp: {
          columns: ['title', 'users.first_name', 'users.last_name', 'users.organization'],
          join: 'join users on opportunities.id_user = users.id',
        }  
      };

      // check for exact match to proxyColumns
      if(Object.keys(queryObject).length === 1 && Object.keys(proxyColumns).includes(Object.keys(queryObject)[0])) { 
        const proxy   = Object.keys(queryObject)[0];
        const value   = queryObject[proxy];
        join          = proxyColumns[proxy].join;
        const columns = proxyColumns[proxy].columns;
        operand = 'OR';
        console.log('proxy', proxy, 'value', value, 'operand', operand, 'columns', columns);

        arrayOfQueries = columns.map(column => {
          return `LOWER(${column}) LIKE LOWER('%${value}%')`;
        });

      } else { // if >0 query params, but !== 1 param... this starts wide open search
        console.log('else operand', operand);
        arrayOfQueries = Object.keys(queryObject).map( key => {
          return `LOWER(${key}) LIKE LOWER('%${queryObject[key]}%')`;
        });
      }
      console.log('arrayOfQueries', arrayOfQueries);

      rawSql = arrayOfQueries.length > 1 ?
        `${rawSql} ${join} WHERE (${arrayOfQueries.join(`) ${operand} (`)})`:
        `${rawSql} ${join} WHERE ${arrayOfQueries[0]}` ;
    } // end if query Object has any keys
  } // end if queryObject is an object
  return rawSql;  
};


// select * from opportunities where lower(title) like lower('%need%'); 
// select title, users.organization from opportunities join users on opportunities.id_user = users.id where lower(title) like lower('%need%');

// @@@@@@@@@@@@@ COMPACTING JOIN ARRAYS @@@@@@@@@@@@@@

const pushNestedKeysIntoArray = (object, prefix, keys) => {
  // prefix: e.g. 'users'
  // input: {users.name: x, users.id: y} // output: users: {name: x, id: y}
  if (Array.isArray(object)) {
    return object.map(singleObject => pushNestedKeysIntoArray(singleObject, prefix, keys));
  } else {
    const preformattedKeys = keys.map(key=>key.slice(prefix.length+1,key.length));
    const formattedKeys = preformattedKeys.map(key=>{
      return key.includes(' as ') ? key.slice(key.indexOf(' as ')+4,key.length) : key ;
    });
    const newObject = Object.assign({}, object);
    const newArray = [];
    let rep = 0;
    for (let key in keys) {
      const correctedKey = key.slice(0,prefix.length+1) === `${prefix}_` ? key.slice(prefix.length+1,key.length) : key ;
      if (object[`${key}`]) {
        newArray.push(object[correctedKey]);
      }
    }
    newObject[prefix] = newArray;
    return newObject;
  }
};

const pushPrimitiveRepsIntoArray = (object, field) => {
  // input: {causes1: x, causes2: y} // output: causes: [x,y]
  if (Array.isArray(object)) {
    return object.map(singleObject => pushPrimitiveRepsIntoArray(singleObject, field));
  } else {
    const newObject = Object.assign({}, object);
    // console.log('  ');
    // console.log('@######@ object',object);

    const newArray = [];
    let rep = 0;
    while (object[`${field}${rep}`] || object[`${field}${rep}`] === null) {
      if(object[`${field}${rep}`]) newArray.push(object[`${field}${rep}`]);
      delete newObject[`${field}${rep}`];
      // console.log('%%%%%%', `${field}${rep}`, newObject[`${field}${rep}`]);
      rep++;
    }
    newObject[field] = newArray;
    // console.log('@######@ newObject',newObject);
    // console.log('  ');
    return newObject;
  }
};

const pushLinksIntoArray = (object) => {
  // input: {causes1: x, causes2: y} // output: causes: [x,y]
  // console.log('object',object);
  if (Array.isArray(object)) {
    return object.map(singleObject => pushLinksIntoArray(singleObject));
  } else {
    const newObject = Object.assign({}, object);
    const newArray = [];
    let rep = 0;
    while (object[`link_url${rep}`] || object[`link_type${rep}`] || object[`link_url${rep}`] === null || object[`link_type${rep}`] === null ) {
      if (object[`link_url${rep}`] || object[`link_type${rep}`]) {
        newArray.push({
          linkUrl: object[`link_url${rep}`], 
          linkType: object[`link_type${rep}`]
        });
      } 
      delete newObject[`link_url${rep}`];
      delete newObject[`link_type${rep}`];
      rep++;
    }
    newObject.links = newArray;
    return newObject;
  }
};

function convertCase(inputObject, mode, limitingList) {
  // console.log('inputObject', inputObject);
  const caseObject = {};
  const conversionTable = mode === 'ccToSnake' ? keys.ccToSnake : keys.snakeToCC ;

  Object.keys(inputObject).forEach(key => {
    if(conversionTable[key]) {
      caseObject[conversionTable[key]] = inputObject[key];
    } else {
      caseObject[key] = inputObject[key];
    }
  });

  if(keys[limitingList]) {
    for (let key in caseObject) {
      // console.log('key', key);
      if(!(keys[limitingList].includes(key))) {
        // console.log('    delete key', key);
        delete caseObject[key];
      }
    }
  }

  return caseObject;
}

module.exports = { 
  helper, 
  convertCase, 
  pushNestedKeysIntoArray, 
  pushLinksIntoArray, 
  pushPrimitiveRepsIntoArray,
  rawSqlFromQuery,
};