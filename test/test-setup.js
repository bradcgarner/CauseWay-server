'use strict';

const knex = require('../db');
const { testData } = require('./test-data');

let testSetup = {};

testSetup.seedLinksTable = function( usrID, orgID ) {
  // console.log('running seedLinksTable');
  // create array for link objects that will be imported
  let linksArr = [];
  // add individual link seeds
  testData.testUserLinks.map( item => {
    linksArr.push({
      link_type: item.link_type,
      link_url: item.link_url,
      id_user: usrID
    });
  });
  // add org link seeds
  testData.testOrgLinks.map( item => {
    linksArr.push({
      link_type: item.link_type,
      link_url: item.link_url,
      id_user: orgID
    });
  });
  // insert array of link objects into links table
  return knex('links')
    .insert(linksArr);
};

testSetup.seedOppsTable = function(orgID, usrID) {
  // console.log('running seedOppsTable');
  let tempOppsArr = [];
  let tempObj = {};
  testData.oppSeeds.map( item => {
    if(item.offer){
      tempObj = Object.assign( {}, item, {id_user: usrID});
    }
    else {
      tempObj = Object.assign( {}, item, {id_user: orgID});
    }
    tempOppsArr.push(tempObj);
  });
  return knex('opportunities')
    .insert(tempOppsArr);
};

testSetup.seedUsersCausesTable = function(usrID) {
  // console.log('running seedUsersCauses');
  testData.testUserCauses.map( item => {
    return knex('causes')
      .select('id')
      .where({cause: item.cause})
      .then( result => {
        return knex('users_causes')
          .insert({
            id_user: usrID,
            id_cause: result[0].id
          });
      });
  });
};

testSetup.seedOrgCausesTable = function(orgID) {
  // console.log('running seedOrgCauses');
  testData.testOrgCauses.map( item => {
    return knex('causes')
      .select('id')
      .where({cause: item.cause})
      .then( result => {
        return knex('users_causes')
          .insert({
            id_user: orgID,
            id_cause: result[0].id
          });
      });
  });
};

testSetup.seedUsersSkillsTable = function(usrID) {
  // console.log('running seedUsersSkills');
  return testData.testUserSkills.map( item => {
    return knex('skills')
      .select('id')
      .where({skill: item.skill})
      .then( result => {
        return knex('users_skills')
          .insert({
            id_user: usrID,
            id_skill: result[0].id
          });
      });
  });
};

// ***** BUILD DB *****
testSetup.buildFullDB = function() {
  // console.log('running buildFullDB');
  // focus user and org will have links to other tables for tests of foreign key linked data
  let focusUserID;
  let focusOrgID;
  return (testData.seedUsersTable())
    .then( () => {
      // select individual and org for focus
      return (testSetup.setTestParams());
    })
    .then( results => {
      focusUserID = results[0].focus_user_id;
      focusOrgID = results[0].focus_org_id;
      return(testSetup.seedOppsTable(focusOrgID, focusUserID));
    })
    .then( () => {
      return (testSetup.seedLinksTable(focusUserID, focusOrgID));
    })
    .then( () => {
      return (testData.seedCausesTable());
    })
    .then( () => {
      return (testSetup.seedUsersCausesTable(focusUserID));
    })
    .then( () => {
      return (testSetup.seedOrgCausesTable(focusOrgID));
    })
    .then( () => {
      return (testData.seedSkillsTable());
    })
    .then( () => {
      return (testSetup.seedUsersSkillsTable(focusUserID));
    });

};

// ***** TEAR DOWN DB *****
testSetup.tearDownDB = function() {
  // console.log('running tearDownDB');
  return knex('links')
    .del()
    .then( () => {
      return knex('users_causes')
        .del();
    })
    .then( () => {
      return knex('users_skills')
        .del();
    })
    .then( () => {
      return knex('causes')
        .del();
    })
    .then( () => {
      return knex('skills')
        .del();
    })
    .then( () => {
      return knex('opportunities')
        .del();
    })
    .then( () => {
      return knex('users')
        .del();
    });
};

testSetup.setTestParams = function() {
  // console.log('running setTestParams');
  const userArr = [];
  const orgArr = [];
  return knex('users')
    .select('id', 'user_type', 'username')
    .orderBy('user_type')
    .then( results => {
      // create arrays of users and orgs
      results.map( item => item.user_type === 'individual' ? 
        userArr.push({id: item.id, username: item.username}) : 
        orgArr.push({id: item.id, username: item.username}));
      // randomly select one user and one org for testing focus
      const usrIdx = Math.floor(Math.random()*userArr.length);
      const orgIdx = Math.floor(Math.random()*orgArr.length);
      // test_param table is not broken down and rebuilt
      // it should only ever have one row of data
      // clear old data and insert new
      return knex('test_params')
        .del()
        .then( () => {
          const tpObj = {};
          return knex('test_params')
            .returning(['focus_user_id', 'focus_user_username', 
              'focus_org_id', 'focus_org_username'])
            .insert({
              focus_user_id: userArr[usrIdx].id,
              focus_user_username: userArr[usrIdx].username,
              focus_org_id: orgArr[orgIdx].id,
              focus_org_username: orgArr[orgIdx].username,
            });
        });
    });
};

module.exports = { testSetup };