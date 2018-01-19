'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const { validatePassword } = require('./bcrypt');
const { Strategy: LocalStrategy } = require('passport-local');

const knex = require('../db');

const localStrategy = new LocalStrategy((username, password, done) => {
  console.log('in localstrategy', username, password, done);
  let user = {};
  return knex('users')
    .select()
    .where('username', '=', username)
    .then( results => {
      console.log('user found in local strategy', results);
      if(!results) {
        console.log('no results');
        return Promise.reject({
          reason: 'LoginError',
          message: 'Unrecognized username'    // change this when done testing
        });
      }
      user = results[0];
      console.log('password, user.password', password, user.password);

      return validatePassword(password, user.password);
    })
    .then( isValid => {
      console.log('isValid password', isValid);

      if(!isValid) {
        console.log('not valid', isValid);

        return Promise.reject({
          reason: 'LoginError',
          message: 'Incorrect password',    // change this when done testing
        });
      }
      console.log('user to return', user);

      return done(null, user);
    })
    .catch(err => {
      console.log('err', err);

      if(err.reason === 'LoginError') {
        return done(null, false);
      }
      return done(err);
    });
});

module.exports = { localStrategy };