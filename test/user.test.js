'use strict';

const path = require('path');
const dotEnvPath = path.resolve('../.env');
require('dotenv').config({path: dotEnvPath});

const { setDbMode } = require('../config');
// set .env DB_MODE to test to point knex instances to test db
setDbMode('test');



const chai = require('chai');
const chaiHttp = require('chai-http');
const { app } = require('../server');
const { testSetup } = require('./test-setup');
const { testData } = require('./test-data');
const { testF } = require('./test-helpers');
const expect = chai.expect;

chai.use(chaiHttp);

describe('user', function() {

  before(function() {
    return (testSetup.buildFullDB());
  });

  after(function() {
    return (testSetup.tearDownDB())
      .then( () => {
      //restore .env DB_MODE to dev
        setDbMode('dev');
      });
  });

  beforeEach(function() {

  });

  afterEach(function() {

  });

  // ***** COMM TEST
  describe('api/users/testify GET comm check', function() {
    it('should demonstrate that comm to the endpoint is working', function() {
      return chai.request(app)
        .get('/api/users/testify')
        .then(function(res) {
          expect(res.status).to.equal(200);
          expect(res.body.message).to.equal('Good to go');
        });
    });
  });

  // // ***** GET USER LIST
  describe('api/users/list GET user list', function() {
    it('should return a list of existing users', function() {
      return chai.request(app)
        .get('/api/users/list')
        .then(function(res) {
          let userNames = testData.userSeeds
            .map( item => item.username );
          expect(res.body.length).to.equal(userNames.length);
          for(let uCtr = 0; uCtr < res.body.length; uCtr++) {
            expect(userNames).to.include(res.body[uCtr].username);
          }
          //expect(res.body[0].username).to.equal('kaisersolze');    // failing test
        });
    });
  });

  // // // ***** GET INDIVIDUAL USER - DETAIL
  // describe('api/users/:id GET user details', function() {
  //   it('should return the users profile info, links, causes, and skills', function() {
  //     let focusUser = {};
  //     return testF.getFocusUser()
  //       .then ( results => {
  //         focusUser = results;
  //         return chai.request(app)
  //           .get(`/api/users/${focusUser.focus_user_id}`);
  //       })
  //       .then( res => {
  //         // test general user info
  //         expect(res.body.username).to.equal(focusUser.username);
  //         // test user links
  //         expect(res.body.links.length).to.equal(testData.testUserLinks.length);
  //         //expect(res.body.links.length).to.equal(99);   // failing test
  //         const expUserLinksArr = testData.testUserLinks.map( item => item.link_url);
  //         for(let lCtr = 0; lCtr < res.body.links.length; lCtr++) {
  //           expect(expUserLinksArr).to.include(res.body.links[lCtr].linkUrl);
  //         }
  //         // test user causes
  //         expect(res.body.causes.length).to.equal(testData.testUserCauses.length);
  //         // expect(res.body.causes.length).to.equal(98);    // failing test
  //         const expUserCausesArr = testData.testUserCauses.map( item => item.cause);
  //         for(let cCtr = 0; cCtr < res.body.causes.length; cCtr++) {
  //           expect(expUserCausesArr).to.include(res.body.causes[cCtr]);
  //         }
  //         // test user skills
  //         expect(res.body.skills.length).to.equal(testData.testUserSkills.length);
  //         // expect(res.body.skills.length).to.equal(97);    // failing test
  //         const expUserSkillsArr = testData.testUserSkills.map( item => item.skill);
  //         for(let sCtr = 0; sCtr < res.body.skills.length; sCtr++) {
  //           expect(expUserSkillsArr).to.include(res.body.skills[sCtr]);
  //         }
  //       });
  //   });
  // });

  // // ***** POST USER
  describe('api/users POST new user', function() {

    it('should reject user with missing username', function() {
      let testUser = Object.assign( {}, testData.testIndividual);
      delete testUser['username'];
      return chai.request(app)
        .post('/api/users/register')
        .send(testUser)
        .then( () => 
          expect.fail(null, null, 'Request should fail')
        )
        .catch( err => {
          if(err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
        });
    });

    it('should reject user with missing passwd', function() {
      let testUser = Object.assign( {}, testData.testIndividual);
      delete testUser['password'];
      return chai.request(app)
        .post('/api/users/register')
        .send(testUser)
        .then( () => 
          expect.fail(null, null, 'Request should fail')
        )
        .catch( err => {
          if(err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
        });
    });

    it('should add individual user to users table as type individual', function() {
      let testUser = Object.assign( {}, testData.testIndividual);
      return chai.request(app)
        .post('/api/users/register')
        .send(testUser)
        .then(function(res) {
          expect(res.body).type.to.be('object');
          expect(res.body.username).to.equal(testData.testIndividual.username);
          return chai.request(app)
            .get(`/api/users/${res.body.id}`)
            .then(function(res) {
              expect(res.body.username).to.equal(testData.testIndividual.username);
              expect(res.body.userType).to.equal('individual');
              expect(res.body.firstName).to.equal(testData.testIndividual.firstName);
              // expect(res.body.first_name).to.equal('notyouraveragefirstname');    // failing test
              expect(res.body.lastName).to.equal(testData.testIndividual.lastName);
            });
        })
        .catch( err => {
          if(err instanceof chai.AssertionError) {
            throw err;
          }
          //console.log(err.response);
        });
    });

    it('should add organization user to users table as type organization', function() {
      let testOrg = Object.assign( {}, testData.testOrganization);
      return chai.request(app)
        .post('/api/users/register')
        .send(testOrg)
        .then(function(res) {
          expect(res.body).type.to.be('object');
          expect(res.body.username).to.equal(testOrg.username);
          return chai.request(app)
            .get(`/api/users/${res.body.id}`)
            .then(function(res) {
              expect(res.body.username).to.equal(testOrg.username);
              expect(res.body.userType).to.equal('organization');
              expect(res.body.organization).to.equal(testOrg.organization);
              // expect(res.body.organization).to.equal('atleastwerenothitler');    // failing test
            });
        })
        .catch( err => {
          if(err instanceof chai.AssertionError) {
            throw err;
          }
          //console.log(err.response);
        });
    });

    it('should reject a duplicate username', function() {
      let testUser = Object.assign( {}, testData.testIndividual);
      return chai.request(app)
        .post('/api/users/register')
        .send(testUser)
        .then( () =>
          expect.fail(null, null, 'Request should fail')
        )
        .catch( err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('Username already taken');
        });
    });

  });

});