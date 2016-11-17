/* jshint esversion: 6 */
/* jshint devel: true */
/* jshint node: true */
/* jshint browser: true */
'use strict';

const boom  = require('boom');
const express = require('express');
const bcrypt = require('bcrypt-as-promised');
var knex = require('../db/knex');
var Trx = require('../models/trx.js').Trx;
const { camelizeKeys, decamelizeKeys } = require('humps');
// eslint-disable-next-line new-cap
const router = express.Router();

// =============================================================================
// show all open positions for current user
router.get('/open', function(req, res) {
  knex.select('transactions.id', 'users.id','user_name', 'ticker', 'share_price', 'trade_date', 'num_shares')
  .from('transactions')
  .join('users', 'transactions.user_id', 'users.id')
  .join('stocks', 'transactions.stock_id', 'stocks.id')
  .where('closed_flag', false)
  .then((rows) => {

    if (req.cookies['/token']) {
      console.log(rows);
      res.send(rows);
    } else {
      res.status(401);
      res.set('Content-Type', 'text/plain');
      res.send('Unauthorized');
    }

  }).catch((err) => {

    res.status(401).send(err);
  });
});

// =============================================================================
// show all closed positions for current user
router.get('/closed', function(req, res) {
  knex.select('transactions.id', 'users.id','user_name', 'ticker', 'share_price', 'trade_date', 'num_shares')
  .from('transactions')
  .join('users', 'transactions.user_id', 'users.id')
  .join('stocks', 'transactions.stock_id', 'stocks.id')
  .where('closed_flag', true)
  .then((rows) => {

    var closedTrx = [];

    for (var i = 0; i < rows.length; i++) {
      var newTrx = new Trx(rows[i].id, rows[i].user_name, rows[i].ticker,
        rows[i].share_price, rows[i].trade_date, rows[i].num_shares);

        closedTrx.push(newTrx);
    }

    if (req.cookies['/token']) {
      console.log(closedTrx);
      res.send(closedTrx);
    } else {
      res.status(401);
      res.set('Content-Type', 'text/plain');
      res.send('Unauthorized');
    }

  }).catch((err) => {

    res.status(401).send(err);
  });
});

// =============================================================================
// show specified open position for current user
router.get('/:id', function(req, res) {
  var trxId = Number(req.params.id);

  knex.select('users.id','user_name', 'ticker', 'share_price', 'trade_date', 'num_shares')
  .from('transactions')
  .join('users', 'transactions.user_id', 'users.id')
  .join('stocks', 'transactions.stock_id', 'stocks.id')
  .where('transactions.id', trxId)
  .then((rows) => {

    if (req.cookies['/token']) {
      console.log('SHOW ROW: ', rows);
    } else {
      res.status(401);
      res.set('Content-Type', 'text/plain');
      res.send('Unauthorized');
    }

  }).catch((err) => {

    res.status(401).send(err);
  });
});


module.exports = router;
