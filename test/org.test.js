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

describe('organization', function() {

  before(function() {
    return (testSetup.buildFullDB());
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
  describe('api/orgs/testify GET comm check', function() {
    it('should demonstrate that comm to the endpoint is working', function() {
      return chai.request(app)
        .get('/api/orgs/testify')
        .then(function(res) {
          expect(res.status).to.equal(200);
          expect(res.body.message).to.equal('Good to go');
        });
    });
  });

  // ***** GET ORG LIST
  describe('api/orgs/list GET org list', function() {
    it('should return a list of existing orgs', function() {
      return chai.request(app)
        .get('/api/orgs/list')
        .then(function(res) {
          let orgNames = testData.userSeeds
            .filter(item => item.user_type === 'organization')
            .map( item => item.username );
          expect(res.body.length).to.equal(orgNames.length);
          for(let oCtr = 0; oCtr < res.body.length; oCtr++) {
            expect(orgNames).to.include(res.body[oCtr].username);
          }
          // expect(res.body[0].username).to.equal('fSociety');    // failing test
        });
    });
  });

  // ***** GET ORGANIZATION USER - DETAIL
  describe('api/orgs/:id GET org details', function() {
    it('should return the organizations profile info, links, causes, and opportunities', function() {
      let focusOrg = {};
      return testF.getFocusOrg()
        .then ( results => {
          focusOrg = results;
          return chai.request(app)
            .get(`/api/orgs/${focusOrg.focus_org_id}`);
        })
        .then( res => {
          // test general org info
          expect(res.body.username).to.equal(focusOrg.username);
          // test org links
          expect(res.body.links.length).to.equal(testData.testOrgLinks.length);
          //expect(res.body.links.length).to.equal(99);   // failing test
          const expOrgLinksArr = testData.testOrgLinks.map( item => item.link_url);
          for(let lCtr = 0; lCtr < res.body.links.length; lCtr++) {
            expect(expOrgLinksArr).to.include(res.body.links[lCtr].linkUrl);
          }
          // test org causes
          expect(res.body.causes.length).to.equal(testData.testOrgCauses.length);
          // expect(res.body.causes.length).to.equal(98);    // failing test
          const expOrgCausesArr = testData.testOrgCauses.map( item => item.cause);
          for(let cCtr = 0; cCtr < res.body.causes.length; cCtr++) {
            expect(expOrgCausesArr).to.include(res.body.causes[cCtr].cause);
          }
          // test org opportunities
          expect(res.body.opps.length).to.equal(testData.oppSeeds.filter( item => !item.offer).length);
          // expect(res.body.skills.length).to.equal(97);    // failing test
          const expOppsArr = testData.oppSeeds.map( item => item.narrative);
          for(let oCtr = 0; oCtr < res.body.opps.length; oCtr++) {
            expect(expOppsArr).to.include(res.body.opps[oCtr].narrative);
          }
        });
    });
  });

});

