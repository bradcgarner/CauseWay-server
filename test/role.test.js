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

describe('role', function() {

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

  // // ***** COMM TEST
  describe('api/roles/testify GET comm check', function() {
    it('should demonstrate that comm to the endpoint is working', function() {
      return chai.request(app)
        .get('/api/roles/testify')
        .then(function(res) {
          expect(res.status).to.equal(200);
          expect(res.body.message).to.equal('Good to go');
        });
    });
  });

  // ***** POST ROLE
  describe('api/roles POST role', function() {
    it('should post a new role', function() {
      let testRolePostObj = {};
      const knex = require('../db');
      return knex('users')
        .select('id')
        .where('user_type', '=', 'individual')
        .then( results => {
          testRolePostObj = testF.getTestRole(results);
          return chai.request(app)
            .post('/api/roles')
            .send(testRolePostObj);
        })
        .then( res => {
          expect(res.body).to.be.an('object');
          return knex('roles')
            .select()
            .where('id', '=', res.body.id)
            .then( result => {
              expect(result[0].id_user_adding).to.equal(testRolePostObj.idUserAdding);
              expect(result[0].id_user_receiving).to.equal(testRolePostObj.idUserReceiving);
              expect(result[0].capabilities).to.equal(testRolePostObj.capabilities);
              // expect(result[0].capabilities).to.equal('extreme sarcasm');   // failing test
            });          
        });
    });
  });

  // ***** PUT ROLE
  describe('api/roles/:id PUT role', function() {
    let testRolePostObj = {};
    let testRolePutObj = {};
    let roleId;
    const knex = require('../db');

    it('should reject an unknown capability', function() {
      return knex('users')
        .select('id')
        .where('user_type', '=', 'individual')
        .then( results => {
          testRolePostObj = testF.getTestRole(results);
          return chai.request(app)
            .post('/api/roles')
            .send(testRolePostObj);
        })
        .then( res => {
          roleId = res.body.id;
          testRolePutObj = Object.assign( {}, testRolePostObj, {
            capabilities: 'sinister genius'
          });
          return chai.request(app)
            .put(`/api/roles/${roleId}`)
            .send(testRolePutObj)
            .then( () => {
              expect.fail(null, null, 'Request should fail')
            })
            .catch( err => {
              if(err instanceof chai.AssertionError) {
                throw err;
              }
              const res = err.response;
              expect(res).to.have.status(422);
              expect(res.body.reason).to.equal('ValidationError');
            });
        });
    });

    it('should update an existing role', function() {
      let toggleCap = {
        admin: 'following',
        following: 'admin'
      };
      testRolePutObj = Object.assign( {}, testRolePostObj, {
        capabilities: toggleCap[testRolePostObj.capabilities]
      });
      return chai.request(app)
        .put(`/api/roles/${roleId}`)
        .send(testRolePutObj)
        .then( res => {
          expect(res.body).to.be.an('object');
          return knex('roles')
            .select()
            .where('id', '=', res.body.id)
            .then( result => {
              expect(result[0].id_user_adding).to.equal(testRolePutObj.idUserAdding);
              expect(result[0].id_user_receiving).to.equal(testRolePutObj.idUserReceiving);
              expect(result[0].capabilities).to.equal(testRolePutObj.capabilities);
              // expect(result[0].capabilities).to.equal('close talker');   // failing test
            });          
        });
    });
  });

  describe('/api/roles/:id DELETE role', function() {
    const knex = require('../db');
    let roleId;
    it('should delete an existing role', function() {
      return knex('users')
        .select('id')
        .where('user_type', '=', 'individual')
        .then( results => {
          const testRolePostObj = testF.getTestRole(results);
          return chai.request(app)
            .post('/api/roles')
            .send(testRolePostObj);
        })
        .then( res => {
        // verify role was added to db
          roleId = res.body.id;
          return knex('roles')
            .select()
            .where('id', '=', roleId)
            .then( result => {
              expect(result.length).to.be.above(0);
              // call delete
              return chai.request(app)
                .delete(`/api/roles/${roleId}`);
            })
            .then( () => {
              // verify role no longer exists in db
              return knex('roles')
                .select()
                .where('id', '=', roleId)
                .then( result => {
                  expect(result.length).to.equal(0);
                });
            });
        });

    });

  });

});