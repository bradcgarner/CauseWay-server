'use strict';
const { keys } = require('./helper-keys');
const { usersListSelectStatement, oppsListSelectStatement } = require('./helper-sql');

const rawFromQuery = (queryObjectCC = {}, table, selectStatement) => {
  const select = selectStatement ? selectStatement : 'SELECT *' ;
  let rawSql = `${select} FROM ${table}`;
  if(Object.keys(queryObjectCC).length > 0) {

    const queryObject = convertCase(queryObjectCC, 'ccToSnake');
    const arrayOfQueries = Object.keys(queryObject).map( key => {
      return `LOWER(${key}) LIKE LOWER('%${queryObject[key]}%')`;
    });
    rawSql = arrayOfQueries.length > 1 ?
      `${select} FROM ${table} WHERE (${arrayOfQueries.join(') AND (')})`
      : `${select} FROM ${table} WHERE ${arrayOfQueries[0]}` ;
  }
  return rawSql;
};

let helper = {}; 

helper.buildUsersList = function(queryObject) {
  const table = 'users';
  const selectStatement = usersListSelectStatement();
  const rawSql = rawFromQuery(queryObject, table, selectStatement);

  const knex = require('../db');
  return knex
    .raw(rawSql)
    .then( users => {
      const usersList = users.rows;
      const usersListCauses = pushPrimitiveRepsIntoArray(usersList, 'causes');
      const usersListSkills = pushPrimitiveRepsIntoArray(usersListCauses, 'skills');
      const usersListLinks = pushLinksIntoArray(usersListSkills);
      return usersListLinks.map(user=> convertCase(user, 'snakeToCC'));
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

      // get user links
      return knex('links')
        .select('link_type as linkType', 'link_url as linkUrl')
        .where('id_user', '=', user.id);
    })
    .then( links => {
      user.links = links;

      // get user causes
      return knex('users_causes')
        .join('causes', 'users_causes.id_cause', '=', 'causes.id')
        .select('causes.id', 'causes.cause')
        .where('id_user', '=', user.id);
    })
    .then( causes => {
      causes.length > 0 ?
        user.causes = causes.map( cause => cause.cause ) :
        user.causes = [];
      // get user skills
      return knex('users_skills')
        .join('skills', 'users_skills.id_skill', '=', 'skills.id')
        .select('skills.id', 'skills.skill')
        .where('id_user', '=', user.id);
    })
    .then( skills => {
      skills.length > 0 ?
        user.skills = skills.map( skill => skill.skill ) :
        user.skills = [];

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
  let respArr = [];

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
      respArr = responses.slice();
      const responsePromisesArray = responses.map((response,index)=>{
        return knex('opportunities')
          .join('users', 'opportunities.id_user', '=', 'users.id')
          .select(keys.opportunitiesUsersKeys)
          .where('opportunities.id', '=', response.idOpportunity)
          .then( user => {
            respArr[index].organization = user[0].organization;
            respArr[index].firstName = user[0].firstName;
            respArr[index].lastName = user[0].lastName;
            respArr[index].userType = user[0].userType;
            respArr[index].logo = user[0].logo;
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
        responses: respArr
      });

      return user;
    });
};

helper.buildOppList = function(queryObject) {
  const table = 'opportunities';
  const selectStatement = oppsListSelectStatement();
  const rawSql = rawFromQuery(queryObject, table, selectStatement);
  const knex = require('../db');
  return knex
    .raw(rawSql) 
    .then( opps => {
      const oppsList = opps.rows.map(opp=> convertCase(opp, 'snakeToCC'));

      const oppsListCauses = pushPrimitiveRepsIntoArray(oppsList, 'causes');
      const oppsListUsers = pushNestedKeysIntoArray(oppsListCauses, 'users', keys.usersKeysAppendToOpportunityRaw);
        
      // START DELETING !!!!!!!!!!!
      //   const causePromisesArray = oppsList.map((opp,index)=>{
      //     return knex('opportunities_causes')
      //       .join('causes', 'opportunities_causes.id_cause', '=', 'causes.id')
      //       .select('causes.cause')
      //       .where('opportunities_causes.id_opportunity', '=', opp.id)
      //       .orderBy('causes.cause')
      //       .then( causes => {
      //         oppsList[index].causes = causes.map( cause => cause.cause);
      //       });
      //   });
      //   return Promise.all(causePromisesArray);
      // })

      // .then( () => {
      // console.log('causes should be in array now', oppsList[0]);
      // console.log('yyyyyyy');

      // const usersPromisesArray = oppsList.map((opp,index)=>{
      //   return knex('opportunities')
      //     .join('users', 'opportunities.id_user', '=', 'users.id')
      //     .select(keys.usersKeysAppendToOpportunity)
      //     .where('opportunities.id', '=', opp.id)
      //     .then( user => {
      //       oppsList[index].organization = user[0].organization;
      //       oppsList[index].logo = oppsList[index].logo || user[0].logo;
      //       oppsList[index].user = user[0];
      //     });
      // });
      // return Promise.all(usersPromisesArray);
      // })
      // .then(oppsList=>{

      return oppsListUsers.sort((a,b)=>{ // sort is not immutable
        return a.timestamp_start < b.timestamp_start ? -1 :
          a.timestamp_start > b.timestamp_start ? 1 : 0;
      });      
    });
};

helper.buildOpp = function(inOppId) {
  // console.log('start built opp',inOppId);
  let causeArr = [];
  let respArr = [];
  let oppObj = {};
  let opp = {};
  let oppOrg;
  const knex = require('../db');
  // get causes
  return knex('opportunities_causes')
    .join('causes', 'opportunities_causes.id_cause', '=', 'causes.id')
    .select('causes.cause')
    .where('opportunities_causes.id_opportunity', '=', inOppId)
    .orderBy('causes.cause')
    .then( results => {
      // console.log('opportunities_causes',results);

      causeArr = results.map( cause => cause.cause);
      // console.log('causeArr',causeArr);

      // get responses
      return knex('responses')
        .join('users', 'responses.id_user', '=', 'users.id')
        .select(keys.responsesUsersKeys)
        .where('responses.id_opportunity', '=', inOppId)
        .debug(false);
    })
    .then( responses => {
      // console.log('responses',responses);

      respArr = responses.slice();
      // get opp info
      return knex('opportunities')
        .join('users', 'opportunities.id_user', '=', 'users.id')
        .select(keys.opportunitiesUsersKeys)
        .where('opportunities.id', '=', inOppId)
        .debug(false);
    })
    .then( opportunities => {
      // console.log('opportunities',opportunities);

      oppObj = convertCase(opportunities[0], 'snakeToCC');
      // console.log('oppObj',oppObj);

      return this.getOrgName(oppObj.idUser);
    })
    .then( result => {
      // console.log('opp converted case',result);

      opp = Object.assign( {}, oppObj, {
        organization: result,
        causes: causeArr,
        responses: respArr
      });
      // console.log('opp with causes and responses',opp);

      return opp;
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

helper.buildOppCausesArr = function(oppId, inCausesArr) {

  let retArr = [];
  const knex = require('../db');
  
  return knex('causes')
    .select('id', 'cause')

    .then( allCauses => {
      inCausesArr.forEach( oppCause => {
        let tempCItem = allCauses.filter( item => item.cause === oppCause )[0];
        if (typeof tempCItem === 'object') {
          retArr.push(
            Object.assign( {}, {
              id_opportunity: oppId,
              id_cause: tempCItem.id
            })
          );
        }
      });
      return retArr;
    })

    .catch( err => {
      return {err: 500, message: `Internal server error: ${err}`};
    });
};

helper.buildResponse = function(inRespId) {
  let response = {};

  const knex = require('../db');
  return knex('responses')
    .join('users', 'responses.id_user', '=', 'users.id')
    .where('responses.id', '=', inRespId)
    .select(keys.responsesUsersKeys)
    .then( result => {
      response = convertCase(result[0], 'snakeToCC');
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
    const newArray = [];
    let rep = 0;
    while (object[`${field}${rep}`]) {
      newArray.push(object[`${field}${rep}`]);
      rep++;
    }
    newObject[field] = newArray;
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
    while (object[`link_url${rep}`] || object[`link_type${rep}`]) {
      newArray.push({
        linkUrl: object[`link_url${rep}`], 
        linkType: object[`link_type${rep}`]
      });
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

module.exports = { helper, convertCase };