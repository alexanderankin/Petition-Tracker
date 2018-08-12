var express = require('express');
var router = express.Router();

var queries = require('../../db/functions');

router.use(function userMW(req, res, next) {
  if (req.cookies.user) { return next(); }
  return next(new Error("Unauthorized"));
});

router.get("/", function (req, res, next) {
  queries.getPacketsView(req, function (err, results) {
    var packets = results.packets;
    var headerCells = Object.keys(packets[0] || {});

    res.render('petitions/packets', {
      page: results.page, perPage: results.perPage,
      packets, headerCells
    });
  });
});

router.get('/packet/:id', function (req, res, next) {
  queries.getPacketView(req, function (err, results) {
    res.render('petitions/packet', {
      top: results.top.pop(),
      signiaturesHeaders: Object.keys(results.signiatures[0] || {}),
      signiatures: results.signiatures
    });
  });
});

module.exports = router;
