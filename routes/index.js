var express = require('express');
var router = express.Router();

var util = require('../util');

/* GET home page. */
router.get('/', function(req, res, next) {
  return res.render('index', { user: req.cookies.user });  // undefined ok
});

router.get('/petition/login', function(req, res, next) {
  if (req.cookies.user) return res.redirect('/petition');
  res.render('login');
});

router.get('/registration/login', function(req, res, next) {
  if (req.cookies.user) return res.redirect('/registration');
  res.render('login');
});

function loginCheck(req, res, next) {
  res.cookie('user', req.body.username, util.cookieOptions.send);
  res.redirect("/");
}

router.post('/petition/login', loginCheck);
router.post('/registration/login', loginCheck);

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
