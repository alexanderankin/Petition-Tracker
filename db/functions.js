var pool = require('./db');

function getPacketsView(req, done) {
  var q = `
    select
      p.id as id,
      p.PACKET_NAME as \`Packet Name\`,
      p.COLLECTION_DATE as \`Collection Date\`,
      c.CANVASSER_FIRST_NAME as \`Canvasser First Name\`,
      c.CANVASSER_LAST_NAME as \`Canvasser Last Name\`,
      s.SUPERVISOR_FIRST_NAME as \`Supervisor First Name\`,
      s.SUPERVISOR_LAST_NAME as \`Supervisor Last Name\`,
      p.SHIFT as \`Shift\`
    from packet p
    join canvasser c on p.canvasser_id = c.id
    join supervisor s on p.supervisor_id = s.id
    order by p.id desc
    limit ?
    offset ?;
  `;
  var perPage = parseInt(req.query.perPage, 10);
  var limit = perPage || 10;
  var page = parseInt(req.query.page, 10) || 1;
  var offset = (page - 1) * limit;

  var params = [ limit, offset ];

  pool.getConnection(function (err, conn) {
    if (err) { throw err; }
    conn.query(q, params, function (err, res) {
      conn.release();
      if (err) { throw err; }

      done(null, {
        page, perPage,
        packets: res
      });
    });
  });
}

function singlePacketTop(id, conn, done) {
  var q = `
    select
      p.id,
      p.PACKET_NAME,
      c.CANVASSER_FIRST_NAME,
      c.CANVASSER_LAST_NAME,
      p.COLLECTION_DATE,
      p.SHIFT,
      s.SUPERVISOR_FIRST_NAME,
      s.SUPERVISOR_LAST_NAME,
      l.LOCATION_TYPE,
      l.LOCATION_NAME
    from packet p
    join canvasser c on p.canvasser_id = c.id
    join supervisor s on p.supervisor_id = s.id
    join location l on p.location_id = l.id
    where p.id = ?;
  `;
  conn.query(q, [ id ], function (err, res) {
    if (err) {
      conn.release();
      return done(err);
    }

    done(null, res);
  });
}

/**
 * Maybe useful for SPA implementation? tricky...
 */
function singlePacketSigs(id, conn, done) {
  var q = `
    select
      sig.CARD_REF_ID as ID,
      sig.FIRST_NAME as \`First Name\`,
      sig.LAST_NAME as \`Last Name\`,
      sig.ADDRESS_1 as \`Address\`,
      sig.CITY as \`City\`,
      p.PAGE_NO,
      sig.LINE_NO
    from signiature_all sig
    join page p on p.id = sig.page_id
    where p.packet_id = ?
    order by
      p.PAGE_NO,
      sig.LINE_NO;
  `;
  conn.query(q, [ id ], function (err, resp) {
    if (err) {
      conn.release();
      return done(err);
    }

    done(null, resp);
  });
}

function singlePacketPages(id, conn, done) {
  var q = `
    select
      pg.id,
      pg.PAGE_NO,
      concat(
        c.CIRCULATOR_FIRST_NAME,
        ' ',
        c.CIRCULATOR_LAST_NAME) as \`Circulator's Name\`,
      concat(
        c.CIRCULATOR_ADDRESS,
        ' ',
        c.CIRCULATOR_CITY,
        ' ',
        c.CIRCULATOR_ZIP) as \`Circulator's Address\`
    from packet pt
    join page pg on pg.packet_id = pt.id
    join circulator c on c.id = pg.circulator_id
    where pt.id = ?;
  `;
  conn.query(q, [ id ], function (err, resp) {
    if (err) {
      conn.release();
      return done(err);
    }

    done(null, resp);
  });
}

function getPacketView(req, done) {
  var id = parseInt(req.params.id, 10);
  if (!id) {
    return setTimeout(function() { done(new Error('No packet id')); });
  }

  pool.getConnection(function (err, conn) {
    if (err) { throw err; }
    singlePacketTop(id, conn, function (err, sPT) {
      if (err) { throw err; }
      singlePacketPages(id, conn, function (err, sPP) {
        conn.release();
        if (err) { throw err; }
        
        done(null, {
          top: sPT,
          pages: sPP
        });
      });
    });
  });
}

function pagePacketTop(id, conn, done) {
  var q = `
    select
      p.id,
      p.id as packet_id,
      p.PACKET_NAME,
      c.CANVASSER_FIRST_NAME,
      c.CANVASSER_LAST_NAME,
      p.COLLECTION_DATE,
      p.SHIFT,
      s.SUPERVISOR_FIRST_NAME,
      s.SUPERVISOR_LAST_NAME,
      l.LOCATION_TYPE,
      l.LOCATION_NAME,
      concat(
        cr.CIRCULATOR_FIRST_NAME,
        ' ',
        cr.CIRCULATOR_LAST_NAME) as \`Circulator's Name\`,
      concat(
        cr.CIRCULATOR_ADDRESS,
        ' ',
        cr.CIRCULATOR_CITY,
        ' ',
        cr.CIRCULATOR_ZIP) as \`Circulator's Address\`,
      pg.IS_CIRC_SIGNATURE_PRESENT as \`Circulator's Signature\`
    from packet p
    join canvasser c on p.canvasser_id = c.id
    join supervisor s on p.supervisor_id = s.id
    join location l on p.location_id = l.id
    join page pg on pg.packet_id = p.id
    join circulator cr on cr.id = pg.circulator_id
    where pg.id = ?;
  `;
  conn.query(q, [ id ], function (err, resp) {
    if (err) {
      conn.release();
      return done(err);
    }

    done(null, resp);
  });
}

function singlePageSigniatures(id, conn, done) {
      // s.CITY,     | COUNTY_NAME | STATE | ZIP
  var q = `
    select
      s.LINE_NO as \`Line\`,
      s.IS_SIGNATURE_PROVIDED as \`Signed\`,
      s.FIRST_NAME as \`First Name\`,
      s.LAST_NAME as \`Last Name\`,
      s.ADDRESS_1 as \`Address\`,
      s.CITY as \`City / Municipality\`,
      s.SIGNATURE_DATE as \`Date\`
    from signiature_all s
    where s.page_id = ?
  `;
  conn.query(q, [ id ], function (err, resp) {
    if (err) {
      conn.release();
      return done(err);
    }

    done(null, resp);
  });
}

function getPageView(req, done) {
  var id = parseInt(req.params.id, 10);
  if (!id) {
    return setTimeout(function() { done(new Error('No page id')); });
  }

  pool.getConnection(function (err, conn) {
    if (err) { throw err; }
    pagePacketTop(id, conn, function (err, pPT) {
      if (err) { throw err; }
      singlePageSigniatures(id, conn, function (err, sPS) {
        conn.release();
        if (err) { throw err; }

        done(null, {
          top: pPT,
          signiatures: sPS
        });
      });
    });
  });
}

module.exports = {
  getPacketsView, getPacketView, getPageView
};
