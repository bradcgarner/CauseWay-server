'use strict';

const express = require('express');
const passport = require('passport');
const { jwtStrategy } = require('./auth/jwt-strategy');
const roleRouter = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const { helper, convertCase } = require('./helper');
const { keys } = require('./helper-keys');

process.stdout.write('\x1Bc');

passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });

// POST api/roles
roleRouter.post('/', jsonParser, (req, res) => {
  console.log(req.body);
  const knex = require('../db');
  let role = {};
  let roleToInsert = convertCase(req.body, 'ccToSnake', 'rolesKeysRawInsert');
  console.log('roleToInsert',roleToInsert);

  // validate capability
  const capabilityOpts = ['admin', 'following', 'delete'];
  if(!(capabilityOpts.includes(req.body.capabilities))) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Error: unrecognized capability spec'
    });
  }

  let idUser = roleToInsert.capabilities === 'admin' ? 
    roleToInsert.id_user_adding : roleToInsert.id_user_receiving;
  console.log('idUser', idUser);

  return knex('roles')
    .insert(roleToInsert)
    .returning (keys.rolesKeysReturning)
    .then( roleInserted => {
      role = roleInserted[0];
    })  
    .then(()=> {
      return helper.getOneRecord('users', 'id', idUser , 'organization')       
      // return helper.getOrgName(idUser)
    })
    .then( userFound => {
      role.organization = userFound.organization;
      res.json(role);  
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
  const idRole = req.params.id;
  let role = {};
  let roleToUpdate = convertCase(req.body, 'ccToSnake', 'rolesKeysRawInsert');
  console.log(roleToUpdate);

  // validate capability
  const capabilityOpts = ['admin', 'following', 'delete'];
  if(!(capabilityOpts.includes(roleToUpdate.capabilities))) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Error: unrecognized capability spec'
    });
  }

  let idUser = roleToUpdate.capabilities === 'admin' ? roleToUpdate.id_user_adding : 
    roleToUpdate.capabilities === 'delete' ? roleToUpdate.id_user_adding :
      roleToUpdate.id_user_receiving;
  return knex('roles')
    .where('id', '=', idRole)
    .update(roleToUpdate)
    .returning (keys.rolesKeysReturning)
    .then( roleUpdated => {
      role = roleUpdated[0];
      return helper.getOneRecord('users', 'id', idUser , 'organization')
      // return helper.getOrgName(idUser)
    })
    .then( userFound => {
      role.organization = userFound.organization;
      res.json(role);
    })
    .catch( err => {
      if(err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});

// DELETE api/roles/:id

// roleRouter.delete('/:id', (req, res) => {
//   const knex = require('../db');
//   return knex('roles')
//     .where('id', '=', req.params.id)
//     .del()
//     .then( () => {
//       res.status(200).json({message: 'Role deleted'});
//     })
//     .catch( err => {
//       res.status(500).json({message: `Internal server error: ${err}`});
//     });
// });


module.exports = { roleRouter };