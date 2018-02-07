SELECT opportunities.id, opportunities.id_user, opportunities.opportunity_type, opportunities.offer, opportunities.title, opportunities.narrative, opportunities.timestamp_start, opportunities.timestamp_end, opportunities.location_city, opportunities.location_state, opportunities.location_country, opportunities.link, 

(SELECT causes.cause FROM causes WHERE causes.id =(SELECT causes.id FROM opportunities_causes JOIN causes ON opportunities_causes.id_cause = causes.id WHERE opportunities_causes.id_opportunity = opportunities.id ORDER by opportunities_causes.id_cause LIMIT 1 OFFSET 0)) as causes0, 

(SELECT causes.cause FROM causes WHERE causes.id =(SELECT causes.id FROM opportunities_causes JOIN causes ON opportunities_causes.id_cause = causes.id WHERE opportunities_causes.id_opportunity = opportunities.id ORDER by opportunities_causes.id_cause LIMIT 1 OFFSET 1)) as causes1,

(SELECT causes.cause FROM causes WHERE causes.id =(SELECT causes.id FROM opportunities_causes JOIN causes ON opportunities_causes.id_cause = causes.id WHERE opportunities_causes.id_opportunity = opportunities.id ORDER by opportunities_causes.id_cause LIMIT 1 OFFSET 2)) as causes2, 

(SELECT causes.cause FROM causes WHERE causes.id =(SELECT causes.id FROM opportunities_causes JOIN causes ON opportunities_causes.id_cause = causes.id WHERE opportunities_causes.id_opportunity = opportunities.id ORDER by opportunities_causes.id_cause LIMIT 1 OFFSET 3)) as causes3, 

(SELECT users.users.username FROM users WHERE users.id_user = opportunities.id LIMIT 1) as users.username, (SELECT users.users.user_type FROM users WHERE users.id_user = opportunities.id LIMIT 1) as users.user_type, 

(SELECT users.users.location_city as users_location_city FROM users WHERE users.id_user = opportunities.id LIMIT 1) as users.location_city as users_location_city, 

(SELECT users.users.location_state as users_location_state FROM users WHERE users.id_user = opportunities.id LIMIT 1) as users.location_state as users_location_state, 

(SELECT users.users.location_country as users_location_country FROM users WHERE users.id_user = opportunities.id LIMIT 1) as users.location_country as users_location_country, 

(SELECT users.users.bio FROM users WHERE users.id_user = opportunities.id LIMIT 1) as users.bio, 

(SELECT users.users.first_name FROM users WHERE users.id_user = opportunities.id LIMIT 1) as users.first_name, 

(SELECT users.users.last_name FROM users WHERE users.id_user = opportunities.id LIMIT 1) as users.last_name, 

(SELECT users.users.logo FROM users WHERE users.id_user = opportunities.id LIMIT 1) as users.logo, 

(SELECT users.users.organization FROM users WHERE users.id_user = opportunities.id LIMIT 1) as users.organization, 

(SELECT users.users.availability FROM users WHERE users.id_user = opportunities.id LIMIT 1) as users.availability FROM opportunities

/* @@@@@@@@@@@@@@@ */

error: SELECT opportunities.id, opportunities.id_user, opportunities.opportunity_type, opportunities.offer, opportunities.title, opportunities.narrative, opportunities.timestamp_start, opportunities.timestamp_end, opportunities.location_city, opportunities.location_state, opportunities.location_country, opportunities.link, (SELECT causes.cause FROM causes WHERE causes.id =(SELECT causes.id FROM opportunities_causes JOIN causes ON opportunities_causes.id_cause = causes.id WHERE opportunities_causes.id_opportunity = opportunities.id ORDER by opportunities_causes.id_cause LIMIT 1 OFFSET 0)) as causes0, (SELECT causes.cause FROM causes WHERE causes.id =(SELECT causes.id FROM opportunities_causes JOIN causes ON opportunities_causes.id_cause = causes.id WHERE opportunities_causes.id_opportunity = opportunities.id ORDER by opportunities_causes.id_cause LIMIT 1 OFFSET 1)) as causes1, (SELECT causes.cause FROM causes WHERE causes.id =(SELECT causes.id FROM opportunities_causes JOIN causes ON opportunities_causes.id_cause = causes.id WHERE opportunities_causes.id_opportunity = opportunities.id ORDER by opportunities_causes.id_cause LIMIT 1 OFFSET 2)) as causes2, (SELECT causes.cause FROM causes WHERE causes.id =(SELECT causes.id FROM opportunities_causes JOIN causes ON opportunities_causes.id_cause = causes.id WHERE opportunities_causes.id_opportunity = opportunities.id ORDER by opportunities_causes.id_cause LIMIT 1 OFFSET 3)) as causes3, (SELECT users.username FROM users WHERE opportunities.id_user = users.id LIMIT 1) as users.username, (SELECT users.user_type FROM users WHERE opportunities.id_user = users.id LIMIT 1) as users.user_type, (SELECT users.location_city as users_location_city FROM users WHERE opportunities.id_user = users.id LIMIT 1) as users_location_city, (SELECT users.location_state as users_location_state FROM users WHERE opportunities.id_user = users.id LIMIT 1) as users_location_state, (SELECT users.location_country as users_location_country FROM users WHERE opportunities.id_user = users.id LIMIT 1) as users_location_country, (SELECT users.bio FROM users WHERE opportunities.id_user = users.id LIMIT 1) as users.bio, (SELECT users.first_name FROM users WHERE opportunities.id_user = users.id LIMIT 1) as users.first_name, 

(SELECT users.last_name FROM users WHERE opportunities.id_user = users.id LIMIT 1) as users.last_name, 

(SELECT users.logo FROM users WHERE opportunities.id_user = users.id LIMIT 1) as users.logo, 

(SELECT users.organization FROM users WHERE opportunities.id_user = users.id LIMIT 1) as users.organization, 

(SELECT users.availability as users_availability FROM users WHERE opportunities.id_user = users.id LIMIT 1) as users_availability FROM opportunities

 - syntax error at or near "."

 /* @@@@@@@@@@@@@@@@@@ */

 SELECT users.id, users.timestamp_created, users.username, users.user_type, users.location_city, users.location_state, users.location_country, users.bio, users.first_name, users.last_name, users.logo, users.organization, users.availability, (SELECT links.link_type FROM links WHERE links.id_user = users.id ORDER by links.link_url LIMIT 1 OFFSET 0) as link_type0, (SELECT links.link_type FROM links WHERE links.id_user = users.id ORDER by links.link_url LIMIT 1 OFFSET 1) as link_type1, (SELECT links.link_type FROM links WHERE links.id_user = users.id ORDER by links.link_url LIMIT 1 OFFSET 2) as link_type2, (SELECT links.link_type FROM links WHERE links.id_user = users.id ORDER by links.link_url LIMIT 1 OFFSET 3) as link_type3, (SELECT links.link_url FROM links WHERE links.id_user = users.id ORDER by links.link_url LIMIT 1 OFFSET 0) as link_url0, (SELECT links.link_url FROM links WHERE links.id_user = users.id ORDER by links.link_url LIMIT 1 OFFSET 1) as link_url1, (SELECT links.link_url FROM links WHERE links.id_user = users.id ORDER by links.link_url LIMIT 1 OFFSET 2) as link_url2, (SELECT links.link_url FROM links WHERE links.id_user = users.id ORDER by links.link_url LIMIT 1 OFFSET 3) as link_url3, (SELECT causes.cause FROM causes WHERE causes.id =(SELECT causes.id FROM users_causes JOIN causes ON users_causes.id_cause = causes.id WHERE users_causes.id_user = users.id ORDER by users_causes.id_cause LIMIT 1 OFFSET 0)) as causes0, (SELECT causes.cause FROM causes WHERE causes.id =(SELECT causes.id FROM users_causes JOIN causes ON users_causes.id_cause = causes.id WHERE users_causes.id_user = users.id ORDER by users_causes.id_cause LIMIT 1 OFFSET 1)) as causes1, (SELECT causes.cause FROM causes WHERE causes.id =(SELECT causes.id FROM users_causes JOIN causes ON users_causes.id_cause = causes.id WHERE users_causes.id_user = users.id ORDER by users_causes.id_cause LIMIT 1 OFFSET 2)) as causes2, (SELECT causes.cause FROM causes WHERE causes.id =(SELECT causes.id FROM users_causes JOIN causes ON users_causes.id_cause = causes.id WHERE users_causes.id_user = users.id ORDER by users_causes.id_cause LIMIT 1 OFFSET 3)) as causes3, (SELECT skills.skill FROM skills WHERE skills.id =(SELECT skills.id FROM users_skills JOIN skills ON users_skills.id_skill = skills.id WHERE users_skills.id_user = users.id ORDER by users_skills.id_skill LIMIT 1 OFFSET 0)) as skills0, (SELECT skills.skill FROM skills WHERE skills.id =(SELECT skills.id FROM users_skills JOIN skills ON users_skills.id_skill = skills.id WHERE users_skills.id_user = users.id ORDER by users_skills.id_skill LIMIT 1 OFFSET 1)) as skills1, (SELECT skills.skill FROM skills WHERE skills.id =(SELECT skills.id FROM users_skills JOIN skills ON users_skills.id_skill = skills.id WHERE users_skills.id_user = users.id ORDER by users_skills.id_skill LIMIT 1 OFFSET 2)) as skills2, (SELECT skills.skill FROM skills WHERE skills.id =(SELECT skills.id FROM users_skills JOIN skills ON users_skills.id_skill = skills.id WHERE users_skills.id_user = users.id ORDER by users_skills.id_skill LIMIT 1 OFFSET 3)) as skills3 FROM users null WHERE (LOWER(username) LIKE LOWER('%wanda%')) OR (LOWER(first_name) LIKE LOWER('%wanda%')) OR (LOWER(last_name) LIKE LOWER('%wanda%')) OR (LOWER(organization) LIKE LOWER('%wanda%')) - syntax error at or near "null""