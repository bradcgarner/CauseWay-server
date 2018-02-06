'use strict';

const express = require('express');
const passport = require('passport');
const { jwtStrategy } = require('../auth/jwt-strategy');
const oppRouter = express.Router();
const { helper } = require('./router-helpers');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

process.stdout.write('\x1Bc');

passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });

//GET api/opportunities/
oppRouter.get('/', (req, res) => {
  // check for query parameters
  let queryObject = {};
  if(Object.keys(req.query).length > 0) {
    queryObject = req.query;
  }
  return helper.buildOppList(queryObject)
    .then( oppList => {
      res.json(oppList);
    })
    .catch( err => {
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});

//GET api/opportunities/:id
oppRouter.get('/:id', (req, res) => {
  
  return helper.buildOpp(req.params.id)
    .then( results => {
      res.json(results);
    })
    .catch( err => {
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});

// POST api/opportunities
oppRouter.post('/', jsonParser, (req, res) => {
  let oppId;
  let inOppObj = req.body;
  let retObj = {};
  let inCausesArr = (inOppObj.causes.length > 0) ? inOppObj.causes.slice() : [] ;
  console.log('oppRouter',inOppObj,inCausesArr);
  // check for missing fields
  const reqFields = ['title', 'narrative', 'idUser', 'causes'];
  const missingField = reqFields.find( field => !(field in inOppObj));
  if(missingField) {
    console.log('missingField',missingField);

    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }
  // post base opportunity info - get id'
  const postOppObj = helper.buildOppBase(inOppObj);
  console.log('postOppObj to insert',postOppObj);
  const knex = require('../db');

  return knex('opportunities')
    .insert(postOppObj)
    .returning(['id'])
    .then( result => {
      console.log('after inserting',result);

      oppId = result[0].id;
      console.log('oppId',oppId);

      if(inCausesArr.length > 0) {
        console.log('inCausesArr',inCausesArr);

        return helper.buildOppCausesArr(oppId, inCausesArr)

          .then( postCausesArr => {
            console.log('postCausesArr',postCausesArr);
            return knex('opportunities_causes')
              .insert(postCausesArr);
          });
      }
      else {
        // no causes in req, skip to response
        console.log('no causes');

        return;
      }
    })
    .then( () => {
      console.log('ready to build opp');

      return helper.buildOpp(oppId)
        .then( result => {
          console.log('built opp',result);

          retObj = Object.assign( {}, result);
          res.status(201).json(retObj);      
        })
        .catch( err => {
          console.log('err',err);

          if(err.reason === 'ValidationError') {
            console.log('ValidationError');

            return res.status(err.code).json(err);
          }
          res.status(500).json({message: `Internal server error: ${err}`});
        });
    });
});


// PUT api/opportunities/:id
oppRouter.put('/:id', jsonParser, (req, res) => {
  let inOppObj = req.body;
  if(inOppObj.id) { delete inOppObj.id; } 
  let oppId = req.params.id;
  let retObj = {};
  let inCausesArr = inOppObj.causes.slice();

  // check for missing fields
  const reqFields = ['title', 'narrative', 'idUser', 'causes'];
  const missingField = reqFields.find( field => !(field in inOppObj));
  if(missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }

  // update base opportunity info'
  const postOppObj = helper.buildOppBase(inOppObj);
  const knex = require('../db');

  return knex('opportunities')
    .where('id', '=', oppId)
    .update(postOppObj)
    .returning(['id', 'opportunity_type as opportunityType', 'narrative', 'location_city', 'location_state'])

    .then( results => {
      return knex('opportunities_causes')
        .where('id_opportunity', '=', oppId)
        .del()
        .then( () => {
          if(inCausesArr.length > 0) {
            return helper.buildOppCausesArr(oppId, inCausesArr)
              .then( postCausesArr => {
                return knex('opportunities_causes')
                  .insert(postCausesArr);
              });
          }
          else {
            // no causes in req, skip to response
            return;
          }
        })
        .then( () => {
          return helper.buildOpp(oppId)
            .then( result => {
              retObj = Object.assign( {}, result);
              res.status(201).json(retObj);      
            })
            .catch( err => {
              if(err.reason === 'ValidationError') {
                return res.status(err.code).json(err);
              }
              res.status(500).json({message: `Internal server error: ${err}`});
            });
        });
    });
});


module.exports = { oppRouter };
