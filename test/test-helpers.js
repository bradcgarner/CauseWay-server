'use strict';

const knex = require('../db');
const { testData } = require('./test-data');
const { testSetup } = require('./test-setup');

let testF = {};

testF.getFocusUser = function() {
  // console.log('running getFocusUser');
  let usrObj = {};
  return knex('test_params')
    .select('focus_user_id', 'focus_user_username')
    .then( results => {
      usrObj = testData.userSeeds.filter( item => item.username === results[0].focus_user_username)[0];
      usrObj = Object.assign( {}, usrObj, ...results, {
        links: [...testData.testUserLinks],
        causes: [...testData.testUserCauses],
        skills: [...testData.testUserSkills]
      });
      return(usrObj);
    });
};

testF.getFocusOrg = function() {
  // console.log('running getFocusOrg');
  let orgObj = {};
  return knex('test_params')
    .select('focus_org_id', 'focus_org_username')
    .then( results => {
      orgObj = testData.userSeeds.filter( item => item.username === results[0].focus_org_username)[0];
      orgObj = Object.assign( {}, orgObj, ...results, {
        links: [...testData.testOrgLinks],
        causes: [...testData.testOrgCauses],
        opps: testData.oppSeeds.filter( item => !item.offer)
      });
      return(orgObj);
    });
};

testF.getTestRole = function(inUsrArr) {
  return {
    idUserAdding: inUsrArr[0].id,
    idUserReceiving: inUsrArr[1].id,
    capabilities: 'following'
  };
};

module.exports = { testF };