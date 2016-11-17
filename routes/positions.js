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
// show all open positions for current user
router.get('/open', function(req, res) {
  knex.select('users.id','user_name', 'ticker', 'share_price', 'trade_date', 'num_shares')
  .from('transactions')
  .join('users', 'transactions.user_id', 'users.id')
  .join('stocks', 'transactions.stock_id', 'stocks.id')
  .where('closed_flag', false)
  .then((rows) => {

    if (req.cookies['/token']) {
      const faves = camelizeKeys(rows);
      console.log(rows);
      res.render('showall', rows);
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
