-- drop database if exists whatisourdbname;

DROP TABLE IF EXISTS users_skills CASCADE;
DROP TABLE IF EXISTS users_causes CASCADE;
DROP TABLE IF EXISTS opportunities_causes CASCADE;
DROP TABLE IF EXISTS links CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS responses CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS causes CASCADE;
DROP TABLE IF EXISTS skills CASCADE;

-- CREATE DATABASE whatisourdbname;

CREATE TABLE users (
  id serial primary key,
  username text UNIQUE,
  -- type: individual, organization
  user_type text default 'individual',
  -- below for individuals only
  first_name text,
  last_name text, 
  -- below for organizations only
  organization text,
  logo text,
  location_city text,
  location_state text,
  -- default "USA"
  location_country text,
  availability text,
  bio text,
  password text,
  timestamp_created timestamp default current_timestamp
);

CREATE TABLE opportunities (
  id serial primary key,
  -- the user below is the "owner" of this opportunity
  id_user integer references users on delete cascade,
  organization text,
  -- type: goods, services, financial
  opportunity_type text default 'services',
  -- offer: true if offer to provide, false if a need
  offer boolean default 'false',  
  title text not null,
  logo text,  
  narrative text not null,
  timestamp_start timestamp,
  timestamp_end timestamp,
  location_city text,
  location_state text,
  --default "USA"
  location_country text,
  -- link = url for the event (do not populate [on front] if the same as the user's url)
  link text default null,
  timestamp_created timestamp default current_timestamp
);

-- @@@@@@@@@@@ CAUSES @@@@@@@@@@@

CREATE TABLE causes (
  id serial primary key,
  cause text
);

CREATE TABLE users_causes (
  id serial primary key,
  id_user integer references users on delete cascade,
  id_cause integer references causes on delete cascade,
  timestamp_created timestamp default current_timestamp
);

CREATE TABLE opportunities_causes (
  id serial primary key,
  id_opportunity integer references opportunities on delete cascade,
  id_cause integer references causes on delete cascade,
  timestamp_created timestamp default current_timestamp
);

-- @@@@@@@@@@@ SKILLS @@@@@@@@@@@

CREATE TABLE skills (
  id serial primary key,
  skill text
);

CREATE TABLE users_skills (
  id serial primary key,
  id_user integer references users on delete cascade,
  id_skill integer references skills on delete cascade,
  timestamp_created timestamp default current_timestamp
);

-- @@@@@@@@@@@ ROLES & RESPONSES @@@@@@@@@@@

CREATE TABLE links (
  id serial primary key,
  id_user integer references users on delete cascade,
  link_type text,
  link_url text,
  timestamp_created timestamp default current_timestamp
);

CREATE TABLE roles (
  id serial primary key,
  -- org adds admin; org is user_adding, admin is user_receiving, role is admin
  -- indiv follows org; indiv is user adding; or is user receiving, role is following
  id_user_adding integer references users on delete cascade,
  id_user_receiving integer references users on delete cascade,
  -- capabilities: admin, following (limit admin to editing posts)
  -- look up format for array
  capabilities text,
  timestamp_created timestamp default current_timestamp
);

CREATE TABLE responses (
  id serial primary key,
  id_opportunity integer references opportunities on delete cascade,
  id_user integer references users on delete cascade,
  notes text,
  -- status pending, accepted, completed, deleted, denied
  response_status text default 'pending',
  -- timestamp_status_change = most recent status change
  timestamp_status_change timestamp,
  timestamp_created timestamp default current_timestamp
);

-- @@@@@@@@@@@ END CREATE TABLE, START INSERT INTO @@@@@@@@@@@

INSERT into users 
(username, user_type, location_city, location_state, first_name, last_name, organization) 
VALUES
('bobsmith', 'individual', 'Baltimore', 'MD', 'Bob', 'Smith', null), 
('suesmith', 'individual', 'Waldorf', 'MD', 'Sue', 'Smith', null), 
('capfoodbank', 'organization', 'Washington', 'DC', null, null, 'Capital Food Bank'),
('some', 'organization', 'Washington', 'DC', null, null, 'So Others May Eat (SOME)'),
('joejoe', 'individual', 'Altoona', 'PA', 'Joe', 'Josephson', null
);


INSERT into opportunities 
(opportunity_type, offer, title, narrative, timestamp_start, timestamp_end, location_city, location_state, id_user, link) 
VALUES
('goods', 'false', 'need baked goods', 'We need baked goods for a charity event.', '2018-02-14 18:30:00', '2018-02-14 20:30:00', 'Plano', 'TX', 3, null), 
('services', 'false', 'volunteers needed!', 'Reading to children after school, ongoing basis.', '2018-03-01 15:00:00', 'infinity', 'Athens', 'GA', 4, null), 
('financial', 'false', 'money to buy books', 'We want to raise $15,000,000 to buy a boatload of books! Then we will ship them to Georgia.', '2018-01-01 12:00:00', 'infinity', 'Providence', 'RA', 4, null), 
('services', 'true', 'I tutor math', 'I love algegra and trig and would gladly tutor students from 3:30 to 4:30 on weekdays.', '2018-02-01 15:30:00', '2018-12-31 16:30:00', 'Detroit', 'MI', 1, 'http://www.mrtutor.com'
);

INSERT into causes 
(cause) 
VALUES
('children'), ('homelessness'), ('hunger'), ('elderly'), ('education'), ('health'), ('environment'), ('community'), ('illiteracy'), ('social justice')
;

INSERT into skills 
(skill) 
VALUES
('listening'), ('tutoring'), ('administrative'), ('clerical'), ('medical services'), ('legal services'), ('manual labor'), ('meal preparation'), ('driving'), ('construction'), ('working with children'), ('working with adults'), ('working with elderly'), ('working with disabled'), ('working with animals')
;


INSERT into users_causes 
(id_user, id_cause)
VALUES
(1,2),(1,3),(2,4),(3,5),(3,7),(3,10),(4,9),(1,6);

INSERT into opportunities_causes
(id_opportunity, id_cause)
VALUES
(1,2),(1,3),(2,1),(2,5),(2,9),(3,1),(3,5),(3,9),(4,1),(4,5),(4,8);

INSERT into users_skills
(id_user, id_skill)
VALUES
(1,1),(1,2),(1,6),(2,7),(2,8),(2,13),(2,15);

INSERT into roles
(id_user_adding, id_user_receiving, capabilities)
VALUES
(3,1,'admin'),(5,3,'following'),(2, 4, 'following');

INSERT into links
(id_user, link_type, link_url)
VALUES
(1,null,'https://www.google.com'),(3,'homepage','http://bradgarner.com'),(4, 'financial', 'https://paypal.com');

INSERT into responses
(id_user, id_opportunity, response_status, timestamp_status_change)
VALUES
(5,4,'offered',null),(1,3,'offered',null),(2, 2, 'accepted', '2017-12-05 11:45:03');