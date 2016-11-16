'use strict';
/* jshint esversion: 6 */
/* jshint devel: true */
/* jshint node: true */
/* jshint browser: true */

const express = require('express');
const app = express();
const path = require('path');
const ejs = require('ejs');
const PORT = process.env.PORT || 3009;

app.disable('x-powered-by');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const users = require('./routes/users.js');
const token = require('./routes/token.js');
const index = require('./routes/index.js');
const transactions = require('./routes/transactions.js');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(__dirname + '/public'));
app.use('/users', users);
app.use('/token', token);
app.use('/', index);
app.use('/transactions', transactions);

app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views/users/'),
                  path.join(__dirname, 'views/stocks/'),
                  path.join(__dirname, 'views/site/')]);


// =============================================================================
// spin up the FTL
app.listen(PORT, () => {
  console.log(`TradeTrack server is running on port ${PORT}`);
});

module.exports = {
  app: app
};
