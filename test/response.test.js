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

describe('response', function() {

  before(function() {
    return (testSetup.tearDownDB())
      .then( () => {
        return (testSetup.buildFullDB());
      });
  });

  after(function() {
    //setDbMode('dev');
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
  describe('api/responses/testify GET comm check', function() {
    it('should demonstrate that comm to the endpoint is working', function() {
      return chai.request(app)
        .get('/api/responses/testify')
        .then(function(res) {
          expect(res.status).to.equal(200);
          expect(res.body.message).to.equal('Good to go');
        });
    });
  });

  // ***** GET RESPONSE LIST
  // describe('api/responses/list GET opportunities list', function() {
  //   it('should return a list of opportunities', function() {
  //     return chai.request(app)
  //       .get('/api/opportunities/list')
  //       .then(function(res) {
  //         let oppStrings = testData.oppSeeds.map( item => item.narrative );
  //         expect(res.body).to.be.an('array');
  //         expect(res.body.length).to.equal(oppStrings.length);
  //         for(let oCtr = 0; oCtr < res.body.length; oCtr += 1) {
  //           expect(oppStrings).to.include(res.body[oCtr].narrative);
  //         }
  //         // expect(res.body[0].narrative).to.equal('out, out, damned spot!');    // failing test
  //       });
  //   });
  // });

  // ***** POST A NEW RESPONSIBILITY
  // describe('api/responses POST new response', function() {
  //   let testOpp = testData.testOrgOpp;

  //   it('should reject a post with missing userId', function() {
  //     return testF.getFocusOrg()
  //       .then( result => {
  //         testOpp = Object.assign( {}, testOpp, {
  //           userId: result.focus_org_id
  //         });
  //         let failedTestOpp = Object.assign( {}, testOpp);
  //         delete failedTestOpp.userId;
  //         return chai.request(app)
  //           .post('/api/opportunities')
  //           .send(failedTestOpp)
  //           .then( () =>
  //             expect.fail(null, null, 'Request should fail')
  //           )
  //           .catch( err => {
  //             if(err instanceof chai.AssertionError) {
  //               throw err;
  //             }
  //             const res = err.response;
  //             // expect(res.body.reason).to.equal('ValidationError');
  //             // expect(res.body.location).to.equal('userId');
  //           });
  //       });
  //   });

  //   it('should reject a post with missing title', function() {
  //     let failedTestOpp = Object.assign( {}, testOpp);
  //     delete failedTestOpp.title;
  //     return chai.request(app)
  //       .post('/api/opportunities')
  //       .send(failedTestOpp)
  //       .then( () =>
  //         expect.fail(null, null, 'Request should fail')
  //       )
  //       .catch( err => {
  //         if(err instanceof chai.AssertionError) {
  //           throw err;
  //         }
  //         const res = err.response;
  //         // expect(res.body.reason).to.equal('ValidationError');
  //         // expect(res.body.location).to.equal('title');
  //       });
  //   });

  //   it('should add an response', function() {
  //     return chai.request(app)
  //       .post('/api/opportunities')
  //       .send(testOpp)
  //       .then( res => {
  //         expect(res).to.have.status(201);
  //         const knex = require('../db');
  //         return knex('opportunities')
  //           .select()
  //           .where({id: res.body.id});
  //       })
  //       .then( results => {
  //         expect(results.length).to.equal(1);
  //         expect(results[0].id_user).to.equal(testOpp.userId);
  //         expect(results[0].offer).to.equal(false);
  //         expect(results[0].title).to.equal(testOpp.title);
  //         expect(results[0].narrative).to.equal(testOpp.narrative);
  //       });
  //   });
  // });

});