'use strict';

const express = require('express');
const passport = require('passport');
const { jwtStrategy } = require('./auth/jwt-strategy');
const userRouter = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const { hashPassword } = require('./auth/bcrypt');
const { helper, convertCase } = require('./helper');
const { keys } = require('./helper-keys');

process.stdout.write('\x1Bc');

passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });

// GET api/users
userRouter.get('/', (req, res) => {
  // check for query parameters
  let queryObject = {};
  if(Object.keys(req.query).length > 0) {
    queryObject = req.query;
  } 
  console.log(' queryObject ', queryObject);

  return helper.buildUsersList(queryObject)
    .then(usersList => {
      console.log(' @@@@@@@@@ ', usersList);
      res.json(usersList);
    })
    .catch( err => {
      res.status(500).json({message: `Internal server error: ${err}`});
    });    
});

// GET api/users/:id
userRouter.get('/:id', (req, res) => {
  const idUser = req.params.id;
  let respObj = {};
  let extAdminOf = [];
  
  return helper.buildUser(idUser)
    .then( result => {
      respObj = convertCase(result, 'snakeToCC');
      return (helper.getExtUserInfo(idUser));
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
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Error: username, password, and user type are required'
    });
  }

  // check for dup username
  let userFromClient = Object.assign( {}, req.body);
  console.log('body', userFromClient);
  return knex('users')
    .select()
    .where({username: userFromClient.username})
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
      return hashPassword(userFromClient.password);
    })
    .then( result => {
      // build db insert obj
      let userObject = convertCase(userFromClient, 'ccToSnake');
      if(userObject.user_type === 'organization') {
        userObject = Object.assign( {}, userObject, {
          password: result,
          first_name: null,
          last_name: null
        });
      }
      else {
        userObject = Object.assign( {}, userObject, {
          password: result,
          organization: null,
        });
      }
      // insert user
      return knex('users')
        .insert(userObject)
        .returning(['id', 'username', 'user_type', 'first_name', 'last_name', 'organization'])
        .then( results => {
          const resObj = convertCase(results[0], 'snakeToCC');
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
  const idUser = req.params.id;
  console.log('idUser', idUser);
  const knex = require('../db');
  let userFromClient = Object.assign( {}, req.body);
  if(userFromClient.id) { delete userFromClient.id; }
  let userObject = {};
  let linksArr = req.body.links.length > 0 ? req.body.links.slice() : [] ;
  let linkPostArr = [];
  let causesArr = req.body.causes.length > 0 ? req.body.causes.slice() : [] ;
  let causePostArr = [];
  let skillsArr = req.body.skills.length > 0 ? req.body.skills.slice() : [] ;
  let skillPostArr = [];

  // verify id
  return knex('users')
    .select()
    .where('id', '=', idUser)
    .then( userFound => {
      console.log('userFound',userFound);
      if(!userFound) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'User id not found.',
        });
      }
      console.log('not rejected');

      // format for db (snake case, no join fields)
      userObject = convertCase(userFromClient, 'ccToSnake', 'usersKeysInsert');
      console.log('4 userObject', userObject);

      // get hashed pw
      if(userObject.password) return hashPassword(userObject.password);
      console.log('5 userObject', userObject);
      return;
    })
    .then(hashedPassword => {
      console.log('hashedPassword',hashedPassword);

      if(hashedPassword) userObject.password = hashedPassword ;
      console.log('6 userObject',userObject);

      // update user
      return knex('users')
        .where('id', '=', idUser)
        .update(userObject)
        .returning(['id', 'username']);
    })

    .then( (userreturned) => {
      console.log('userreturned', userreturned);
      // process links
      return knex('links')
        .where('id_user', '=', idUser)
        .del()
        .then( () => {
          if(linksArr.length > 0) {
            linksArr.forEach( linkItem => {
              linkPostArr.push(
                Object.assign( {}, {
                  id_user: idUser,
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
        .where('id_user', '=', idUser)
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
                  id_user: idUser,
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
        .where('id_user', '=', idUser)
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
                  id_user: idUser,
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
      return helper.buildUser(idUser);
    })
    .then( retObj => {
      let usrObjCC = convertCase(retObj, 'snakeToCC');
      res.status(201).json(usrObjCC);
    })
    .catch( err => {
      if(err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({message: `Internal server error: ${err}`});
    });
});

module.exports = { userRouter };