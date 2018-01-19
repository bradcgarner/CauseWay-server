'use strict';

const express = require('express');
const passport = require('passport');
const { jwtStrategy } = require('../auth/jwt-strategy');
const userRouter = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const { hashPassword } = require('../auth/bcrypt');
const { helper } = require('./router-helpers');

process.stdout.write('\x1Bc');

passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });

// GET api/users/list
userRouter.get('/list', (req, res) => {
  return helper.buildListOfUsers()
    .then(results => {
      const userArr = results.slice();
      res.json(userArr);
    })
    .catch( err => {
      res.status(500).json({message: `Internal server error: ${err}`});
    });    
});

// GET api/users/:id
userRouter.get('/:id', (req, res) => {
  const userId = req.params.id;
  let respObj = {};
  let extAdminOf = [];
  
  return helper.buildUser(userId)
    .then( result => {
      respObj = helper.convertCase(result, 'snakeToCC');
      return (helper.getExtUserInfo(userId));
    })
    .then( resultObj => {
      respObj = Object.assign( {}, respObj, resultObj);
      res.json(respObj);
    })
    .catch( err => {
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});

// POST api/users/register
userRouter.post('/register', jsonParser, (req, res) => {
  const knex = require('../db');
  const reqFields = ['username', 'password', 'userType'];
  const missingField = reqFields.filter( field => !(field in req.body));

  // check for missing username or passwd
  if(missingField.length > 0) {
    console.log('missingField',missingField);
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Error: username, password, and user type are required'
    });
  }

  // check for dup username
  let inUsrObj = Object.assign( {}, req.body);
  console.log('body', inUsrObj);
  return knex('users')
    .select()
    .where({username: inUsrObj.username})
    .then( results => {
      if(results.length > 0) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
        });
      }
    })    
    
    // no dup, insert new user
    .then( () => {
      return hashPassword(inUsrObj.password);
    })
    .then( result => {
      // build db insert obj
      let convInUsrObj = helper.convertCase(inUsrObj, 'ccToSnake');
      console.log('convInUsrObj',convInUsrObj)
      if(convInUsrObj.user_type === 'organization') {
        convInUsrObj = Object.assign( {}, convInUsrObj, {
          password: result,
          first_name: null,
          last_name: null
        });
      }
      else {
        convInUsrObj = Object.assign( {}, convInUsrObj, {
          password: result,
          organization: null,
        });
      }
      // insert user
      return knex('users')
        .insert(convInUsrObj)
        .returning(['id', 'username', 'user_type', 'first_name', 'last_name', 'organization'])
        .then( results => {
          const resObj = helper.convertCase(results[0], 'snakeToCC');
          res.status(201).json(resObj);
        });
    })
    .catch( err => {
      if(err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});

// PUT api/users/:id
userRouter.put('/:id', jsonParser, (req, res) => {
  const userId = req.params.id;
  const knex = require('../db');
  let inUsrObj = Object.assign( {}, req.body);
  if(inUsrObj.id) { delete inUsrObj.id; }
  let convInUsrObj = {};
  let linksArr = req.body.links.length > 0 ? req.body.links.slice() : [] ;
  let linkPostArr = [];
  let causesArr = req.body.causes.length > 0 ? req.body.causes.slice() : [] ;
  let causePostArr = [];
  let skillsArr = req.body.skills.length > 0 ? req.body.skills.slice() : [] ;
  let skillPostArr = [];


  // verify id
  return knex('users')
    .select()
    .where('id', '=', userId)
    .then( results => {
      if(!results) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'User id not found.',
        });
      }
    })    
    
    // user exists, update info
    .then( () => {
      // get hashed pw
      convInUsrObj = helper.convertCase(inUsrObj, 'ccToSnake');
      if(convInUsrObj.password) {
        return hashPassword(convInUsrObj.password);
      }
      else {
        return;
      }
    })

    .then( result => {
      // process base user info
      if(result){
        convInUsrObj = Object.assign( {}, convInUsrObj, {
          password: result
        });
      }
      delete convInUsrObj.links;
      delete convInUsrObj.causes;
      delete convInUsrObj.skills;
      return knex('users')
        .where('id', '=', userId)
        .update(convInUsrObj)
        .returning(['id', 'username']);
    })

    .then( () => {
      // process links
      return knex('links')
        .where('id_user', '=', userId)
        .del()
        .then( () => {
          if(linksArr.length > 0) {
            linksArr.forEach( linkItem => {
              linkPostArr.push(
                Object.assign( {}, {
                  id_user: userId,
                  link_url: linkItem.linkUrl,
                  link_type: linkItem.linkType
                })
              );
            });
            return knex('links')
              .insert(linkPostArr);
          }
          else {
            return;
          }
        });
    })
    
    .then( () => {
      // process causes
      return knex('users_causes')
        .where('id_user', '=', userId)
        .del()
        .then( () => {
          if(causesArr.length > 0) {
            return knex('causes')
              .select('id', 'cause');
          }
          else {
            return;
          }
        })
        .then( results => {
          if(results) {
            causesArr.forEach( causeItem => {
              const causeId = results.filter( item => item.cause === causeItem )[0].id;
              causePostArr.push(
                Object.assign ( {}, {
                  id_user: userId,
                  id_cause: causeId
                })
              );
            });
            return knex('users_causes')
              .insert(causePostArr);
          }
          else {
            return;
          }
        });
    })

    .then( () => {
      // process skills
      return knex('users_skills')
        .where('id_user', '=', userId)
        .del()
        .then( () => {
          if(skillsArr.length > 0) {
            return knex('skills')
              .select('id', 'skill');
          }
          else {
            return;
          }
        })
        .then( results => {
          if(results) {
            skillsArr.forEach( skillItem => {
              const skillId = results.filter( item => item.skill === skillItem )[0].id;
              skillPostArr.push(
                Object.assign ( {}, {
                  id_user: userId,
                  id_skill: skillId
                })
              );
            });
            return knex('users_skills')
              .insert(skillPostArr);
          }
          else {
            return;
          }
        });
    })
    .then( () => {
      return helper.buildUser(userId);
    })
    .then( retObj => {
      let usrObjCC = helper.convertCase(retObj, 'snakeToCC');
      res.status(201).json(usrObjCC);
    })
    .catch( err => {
      if(err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});

// Clear test data
userRouter.delete('/clear/test/data', (req, res) => {
  const knex = require('../db');
  return knex('users')
    .where('username', 'like', '%user%')
    .del()
    .then( () => {
      return knex('users')
        .where('username', 'like', '%test%')
        .del()
        .then( () => {
          res.status(200).json({message: 'Test data deleted'});
        });
    })
    .catch( err => {
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});

module.exports = { userRouter };