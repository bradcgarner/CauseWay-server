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

 - syntax error at or near ".""