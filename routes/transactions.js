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
const yahooFinance = require('yahoo-finance');

// =============================================================================
// used in POST route
function insertTrade(newTrade, res, ticker, snapshot) {
  delete newTrade.ticker;

  knex('transactions')
  .insert(decamelizeKeys(newTrade),
    ['id', 'user_id', 'stock_id', 'trade_date', 'num_shares', 'share_price',
    'commission', 'fees', 'direction', 'action'])
    .returning('*')
    .then((row) => {
      const trade = camelizeKeys(row[0]);
      console.log('NEW TRADE EXISTING STOCK: ', trade);
      res.render('confirm-trade', {ticker: ticker,
                                company: snapshot.name,
                                numShares: trade.numShares,
                                sharePrice: trade.sharePrice,
                                commission: trade.commission,
                                direction: trade.direction,
                                action: trade.action,
                                status: 'Added'});
  });
}

// =============================================================================
// show input form for new transaction
router.get('/new', function(req, res) {
  console.log('COOKIE: ', req.cookies);
  if (req.cookies['/token']) {
    res.render('get-trade');
  } else {
    res.redirect('../token/login');
  }

});

// =============================================================================
// POST new transaction
router.post('/', (req, res) => {
  let userId = Number(req.cookies['/token'].split('.')[0]);

  let numShares = Number(req.body.numShares);
  let ticker = req.body.ticker.toUpperCase();

  let newTrade = {
    userId: userId,
    ticker: ticker,
    tradeDate: req.body.tradeDate,
    numShares: numShares,
    sharePrice: Number(req.body.sharePrice),
    commission: Number(req.body.commission),
    fees: Number(req.body.fees),
    direction: req.body.direction,
    action: numShares > 0 ? 'BUY' : 'SELL'
  };

  knex('stocks').where('ticker', newTrade.ticker).returning('id').first()
  .then((checkStock) => {

  if (!checkStock) {
    yahooFinance.snapshot ({
      symbol: ticker,
      fields: ['n','p']
    }).then((snapshot) => {

      console.log('SNAPSHOT : ', snapshot);

      knex('stocks').insert({ticker: newTrade.ticker,
                            company_name: snapshot.name,
                            last_close_price: snapshot.previousClose})
      .returning('*')
      .then((stock) => {

        newTrade.stockId = stock[0].id;

      }).then(() => {

      insertTrade(newTrade, res, ticker, snapshot);

    }).catch(err => {
      console.log('POST ERROR: ', err);
      res.status(400).send(err);
    });
  });
  } else {
    yahooFinance.snapshot ({
      symbol: ticker,
      fields: ['n']
    }).then((snapshot) => {

      newTrade.stockId = checkStock.id;
      insertTrade(newTrade, res, ticker, snapshot);

    }).catch(err => {
      console.log('POST ERROR: ', err);
      res.status(400).send(err);
    });
  } // end if else

  });
});

// =============================================================================
// show transaction update page for selected transaction
router.get('/update/:id', (req, res) => {

  if (req.cookies['/token']) {
    let userId = Number(req.cookies['/token'].split('.')[0]);

    let trxId = Number(req.params.id);

    knex.select('transactions.id', 'company_name', 'ticker', 'trade_date', 'num_shares', 'share_price', 'commission', 'fees', 'direction', 'action')
    .from('transactions')
    .join('stocks', 'transactions.stock_id', 'stocks.id')
    .where('transactions.id', trxId)
    .then((trx) => {
      trx = camelizeKeys(trx[0]);

      if (trx) {
        res.render('edit-trade', {  company: trx.companyName,
                                  tradeDate: trx.tradeDate,
                                  numShares: trx.numShares,
                                 sharePrice: trx.sharePrice,
                                 commission: trx.commission,
                                  direction: trx.direction,
                                     action: trx.action,
                                      trxId: trx.id
                                });
      }
    });

  } else {

    res.redirect('../token/login');
  }
});


// =============================================================================
// PUT - update transaction
router.put('/', (req, res, next) => {
  let userId = Number(req.cookies['/token'].split('.')[0]);
  let trxId = Number(req.body.trxId);
  let ticker = '';
  let companyName = '';
  let action = '';

  knex.select('*')
    .from('transactions')
    .join('stocks', 'stocks.id', 'stock_id')
    .where('user_id', userId)
    .where('transactions.id', trxId).first()
    .then((trx) => {
      if(trx) {
        ticker = trx.ticker;
        companyName = trx.company_name;
        action = trx.action;

        const { tradeDate, direction } = req.body;
        let numShares = Number(req.body.numShares);
        let sharePrice = Number(req.body.sharePrice);
        let commission = Number(req.body.commission);
        let fees = Number(req.body.fees);

        const updateTrx = {};

        if (tradeDate) updateTrx.tradeDate = tradeDate;
        if (direction) updateTrx.direction = direction;
        if (numShares) updateTrx.numShares = numShares;
        if (sharePrice) updateTrx.sharePrice = sharePrice;
        if (commission) updateTrx.commission = commission;
        if (fees) updateTrx.fees = fees;


        return knex('transactions')
          .update(decamelizeKeys(updateTrx), '*')
          .where('id', trxId);

      } else {
        throw new Error('Transaction Not Found');
      }
    })
    .then((row) => {

      const trx = camelizeKeys(row[0]);

      delete trx.createdAt;
      delete trx.updatedAt;

      res.render('confirm-trade', {tradeDate: trx.tradeDate || '',
                                   direction: trx.direction || '',
                                   numShares: trx.numShares || '',
                                  sharePrice: trx.sharePrice || '',
                                  commission: trx.commission || '',
                                        fees: trx.fees || '',
                                      ticker: ticker,
                                     company: companyName,
                                      action: action,
                                      status: 'Updated'
                                    });
    })
    .catch((err) => {
      console.log('PUT ERROR: ', err);
      res.status(400).send(err);
    });
});

// =============================================================================
// DELETE open transaction record
router.delete('/', (req, res, next) => {
  let userId = Number(req.cookies['/token'].split('.')[0]);
  let trxId = Number(req.body.trxId);
  let deletedTrx;

  knex.select('*')
    .from('transactions')
    .join('stocks', 'stocks.id', 'stock_id')
    .where('user_id', userId)
    .where('transactions.id', trxId).first()
    .then((trx) => {
      if(trx) {

        deletedTrx = trx;

        return knex('transactions')
          .del().where('id', trxId);
      } else {
        throw new Error('Transaction Not Found');
      }
    })
    .then(() => {

      const trx = camelizeKeys(deletedTrx);

      delete trx.createdAt;
      delete trx.updatedAt;

      res.render('confirm-trade', {ticker: trx.ticker || '',
                                  company: trx.companyName || '',
                                numShares: trx.numShares || '',
                               sharePrice: trx.sharePrice || '',
                               commission: trx.commission || '',
                                direction: trx.type || '',
                                   action: trx.action || '',
                                   status: 'Deleted'
                                  });
    })
    .catch((err) => {
      console.log('DELETE ERROR: ', err);
      res.status(400).send(err);
    });
});

module.exports = router;
