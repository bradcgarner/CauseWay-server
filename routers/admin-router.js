'use strict';

const express = require('express');
const adminRouter = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const { helper, rawSqlFromQuery } = require('./helper');
const { oppsListSelectStatement } = require('./helper-sql');

process.stdout.write('\x1Bc');

// GET api/admin/initialize
adminRouter.get('/initialize', (req, res) => {
  const knex = require('../db');
  let causeArray = [];
  let skillArray = [];
  let userArray = [];
  let oppsArray = [];

  // get users
  return helper.buildUsersList()
    .then(usersList => {
      // console.log('usersList admin router',usersList[0]);
      userArray = usersList.slice();
    })

    // get causes
    .then( () => {
      return knex('causes')
        .select('cause')
        .orderBy('cause');
    })
    .then( causesFound => {
      causeArray = causesFound.map(cause => cause.cause);
    })

    // get skills
    .then( () => {
      return knex('skills')
        .select('skill')
        .orderBy('skill');
    })
    .then( skillsFound => {
      skillArray = skillsFound.map(skill => skill.skill);
    })

    // get opps
    .then(() => {
      const table = 'opportunities';
      const selectStatement = oppsListSelectStatement();
      const rawSql = rawSqlFromQuery({}, table, selectStatement);
      return helper.buildOppsList(rawSql);
    })
    .then( oppsFound => {
      oppsArray = oppsFound.slice();
    })

    .then( () => {
      const response = Object.assign( {}, {
        users: userArray,
        causes: causeArray,
        skills: skillArray,
        opportunities: oppsArray,
      });
      console.log('response', response);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", 0);      
      res.status(201).json(response);
    })
    .catch( err => {
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});

module.exports = { adminRouter };