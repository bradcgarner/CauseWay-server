'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const { validatePassword } = require('./bcrypt');
const { Strategy: LocalStrategy } = require('passport-local');

const knex = require('../db');

const localStrategy = new LocalStrategy((username, password, done) => {

  let user = {};
  return knex('users')
    .select()
    .where('username', '=', username)
    .then( results => {
      if(!results) {
        return Promise.reject({
          reason: 'LoginError',
          message: 'Unrecognized username'    // change this when done testing
        });
      }
      user = results[0];
      return validatePassword(password, user.password);
    })
    .then( isValid => {
      if(!isValid) {
        return Promise.reject({
          reason: 'LoginError',
          message: 'Incorrect password',    // change this when done testing
        });
      }
      return done(null, user);
    })
    .catch(err => {
      if(err.reason === 'LoginError') {
        return done(null, false);
      }
      return done(err);
    });
});

module.exports = { localStrategy };