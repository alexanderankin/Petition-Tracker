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

function getPacketView(req, done) {
  var id = parseInt(req.params.id, 10);
  if (!id) {
    return setTimeout(function() { done(new Error('No packet id')); });
  }

  pool.getConnection(function (err, conn) {
    if (err) { throw err; }
    singlePacketTop(id, conn, function (err, sPT) {
      if (err) { throw err; }
      singlePacketSigs(id, conn, function (err, sPS) {
        conn.release();
        if (err) { throw err; }
        
        done(null, {
          top: sPT,
          signiatures: sPS
        });
      });
    });
  });
}

module.exports = {
  getPacketsView, getPacketView
};
