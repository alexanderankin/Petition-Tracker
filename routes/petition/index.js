var express = require('express');
var router = express.Router();

var queries = require('../../db/functions');

router.use(function userMW(req, res, next) {
  if (res.locals.user = req.signedCookies.user) { return next(); }
  return next(new Error("Unauthorized"));
});

/* GET /petition */
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
  queries.getPacketView(req, function (err, r_) {
    var pages = r_.pages;
    var pagesHeaders = Object.keys((pages && pages[0]) || {});

    res.render('petitions/packet', {
      top: r_.top.pop(),
      pages, pagesHeaders
    });
  });
});

router.get('/page/:id', function (req, res, next) {
  queries.getPageView(req, function (err, r_) {
    var sigs = r_.signiatures;
    var sigsHeaders = Object.keys((sigs && sigs[0]) || {});

    var top = r_.top.pop();

    res.render('petitions/page', {
      top,
      signiatures: sigs,
      signiaturesHeaders: sigsHeaders,
      pagesNavLink: top.packet_id
    });
  });
});

module.exports = router;
