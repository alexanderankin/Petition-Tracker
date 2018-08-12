var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var user = req.cookies.user;
  console.log(user);
  if (user) {
    return res.render('index', { user });
  }

  return res.render('index');
});

router.get('/petition/login', function(req, res, next) {
  if (req.cookies.user) {
    return res.redirect('/');
  }
  res.render('login', {});
});

router.post('/petition/login', function (req, res, next) {
  console.log(req.body);
  res.cookie('user', req.body.username, { maxAge: 10000000 });
  res.redirect("/");
})

router.get('/logout', function (req, res, next) {
  res.clearCookie('user');
  res.redirect("/");
});

router.use("/petition", require('./petition'));
// router.use("/registration", require('./registration'));

// function getUserType(username, password, done) {
//   setTimeout(function() {
//     done('user', )
//   });
// }

router.use(function (err, req, res, next) {
  if (err.message === "Unauthorized") {
    return res.render('error', {
      message: 'Not logged in.', error: err
    });
  }
  next(err);
});

module.exports = router;
