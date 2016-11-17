/* jshint esversion: 6 */
/* jshint devel: true */
/* jshint node: true */
/* jshint browser: true */
'use strict';

const express = require('express');
var knex = require('../db/knex');
const bcrypt = require('bcrypt-as-promised');
const { camelizeKeys, decamelizeKeys } = require('humps');
// eslint-disable-next-line new-cap
const router = express.Router();

// =============================================================================
// show input form for new user
router.get('/new', function(req, res) {
  res.render('signup');
});

// =============================================================================
// POST new user
router.post('/', (req, res) => {

  //console.log('NEW USER: ', req.body);
  const password = req.body.password1;

  bcrypt.hash(password, 12)
    .then((hashed) => {

      let newUser = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        userName: req.body.userName,
        email: req.body.email,
        hashedPassword: hashed
      };

      return knex('users')
        .insert(decamelizeKeys(newUser), ['id', 'first_name', 'last_name', 'user_name', 'email']);
    })
    .then((row) => {
      const user = camelizeKeys(row[0]);

      delete user.createdAt;
      delete user.updatedAt;
      delete user.hashedPassword;

      //console.log('RESPONDING WITH: ', user);
      res.render('added', {firstName: user.firstName,
                            lastName: user.lastName,
                            userName: user.userName,
                               email: user.email
                          });
      //res.json(user);
    }).catch(err => {
      console.log('POST ERROR: ', err);
      res.status(400).send(err);
    });
});

module.exports = router;
