'use strict';

const express = require('express');
const passport = require('passport');
const { jwtStrategy } = require('./auth/jwt-strategy');
const oppRouter = express.Router();
const { helper, convertCase , pushPrimitiveRepsIntoArray, pushNestedKeysIntoArray, rawFromQuery } = require('./helper');
const { oppsListSelectStatement } = require('./helper-sql');
const { keys } = require('./helper-keys');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

process.stdout.write('\x1Bc');

passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });

//GET api/opportunities/
oppRouter.get('/', (req, res) => {
  const queryObject = Object.keys(req.query).length > 0 ? req.query : {} ;
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
      console.log('oppsListUsers',oppsListUsers);
  
      return oppsListUsers.sort((a,b)=>{ // sort is not immutable
        return a.timestamp_start < b.timestamp_start ? -1 :
          a.timestamp_start > b.timestamp_start ? 1 : 0;
      });      
    })
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
  const knex = require('../db');
  let oppFromClient = req.body;
  let causesArrayFromClient = !Array.isArray(oppFromClient.causes) ? oppFromClient.causes : [] ;
  // console.log('oppFromClient',oppFromClient,causesArrayFromClient);
  const reqFields = ['title', 'narrative', 'idUser', 'causes', 'timestampStart', 'timestampEnd'];
  const missingField = reqFields.find( field => !(field in oppFromClient));
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
  const oppFormatted = convertCase(oppFromClient, 'ccToSnake', 'opportunitiesKeysRawInsert');
  console.log('oppFormatted to insert', oppFormatted);

  return knex('opportunities')
    .insert(oppFormatted)
    .returning(['id'])
    .then( idReturned => {
      res.status(200).json({id: idReturned[0].id} );      
    })
    .catch( err => {
      if(err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});


// PUT api/opportunities/:id
oppRouter.put('/:id', jsonParser, (req, res) => {
  const knex = require('../db');
  let oppFromClient = req.body;
  if(oppFromClient.id) { delete oppFromClient.id; } 
  let oppId = req.params.id;
  let retObj = {};
  let causesArrayFromClient = oppFromClient.causes.slice();

  // check for missing fields
  const reqFields = ['title', 'narrative', 'idUser', 'causes'];
  const missingField = reqFields.find( field => !(field in oppFromClient));
  if(missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }

  const oppFormatted = helper.convertCase(oppFromClient, 'ccToSnake', 'opportunitiesKeysRawInsert');

  return knex('opportunities')
    .where('id', '=', oppId)
    .update(oppFormatted)
    .returning(['id', 'opportunity_type as opportunityType', 'narrative', 'location_city', 'location_state'])

    .then( results => {
      return knex('opportunities_causes')
        .where('id_opportunity', '=', oppId)
        .del()
        .then( () => {
          if(causesArrayFromClient.length > 0) {
            return helper.buildOppCausesArr(oppId, causesArrayFromClient)
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
