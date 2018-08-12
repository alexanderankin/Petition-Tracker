-- 
-- read mysqlu
-- read mysqlp
-- 
-- mysql -u${mysqlu} -p${mysqlp} < import.sql
-- 
drop database if exists petition_trak;
create database petition_trak;
use petition_trak;

drop table if exists signiature_all;
create table signiature_all (
  -- office
  OFFICE_NAME text,

  -- dont ignore
  IS_COMPLETE text,
  IS_COMPLETE_PLUS text,
  IS_DUPLICATE text,
  CARD_REF_ID varchar(15),

  -- ignore this
  IS_UPDATING_ADDRESS text,
  IS_UPDATING_NAME text,
  REASON_FOR_REG_OTHER text,

  -- signiature
  LAST_NAME text,
  FIRST_NAME text,
  MIDDLE_NAME text,
  SUFFIX text,
  ADDRESS_1 text,
  APT_NO text,
  CITY text,
  COUNTY_NAME text,
  STATE text,
  ZIP text,
  MAILING_ADDRESS_1 text,
  MAILING_CITY text,
  MAILING_STATE text,
  MAILING_ZIP text,
  PHONE text,
  DOB text,
  GENDER text,
  RACE text,

  -- dont ignore
  IS_DRIVERS_LICENSE_PROVIDED varchar(3),
  IS_SSN_PROVIDED varchar(3),
  IS_WITHOUT_LICENSE_SSN varchar(3),
  IS_US_CITIZEN varchar(3),
  IS_18_BEFORE_ELECTION varchar(3),
  IS_SIGNATURE_PROVIDED varchar(3),

  -- signiature
  SIGNATURE_DATE text,
  EMAIL text,
  WARD text,
  LINE_NO int,

  -- page
  PAGE_NO int default null,

  -- circulator
  CIRCULATOR_FIRST_NAME text,
  CIRCULATOR_MIDDLE_NAME text,
  CIRCULATOR_LAST_NAME text,
  CIRCULATOR_ADDRESS text,
  CIRCULATOR_CITY text,
  CIRCULATOR_STATE_ID text,
  CIRCULATOR_STATE_STRING text,
  CIRCULATOR_ZIP text,
  CIRCULATOR_PHONE text,
  CIRCULATOR_EMAIL text,

  -- page
  CIRCULATOR_SIGNATURE_DATE text,
  IS_CIRC_SIGNATURE_PRESENT text,
  FIRST_CIRCULATION_DATE text,
  LAST_CIRCULATION_DATE text,

  CIRCULATOR_CITY_EXECUTED text,

  VAN_ID text,
  VAN_VRTID text,

  -- worker
  ADDED_BY_FIRST_NAME text,
  ADDED_BY_LAST_NAME text,

  -- dont ignore this
  VERIFIED_DATE text,
  VERIFIED_STATUS text,
  VERIFIED_NOTES text,
  VERIFIED_BY_FIRST_NAME text,
  VERIFIED_BY_LAST_NAME text,

  -- packet
  COLLECTION_DATE text,
  PACKET_NAME varchar(10),
  PACKET_COUNT text,
  SHIFT text,

  -- location
  LOCATION_TYPE varchar(100),
  LOCATION_NAME varchar(100),

  -- canvasser
  CANVASSER_FIRST_NAME varchar(40),
  CANVASSER_LAST_NAME varchar(40),

  -- supervisor
  SUPERVISOR_FIRST_NAME text,
  SUPERVISOR_LAST_NAME text,

  -- packet
  CLOSED_DATE text,
  PACKET_STATUS text,

  -- dont ignore this
  DROP_CODE text,
  DROPPED_BY_FIRST_NAME text,
  DROPPED_BY_LAST_NAME text,
  RUNNER_NAME text,
  SUBMISSION_DATE text,
  CLERK_NAME text,
  GOT_RECEIPT text,
  CARD_DROP_COUNT text,
  CARD_DROP_NOTES text,

  UNIQUE KEY (CARD_REF_ID)
  );


\! echo "DB and table created, loading...";
LOAD DATA LOCAL INFILE 'export.csv' INTO TABLE signiature_all
  FIELDS TERMINATED BY ','
  optionally enclosed by '"'
  LINES TERMINATED BY '\n' IGNORE 1 LINES;

ALTER TABLE signiature_all ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY first, AUTO_INCREMENT = 1;


\! echo "creating circulator  table: normalizing...";
create table circulator as select distinct
  CIRCULATOR_FIRST_NAME,
  CIRCULATOR_MIDDLE_NAME,
  CIRCULATOR_LAST_NAME,
  CIRCULATOR_ADDRESS,
  CIRCULATOR_CITY,
  CIRCULATOR_STATE_ID,
  CIRCULATOR_STATE_STRING,
  CIRCULATOR_ZIP,
  CIRCULATOR_PHONE,
  CIRCULATOR_EMAIL
  from signiature_all;
ALTER TABLE circulator ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY first, AUTO_INCREMENT = 1;

ALTER TABLE signiature_all ADD COLUMN circulator_id INT after VAN_VRTID;
update signiature_all s
  join circulator c on (
    c.CIRCULATOR_FIRST_NAME = s.CIRCULATOR_FIRST_NAME and
    c.CIRCULATOR_MIDDLE_NAME = s.CIRCULATOR_MIDDLE_NAME and
    c.CIRCULATOR_LAST_NAME = s.CIRCULATOR_LAST_NAME and
    c.CIRCULATOR_ADDRESS = s.CIRCULATOR_ADDRESS and
    c.CIRCULATOR_CITY = s.CIRCULATOR_CITY and
    c.CIRCULATOR_STATE_ID = s.CIRCULATOR_STATE_ID and
    c.CIRCULATOR_STATE_STRING = s.CIRCULATOR_STATE_STRING and
    c.CIRCULATOR_ZIP = s.CIRCULATOR_ZIP and
    c.CIRCULATOR_PHONE = s.CIRCULATOR_PHONE and
    c.CIRCULATOR_EMAIL = s.CIRCULATOR_EMAIL
    )
  set s.circulator_id = c.id;

alter table signiature_all
  drop column CIRCULATOR_FIRST_NAME,
  drop column CIRCULATOR_MIDDLE_NAME,
  drop column CIRCULATOR_LAST_NAME,
  drop column CIRCULATOR_ADDRESS,
  drop column CIRCULATOR_CITY,
  drop column CIRCULATOR_STATE_ID,
  drop column CIRCULATOR_STATE_STRING,
  drop column CIRCULATOR_ZIP,
  drop column CIRCULATOR_PHONE,
  drop column CIRCULATOR_EMAIL;


\! echo "creating worker     table: normalizing...";
create table worker as select distinct
  ADDED_BY_FIRST_NAME, ADDED_BY_LAST_NAME
  from signiature_all;
ALTER TABLE worker ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY first, AUTO_INCREMENT = 1;

ALTER TABLE signiature_all ADD COLUMN worker_id INT after VAN_VRTID;
update signiature_all s
  join worker w on (
    w.ADDED_BY_FIRST_NAME = s.ADDED_BY_FIRST_NAME and
    w.ADDED_BY_LAST_NAME = s.ADDED_BY_LAST_NAME
    )
  set s.worker_id = w.id;

alter table signiature_all
  drop column ADDED_BY_FIRST_NAME,
  drop column ADDED_BY_LAST_NAME;
  

\! echo "creating location   table: normalizing...";
create table location as select distinct LOCATION_NAME, LOCATION_TYPE from signiature_all;
ALTER TABLE location ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY first, AUTO_INCREMENT=1;

ALTER TABLE signiature_all ADD COLUMN location_id INT after worker_id;
update signiature_all s
  join location l on (
    l.LOCATION_NAME = s.LOCATION_NAME and
    l.LOCATION_TYPE = s.LOCATION_TYPE
    )
   set s.location_id=l.id;
alter table signiature_all
  drop column LOCATION_NAME,
  drop column LOCATION_TYPE;


\! echo "creating canvasser  table: normalizing...";
create table canvasser as select distinct CANVASSER_FIRST_NAME, CANVASSER_LAST_NAME from signiature_all;
ALTER TABLE canvasser ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY first, AUTO_INCREMENT=1;

ALTER TABLE signiature_all ADD COLUMN canvasser_id INT after location_id;
update signiature_all s
  join canvasser c on (
    c.CANVASSER_FIRST_NAME = s.CANVASSER_FIRST_NAME and
    c.CANVASSER_LAST_NAME = s.CANVASSER_LAST_NAME
    )
   set s.canvasser_id=c.id;
alter table signiature_all
  drop column CANVASSER_FIRST_NAME,
  drop column CANVASSER_LAST_NAME;



\! echo "creating supervisor table: normalizing...";
create table supervisor as select distinct SUPERVISOR_FIRST_NAME, SUPERVISOR_LAST_NAME from signiature_all;
ALTER TABLE supervisor ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY first, AUTO_INCREMENT=1;

ALTER TABLE signiature_all ADD COLUMN supervisor_id INT after canvasser_id;
update signiature_all s
  join supervisor su on (
    su.SUPERVISOR_FIRST_NAME = s.SUPERVISOR_FIRST_NAME and
    su.SUPERVISOR_LAST_NAME = s.SUPERVISOR_LAST_NAME
    )
   set s.supervisor_id=su.id;
alter table signiature_all 
  drop column SUPERVISOR_FIRST_NAME,
  drop column SUPERVISOR_LAST_NAME;  


\! echo "creating packet     table: normalizing...";
create table packet as select distinct
  COLLECTION_DATE, PACKET_NAME, PACKET_COUNT, SHIFT, CLOSED_DATE, PACKET_STATUS, canvasser_id, supervisor_id, location_id
  from signiature_all
  order by cast(trim(leading 'M-' from PACKET_NAME) as unsigned);
ALTER TABLE packet ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY first, AUTO_INCREMENT=1;

ALTER TABLE signiature_all ADD COLUMN packet_id INT after supervisor_id;
update signiature_all s
  join packet p on (
    p.COLLECTION_DATE = s.COLLECTION_DATE and
    p.PACKET_NAME = s.PACKET_NAME and
    p.PACKET_COUNT = s.PACKET_COUNT and
    p.SHIFT = s.SHIFT and
    p.CLOSED_DATE = s.CLOSED_DATE and
    p.PACKET_STATUS = s.PACKET_STATUS
    )
   set s.packet_id=p.id;

alter table signiature_all
  drop column COLLECTION_DATE,
  drop column PACKET_NAME,
  drop column PACKET_COUNT,
  drop column SHIFT,
  drop column CLOSED_DATE,
  drop column PACKET_STATUS;


drop table if exists page;
create table page as
  select distinct
  packet_id,
  PAGE_NO, 
  circulator_id,
  CIRCULATOR_SIGNATURE_DATE,
  IS_CIRC_SIGNATURE_PRESENT
  from signiature_all
  order by
    packet_id,
    PAGE_NO;
ALTER TABLE page ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY first, AUTO_INCREMENT=1;

ALTER TABLE signiature_all ADD COLUMN page_id INT after packet_id;
update signiature_all s
  join page p on (
    p.packet_id = s.packet_id and
    p.PAGE_NO = s.PAGE_NO and
    p.circulator_id = s.circulator_id and
    p.CIRCULATOR_SIGNATURE_DATE = s.CIRCULATOR_SIGNATURE_DATE and
    p.IS_CIRC_SIGNATURE_PRESENT = s.IS_CIRC_SIGNATURE_PRESENT
    )
  set s.page_id = p.id;

ALTER TABLE signiature_all
  drop column PAGE_NO,
  drop column packet_id,
  drop column circulator_id,
  drop column CIRCULATOR_SIGNATURE_DATE,
  drop column IS_CIRC_SIGNATURE_PRESENT;

