'use strict';

const express = require('express');
const adminRouter = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const { helper } = require('./helper');

process.stdout.write('\x1Bc');

// GET api/admin/initialize
adminRouter.get('/initialize', (req, res) => {
  let resObj = {};
  let causeArray = [];
  let skillArray = [];
  let userArray = [];

  const knex = require('../db');

  // get users
  return helper.buildUsersList()
    .then(usersList => {
      console.log('usersList admin router',usersList[0]);
      userArray = usersList.slice();
    })

    // get causes
    .then( () => {
      return knex('causes')
        .select('cause')
        .orderBy('cause');
    })
    .then( results => {
      results.map( cause => causeArray.push(cause.cause));
    })

    // get skills
    .then( () => {
      return knex('skills')
        .select('skill')
        .orderBy('skill');
    })
    .then( results => {
      results.map( skill => skillArray.push(skill.skill));
    })

    .then( () => {
      resObj = Object.assign( {}, {
        users: userArray,
        causes: causeArray,
        skills: skillArray
      });
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", 0);      
      res.status(201).json(resObj);
    })
    .catch( err => {
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});

module.exports = { adminRouter };