'use strict';

let helper = {};

helper.buildListOfUsers = function() {
  let arrayOfUsers = [];
  let allCauses = [];
  let allLinks = [];
  let allSkills = [];

  const knex = require('../db');

  // get user causes
  return knex('users_causes')
    .join('causes', 'users_causes.id_cause', '=', 'causes.id')
    .select('users_causes.id_user', 'causes.id', 'causes.cause')
    .orderBy('users_causes.id_user')
    .then(causes => allCauses = causes.slice())
    .then( () => {

      // get user links
      return knex('links')
        .select('id_user', 'id', 'link_type as linkType', 'link_url as linkUrl')
        .orderBy('id_user');
    })
    .then( links => allLinks = links.slice())

    .then( () => {
      // get user skills
      return knex('users_skills')
        .join('skills', 'users_skills.id_skill', '=', 'skills.id')
        .select('users_skills.id_user', 'skills.id', 'skills.skill')
        .orderBy('users_skills.id_user');
    })
    .then( skills => allSkills = skills.slice())

    // get users
    .then( () => {
      return knex('users')
        .select(usersKeys)
        .orderBy('id');
    })
    .then( users => {
      users.forEach( user => {

        let userCauses = allCauses
          .filter( cause => cause.id_user === user.id)
          .map( cause => cause.cause);

        let userLinks = allLinks
          .filter( link => link.id_user === user.id)
          .map( link => Object.assign( {}, {
            id: link.id,
            linkType: link.linkType,
            linkUrl: link.linkUrl
          }));

        let userSkills = allSkills
          .filter( skill => skill.id_user === user.id)
          .map( skill => skill.skill);
          
        let mergedUser = Object.assign( {}, user,
          {
            causes: userCauses.slice(),
            links: userLinks.slice(),
            skills: userSkills.slice()
          }
        );
        arrayOfUsers.push(mergedUser);
      });
      return arrayOfUsers;
    });
};

helper.buildUser = function (idUser) {
  let user = {};
  const knex = require('../db');

  // get user base info
  return knex('users')
    .select(usersKeys)
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
    .select( rolesKeys )

    .then( adminOfs => {
      adminOfArr = adminOfs.slice();

      // admins
      return knex('roles')
        .join('users', 'roles.id_user_receiving', '=', 'users.id')
        .where('capabilities', '=', 'admin')
        .andWhere('id_user_adding', '=', idUser)
        .select(rolesKeys);
    })
    .then( admins => {
      adminsArr = admins.slice();

      // following
      return knex('roles')
        .join('users', 'roles.id_user_receiving', '=', 'users.id')
        .where('capabilities', '=', 'following')
        .andWhere('id_user_adding', '=', idUser)
        .select(rolesKeys);
    })
    .then( follows => {
      followsArr = follows.slice();

      // following
      return knex('opportunities')
        .where('id_user', '=', idUser)
        .select(opportunitiesKeys)
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
          .select(responsesUsersKeys)
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
        .select(responsesOpportunitiesKeys)
        .orderBy('responses.timestamp_created');
    })
    .then( responses => {
      respArr = responses.slice();
      const responsePromisesArray = responses.map((response,index)=>{
        return knex('opportunities')
          .join('users', 'opportunities.id_user', '=', 'users.id')
          .select(opportunitiesUsersKeys)
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

helper.buildRawSQLFromQuery = function(queryObjectCC) {
  let rawSQL = 'SELECT * FROM opportunities';
  if(Object.keys(queryObjectCC).length > 0) {
    const queryObject = this.convertCase(queryObjectCC, 'ccToSnake');
    const arrayOfQueries = Object.keys(queryObject).map( key => {
      return `LOWER(${key}) LIKE LOWER('%${queryObject[key]}%')`;
    });
    rawSQL = arrayOfQueries.length > 1 ?
      `SELECT * FROM opportunities WHERE (${arrayOfQueries.join(') AND (')})`
      : `SELECT * FROM opportunities WHERE ${arrayOfQueries[0]}` ;
    console.log('rawSQL',rawSQL);
  }
  return rawSQL;
};

helper.buildOppList = function(queryObject) {
  console.log('start', queryObject);
  const rawSQL = this.buildRawSQLFromQuery(queryObject);
  console.log('rawSQL', rawSQL);
  let oppsArray;

  const knex = require('../db');
  return knex
    .raw(rawSQL) 
    .then( opps => {
      console.log('opportunities', opps.rows[0]);
      console.log('~~~~~~~~');
      oppsArray = opps.rows.map(opp=> helper.convertCase(opp, 'snakeToCC'));
      console.log('oppsArray', oppsArray[0]);
      console.log('xxxxxxx');

      const causePromisesArray = oppsArray.map((opp,index)=>{
        return knex('opportunities_causes')
          .join('causes', 'opportunities_causes.id_cause', '=', 'causes.id')
          .select('causes.cause')
          .where('opportunities_causes.id_opportunity', '=', opp.id)
          .orderBy('causes.cause')
          .then( causes => {
            oppsArray[index].causes = causes.map( cause => cause.cause);
          });
      });
      return Promise.all(causePromisesArray);
    })

    .then( () => {
      console.log('causes should be in array now', oppsArray[0]);
      console.log('yyyyyyy');

      const usersPromisesArray = oppsArray.map((opp,index)=>{
        return knex('opportunities')
          .join('users', 'opportunities.id_user', '=', 'users.id')
          .select(usersKeysAppendToOpportunity)
          .where('opportunities.id', '=', opp.id)
          .then( user => {
            oppsArray[index].organization = user[0].organization;
            oppsArray[index].logo = oppsArray[index].logo || user[0].logo;
            oppsArray[index].user = user[0];
          });
      });
      return Promise.all(usersPromisesArray);
    })
    .then(()=>{
      return oppsArray.sort((a,b)=>{
        if (a.timestamp_start < b.timestamp_start) {
          return -1;
        }
        if (a.timestamp_start > b.timestamp_start) {
          return 1;
        }
        return 0;
      });      
    });
};

helper.buildOpp = function(inOppId) {
  console.log('start built opp',inOppId)
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
      console.log('opportunities_causes',results)

      causeArr = results.map( cause => cause.cause);
      console.log('causeArr',causeArr)

      // get responses
      return knex('responses')
        .join('users', 'responses.id_user', '=', 'users.id')
        .select(responsesUsersKeys)
        .where('responses.id_opportunity', '=', inOppId)
        .debug(false);
    })
    .then( responses => {
      console.log('responses',responses)

      respArr = responses.slice();
      // get opp info
      return knex('opportunities')
        .join('users', 'opportunities.id_user', '=', 'users.id')
        .select(opportunitiesUsersKeys)
        .where('opportunities.id', '=', inOppId)
        .debug(false);
    })
    .then( opportunities => {
      console.log('opportunities',opportunities)

      oppObj = helper.convertCase(opportunities[0], 'snakeToCC');
      console.log('oppObj',oppObj)

      return this.getOrg(oppObj.idUser);
    })
    .then( result => {
      console.log('opp converted case',result)

      opp = Object.assign( {}, oppObj, {
        organization: result,
        causes: causeArr,
        responses: respArr
      });
      console.log('opp with causes and responses',opp)

      return opp;
    });
};

helper.buildResponse = function(inRespId) {
  let response = {};

  const knex = require('../db');
  return knex('responses')
    .join('users', 'responses.id_user', '=', 'users.id')
    .where('responses.id', '=', inRespId)
    .select(responsesUsersKeys)
    .then( result => {
      response = this.convertCase(result[0], 'snakeToCC');
      return this.getTitle(response.idOpportunity)
        .then( title => {
          response = Object.assign( {}, response, {
            title: title
          });
          return response;
        });
    });
};

helper.getOrg = function(idUser) {
  const knex = require('../db');
  return knex('users')
    .select('organization')
    .where('id', '=', idUser)
    .then( result => {
      return (result[0].organization);
    });
};

helper.getTitle = function(oppId) {
  const knex = require('../db');
  return knex('opportunities')
    .select('title')
    .where('id', '=', oppId)
    .then( result => {
      return (result[0].title);
    });
};

helper.buildOppBase = function(inOppObj) {
  console.log('buildOppBase',inOppObj);

  const {id,
    timestampCreated, 
    opportunityType,
    offer, 
    title,
    narrative,
    timestampStart,
    timestampEnd,
    locationCity, 
    locationState,
    locationCountry,
    idUser,
    link
  } = inOppObj;
  const opportunity = {
    id,
    timestampCreated, 
    opportunityType,
    offer, 
    title,
    narrative,
    timestampStart,
    timestampEnd,
    locationCity, 
    locationState,
    locationCountry,
    idUser,
    link
  };
  let retBaseObj = this.convertCase(opportunity, 'ccToSnake');
  console.log('retBaseObj',retBaseObj);

  return retBaseObj;
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

const usersKeys = [
  'id',
  'timestamp_created as timestampCreated',
  'username',
  'user_type as userType',
  'location_city as locationCity',
  'location_state as locationState',
  'location_country as locationCountry',
  'bio',
  'first_name as firstName',
  'last_name as lastName',
  'logo',
  'organization',
  'availability',
];
const usersKeysAppendToOpportunity = [
  // this is a select of table opportunities, but ONLY getting user info to hydrate into opportunity
  'users.username',
  'users.user_type as userType',
  'users.location_city as locationCity',
  'users.location_state as locationState',
  'users.location_country as locationCountry',
  'users.bio',
  'users.first_name as firstName',
  'users.last_name as lastName',
  'users.logo',
  'users.organization',
  'users.availability',
];
const rolesKeys = [
  'roles.id as id',
  'id_user_adding as idUserAdding',
  'id_user_receiving as idUserReceiving',
  'users.first_name as firstName',
  'users.last_name as lastName',
  'users.logo',
  'users.location_city as locationCity',
  'users.location_state as locationState',
  'users.organization',
  'capabilities'
];
const opportunitiesKeys = [
  'id',
  'opportunity_type as opportunityType',
  'offer',
  'title',
  'narrative',
  'timestamp_start as timestampStart',
  'timestamp_end as timestampEnd',
  'location_city as locationCity',
  'location_state as locationState',
  'location_country as locationCountry',
  'link'
];
const opportunitiesUsersKeys = [
  'opportunities.id',
  'id_user as idUser',
  'opportunity_type as opportunityType',
  'offer',
  'title',
  'narrative',
  'timestamp_start as timestampStart',
  'timestamp_end as timestampEnd',
  'users.user_type as userType',
  'users.first_name as firstName',
  'users.last_name as lastName',
  'users.logo',
  'users.organization',
  'users.location_city as userLocationCity',
  'users.location_state as userLocationState',
  'users.location_country as userLocationCountry',
  'opportunities.location_city as locationCity',
  'opportunities.location_state as locationState',
  'opportunities.location_country as locationCountry',
  'link'
];
const responsesUsersKeys = [
  'responses.id as id',
  'id_user as idUser',
  'id_opportunity as idOpportunity',
  'response_status as responseStatus',
  'timestamp_status_change as timestampStatusChange',
  'responses.timestamp_created as timestampCreated',
  'notes',
  'users.first_name as firstName',
  'users.last_name as lastName',
  'users.organization'
];
const responsesOpportunitiesKeys = [
  'responses.id',
  'responses.id_user as idUser',
  'responses.id_opportunity as idOpportunity',
  'notes',
  'response_status as responseStatus',
  'responses.timestamp_status_change as timestampStatusChange',
  'responses.timestamp_created as timestampCreated',
  'opportunities.narrative',
  'opportunities.title',
  'opportunities.offer',
  'opportunities.opportunity_type as opportunityType',
  'opportunities.link',
  'opportunities.location_city as locationCity',
  'opportunities.location_state as locationState',
  'opportunities.location_country as locationCountry',
  'opportunities.timestamp_start as timestampStart',
  'opportunities.timestamp_end as timestampEnd'
];

const snakeToCC = {
  user_type: 'userType',
  location_city: 'locationCity',
  location_state: 'locationState',
  location_country: 'locationCountry',
  first_name: 'firstName',
  last_name: 'lastName',
  opportunity_type: 'opportunityType',
  id_user: 'idUser',
  id_cause: 'idCause',
  id_opportunity: 'idOpportunity',
  id_skill: 'idSkill',
  id_user_adding: 'idUserAdding',
  id_user_receiving: 'idUserReceiving',
  link_type: 'linkType',
  link_url: 'linkUrl',
  response_status: 'responseStatus',
  timestamp_created: 'timestampCreated',
  timestamp_start: 'timestampStart',
  timestamp_end: 'timestampEnd',
  timestamp_status_change: 'timestampStatusChange'
};

const ccToSnake = {
  userType: 'user_type',
  locationCity: 'location_city',
  locationState: 'location_state',
  locationCountry: 'location_country',
  firstName: 'first_name',
  lastName: 'last_name',
  opportunityType: 'opportunity_type',
  idUser: 'id_user',
  idCause: 'id_cause',
  idOpportunity: 'id_opportunity',
  idSkill: 'id_skill',
  idUserAdding: 'id_user_adding',
  idUserReceiving: 'id_user_receiving',
  linkType: 'link_type',
  linkUrl: 'link_url',
  responseStatus: 'response_status',
  timestampCreated: 'timestamp_created',
  timestampStart: 'timestamp_start',
  timestampEnd: 'timestamp_end',
  timestampStatusChange: 'timestamp_status_change'
};

helper.convertCase = function(inputObject, mode) {

  const outputObject = {};
  const conversionTable = mode === 'ccToSnake' ? ccToSnake : snakeToCC;

  Object.keys(inputObject).forEach ( key => {
    if(conversionTable[key]) {
      outputObject[conversionTable[key]] = inputObject[key];
    } else {
      outputObject[key] = inputObject[key];
    }
  });
  return outputObject;
};

module.exports = { helper };