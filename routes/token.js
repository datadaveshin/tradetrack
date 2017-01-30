/* jshint esversion: 6 */
/* jshint devel: true */
/* jshint node: true */
/* jshint browser: true */
'use strict';

const boom  = require('boom');
const express = require('express');
const bcrypt = require('bcrypt-as-promised');
var knex = require('../db/knex');
const { camelizeKeys, decamelizeKeys } = require('humps');
// eslint-disable-next-line new-cap
const router = express.Router();

// =============================================================================
// show sign in form for existing user
router.get('/login', function(req, res) {
  var errorMsg = '';

  if (req.query.login === 'invalid') {
    errorMsg = 'Invalid attempt. Please check your credentials and try again.';
  }

  res.render('login', {msg: errorMsg});
});

// =============================================================================
// GET with or without token
router.get('/', (req, res, next) => {
  if (req.cookies['/token']) {
    if (req.cookies['/token'].length > 1) {
      res.status(200).json(true);
    } else {
      res.status(200).json(false);
    }
  } else {
    return next(boom.create(400, 'req.cookies is undefined'));
  }
});

// =============================================================================
// POST token and check for bad email and bad password
router.post('/', (req, res, next) => {
  const authReq = decamelizeKeys(req.body);
  const { email, password } = req.body;

  let user;

  knex('users').where('email', authReq.email.toLowerCase()).first()
    .then((row) => {
      if (!row) {
        res.redirect('/token/login' + '?login=invalid');
      }

      user = camelizeKeys(row);
      return bcrypt.compare(authReq.password, user.hashedPassword);
    })
    .then(() => {
      delete user.hashedPassword;
      delete user.createdAt;
      delete user.updatedAt;

      res.cookie('/token', user.id + '.cookie.monster.rawr', { path: '/', httpOnly: true });
      res.render('index', { userName: user.userName });
    })
    .catch(bcrypt.MISMATCH_ERROR, () => {
      res.redirect('/token/login' + '?login=invalid');
    })
    .catch(err => {
      next(err);
    });
});

// =============================================================================
// DELETE token
router.get('/delete', (req, res) => {
  res.clearCookie('/token', { path: '/', httpOnly: true });
  res.redirect('../token/login');
});

module.exports = router;
