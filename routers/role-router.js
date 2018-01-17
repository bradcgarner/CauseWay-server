'use strict';

const express = require('express');
const passport = require('passport');
const { jwtStrategy } = require('../auth/jwt-strategy');
const roleRouter = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const { helper } = require('./router-helpers');
const { epDbHelp } = require('./router-db-helpers');

process.stdout.write('\x1Bc');

passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });

// comm test
roleRouter.get('/testify/', (req, res) => {
  res.status(200).json({message: 'Good to go'});
});

// new function test
roleRouter.post('/helpertest/', jsonParser, (req, res) => {
  const modObj = epDbHelp.scrubFields(req.body, 'roles');
  res.status(200).json(modObj);  
});

// POST api/roles
roleRouter.post('/', jsonParser, (req, res) => {
  const knex = require('../db');
  let retObj = {};
  let orgName;
  let rolePostObj = epDbHelp.scrubFields(req.body, 'roles');

  // validate capability
  const capabilityOpts = ['admin', 'following', 'delete'];
  if(!(capabilityOpts.includes(req.body.capabilities))) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Error: unrecognized capability spec'
    });
  }

  let orgId = rolePostObj.capabilities === 'admin' ? 
    rolePostObj.id_user_adding : rolePostObj.id_user_receiving;
  return helper.getOrg(orgId)
    .then( org => {
      orgName = org;
      return knex('roles')
        .insert(rolePostObj)
        .returning ([
          'id',
          'id_user_adding as idUserAdding',
          'id_user_receiving as idUserReceiving',
          'capabilities']);
    })
    .then( result => {
      retObj = result[0];
      retObj.organization = orgName;
      res.json(retObj);
    })
    .catch( err => {
      if(err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});

// PUT api/roles/:id
roleRouter.put('/:id', jsonParser, (req, res) => {
  const knex = require('../db');
  const roleId = req.params.id;
  let retObj = {};
  let orgName;
  let rolePutObj = epDbHelp.scrubFields(req.body, 'roles');
  if(rolePutObj.id) { delete rolePutObj.id; }
  console.log(rolePutObj);

  // validate capability
  const capabilityOpts = ['admin', 'following', 'delete'];
  if(!(capabilityOpts.includes(rolePutObj.capabilities))) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Error: unrecognized capability spec'
    });
  }

  let orgId = rolePutObj.capabilities === 'admin' ? 
    rolePutObj.id_user_adding : 
    (rolePutObj.capabilities === 'delete' ?
      rolePutObj.id_user_adding :rolePutObj.id_user_receiving);

  return helper.getOrg(orgId)
    .then( org => {
      orgName = org;
      console.log(orgName);
      return knex('roles')
        .where('id', '=', roleId)
        .update(rolePutObj)
        .returning ([
          'id',
          'id_user_adding as idUserAdding',
          'id_user_receiving as idUserReceiving',
          'capabilities']);
    })
    .then( result => {
      retObj = result[0];
      retObj.organization = orgName;
      res.json(retObj);
    })
    .catch( err => {
      if(err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});

// DELETE api/roles/:id

roleRouter.delete('/:id', (req, res) => {
  const knex = require('../db');
  return knex('roles')
    .where('id', '=', req.params.id)
    .del()
    .then( () => {
      res.status(200).json({message: 'Role deleted'});
    })
    .catch( err => {
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});


module.exports = { roleRouter };