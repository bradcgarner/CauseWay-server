'use strict';

const express = require('express');
const authRouter = express.Router();
const { helper } = require('../routers/router-helpers');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { localStrategy } = require('./local-strategy');
const { jwtStrategy } = require('./jwt-strategy');
const { JWT_SECRET, JWT_EXPIRY } = require('../config');
const bodyParser = require('body-parser');
authRouter.use(bodyParser.json());

passport.use(localStrategy);
passport.use(jwtStrategy);

const knex = require('../db');

const createAuthToken = function (user){
  return jwt.sign({user}, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY,
    algorithm: 'HS256'
  });
};

const localAuth = passport.authenticate('local', { session: false });
const jwtAuth = passport.authenticate('jwt', { session: false });

// login
authRouter.post('/login', localAuth, (req, res) => {

  let usrId;
  let respObj = {};
  
  let user = req.body;
  return knex('users')
    .select()
    .where('username', '=',  user.username)
    .then( result => {
      user = Object.assign( {}, user, {
        first_name: result[0].first_name,
        last_name: result[0].last_name,
        user_type: result[0].user_type
      });
      const authToken = createAuthToken(user);
      usrId = result[0].id;
      return helper.buildUser(usrId)
        .then(result => {
          respObj = helper.convertCase(result, 'snakeToCC');
          return (helper.getExtUserInfo(usrId));
        })
        .then( resultObj => {
          respObj = Object.assign( {}, respObj, resultObj, {
            authToken: authToken
          });
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', 0);  
          res.status(201).json(respObj);
        })
        .catch( err => {
          res.status(500).json({message: 'Internal server error'});
        });
    });
});

// refresh
authRouter.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

module.exports = { authRouter, createAuthToken };