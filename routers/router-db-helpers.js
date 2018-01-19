'use strict';
// I think this entire file is redundant

let epDbHelp = {};

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

epDbHelp.convertCase = function(caseObj, mode) {

  let convTbl = {};

  if(mode === 'ccToSnake') {
    convTbl = ccToSnake;
  }
  else {
    convTbl = snakeToCC;
  }

  Object.keys(caseObj).forEach ( key => {
    if(convTbl[key]) {
      caseObj = Object.assign( {}, caseObj, {
        [convTbl[key]]: caseObj[key]
      });
      delete caseObj[key];
    }
  });

  return caseObj;

};

const expFields = {
  roles: {
    capabilities: null,
    id: null,
    id_user_adding: 'idUserAdding',
    idUserAdding: 'id_user_adding',
    id_user_receiving: 'idUserReceiving',
    idUserReceiving: 'id_user_receiving',
    organization: null
  }
};

epDbHelp.scrubFields = function(inObj, reqTy) {
  const fieldsTbl = expFields[reqTy];
  for (const field in inObj) {

    if(!(field in fieldsTbl)) {
      delete inObj[field];
    }

    if(fieldsTbl[field]) {
      inObj[fieldsTbl[field]] = inObj[field];
      delete inObj[field];
    }

  }
  return inObj;
};

module.exports = { epDbHelp };