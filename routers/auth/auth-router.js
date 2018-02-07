'use strict';

const express = require('express');
const authRouter = express.Router();
const { helper, convertCase } = require('../helper');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { localStrategy } = require('./local-strategy');
const { jwtStrategy } = require('./jwt-strategy');
const { JWT_SECRET, JWT_EXPIRY } = require('../../config');
const bodyParser = require('body-parser');
authRouter.use(bodyParser.json());

passport.use(localStrategy);
passport.use(jwtStrategy);

const knex = require('../../db');

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

  let idUser, authToken;
  let userBasic = {};
  let user = {};
  const userFromClient = req.body;
  return knex('users')
    .select()
    .where('username', '=',  userFromClient.username)
    .then( userFound => {
      const userForToken = Object.assign( {},
        userFound[0], {
          first_name: userFound[0].first_name,
          last_name: userFound[0].last_name,
          user_type: userFound[0].user_type
        });      
      authToken = createAuthToken(userForToken);
      idUser = userFound[0].id;

      return helper.buildUser(idUser)
        .then(userBuilt => {
          userBasic = convertCase(userBuilt, 'snakeToCC');
          return (helper.getExtUserInfo(idUser));
        })
        .then( userExtended => {
          user = Object.assign( {}, userBasic, userExtended, {authToken: authToken} );
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', 0);  
          res.status(201).json(user);
        })
        .catch( err => {
          res.status(500).json({message: `Internal server error ${err}`});
        });
    });
});

// refresh
authRouter.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

module.exports = { authRouter, createAuthToken };