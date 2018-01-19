'use strict';

const express = require('express');
const passport = require('passport');
const { jwtStrategy } = require('../auth/jwt-strategy');
const causeRouter = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

process.stdout.write('\x1Bc');

passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });

// raw test
causeRouter.get('/raw', (req, res) => {
  console.log(Object.keys(req.query).length !== 0);

  let rawSQL = "SELECT id FROM opportunities WHERE title LIKE '%" + req.query.title + "%'";
  console.log(rawSQL);
  const knex = require('../db');
  return knex
    .raw(rawSQL)
    .then( results => {
      res.json(results.rows);
    })
    .catch( err => {
      res.status(500).json({message: `Internal server error: ${err}`});
    });   
});

// GET api/causes/list
causeRouter.get('/list', (req, res) => {
  const knex = require('../db');
  return knex
    .select('cause')
    .from ('causes')
    .orderBy('cause')
    .debug(false)
    .then( results => {
      res.json(results);
    })
    .catch( err => {
      res.status(500).json({message: `Internal server error: ${err}`});
    });    
});

// GET api/causes/oppslist


module.exports = { causeRouter };