'use strict';

const express = require('express');
const passport = require('passport');
const { jwtStrategy } = require('../auth/jwt-strategy');
const responseRouter = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const { helper } = require('./router-helpers');

process.stdout.write('\x1Bc');

passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });

// comm test
responseRouter.get('/testify/', (req, res) => {
  res.status(200).json({message: 'Good to go'});
});

// POST api/responses
responseRouter.post('/', jsonParser, (req, res) => {
  const knex = require('../db');
  let respPostObj = {};

  // check for required fields
  const reqFields = ['idUser', 'idOpportunity'];
  const missingField = reqFields.filter( field => !(field in req.body));
  if(missingField.length > 0) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Error: opportunity and user id required'
    });
  }
  respPostObj = helper.convertCase(req.body, 'ccToSnake');
  return knex('responses')
    .insert(respPostObj)
    .returning ('id')
    .then( rId => {
      return (helper.buildResponse( rId[0] ))
        .then ( result => {
          res.json(result);
        });
    })
    .catch( err => {
      if(err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});

// PUT api/responses/:id
responseRouter.put('/:id', jsonParser, (req, res) => {
  const respId = req.params.id;
  const knex = require('../db');
  let respPutObj = {};

  // check for required fields
  const reqFields = ['idUser', 'idOpportunity', 'notes'];
  const missingField = reqFields.filter( field => !(field in req.body));
  if(missingField.length > 0) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Error: opportunity, user id and notes required'
    });
  }
  respPutObj = helper.convertCase(req.body, 'ccToSnake');
  if(respPutObj.id) { delete respPutObj.id; }
  respPutObj = Object.assign( {}, respPutObj, {
    timestamp_status_change: new Date()
  });
  return knex('responses')
    .update(respPutObj)
    .where('id', '=', respId)
    .then( () => {
      return (helper.buildResponse( respId ))
        .then ( result => {
          delete result.timestampStatusChange;
          delete result.timestampCreated;
          delete result.firstName;
          delete result.lastName;
          delete result.title;
          delete result.organization;
          res.json(result);
        });
    })
    .catch( err => {
      if(err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});

// DELETE api/roles/:id
responseRouter.delete('/:id', (req, res) => {
  const knex = require('../db');
  return knex('responses')
    .where('id', '=', req.params.id)
    .del()
    .then( () => {
      res.status(200).json({message: 'Response deleted'});
    })
    .catch( err => {
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});


module.exports = { responseRouter };