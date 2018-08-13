var express = require('express');
var router = express.Router();

var util = require('../util');

/* GET home page. */
router.get('/', function(req, res, next) {
  return res.render('index', { user: req.signedCookies.user });  // undefined ok
});

function loginOrRedirect(destination) {
  return function(req, res, next) {
    if (req.signedCookies.user) return res.redirect(destination);
    res.render('login');
  }
}

router.get('/petition/login', loginOrRedirect('/petition'));
router.get('/registration/login', loginOrRedirect('/registration'));

function loginCheck(destination) {
  return function(req, res, next) {
    res.cookie('user', req.body.username, util.cookieOptions.send);
    res.redirect(destination);
  }
}

router.post('/petition/login', loginCheck('/petition'));
router.post('/registration/login', loginCheck('/registration'));

router.get('/logout', function (req, res, next) {
  res.clearCookie('user', util.cookieOptions.clear);
  res.redirect("/");
});

router.use("/petition", require('./petition'));
// router.use("/registration", require('./registration'));

router.use(function (err, req, res, next) {
  if (err.message === "Unauthorized") {
    return res.render('error', {
      message: 'Invalid login information.', error: err
    });
  }
  next(err);
});

module.exports = router;
