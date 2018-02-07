SELECT users.id, users.timestamp_created, users.username, users.user_type, users.location_city, users.location_state, users.location_country, users.bio, users.first_name, users.last_name, users.logo, users.organization, users.availability, 

(SELECT links.link_type FROMlinks WHERE links.id_user = users.id ORDER by links.link_url LIMIT 1 OFFSET 0) as links0, 

(SELECT links.link_type FROM links WHERE links.id_user = users.id ORDER by links.link_url LIMIT 1 OFFSET 1) as links1, 

(SELECT links.link_type FROM links WHERE links.id_user = users.id ORDER by links.link_url LIMIT 1 OFFSET 2) as links2, 

(SELECT links.link_type FROM links WHERE links.id_user = users.id ORDER by links.link_url LIMIT 1 OFFSET 3) as links3, 

(SELECT links.link_url FROM links WHERE links.id_user = users.id ORDER by links.link_url LIMIT 1 OFFSET 0) as links0, 

(SELECT links.link_url FROM links WHERE links.id_user = users.id ORDER by links.link_url LIMIT 1 OFFSET 1) as links1, 

(SELECT links.link_url FROM links WHERE links.id_user = users.id ORDER by links.link_url LIMIT 1 OFFSET 2) as links2, 

(SELECT links.link_url FROM links WHERE links.id_user = users.id ORDER by links.link_url LIMIT 1 OFFSET 3) as links3, 

(SELECT causes.cause FROM causes WHERE causes.id  = (SELECT causes.id FROM users_causes JOIN causes ON users_causes.id_cause = causes.id WHERE users_causes.id_user = users.id ORDER by users_causes.id_cause LIMIT 1 OFFSET 0)) as causes0, 

(SELECT causes.cause FROM causes WHERE causes.id  = (SELECT causes.id FROM users_causes JOIN causes ON users_causes.id_cause = causes.id WHERE users_causes.id_user = users.id ORDER by users_causes.id_cause LIMIT 1 OFFSET 1)) as causes1, 

(SELECT causes.cause FROM causes WHERE causes.id  = (SELECT causes.id FROM users_causes JOIN causes ON users_causes.id_cause = causes.id WHERE users_causes.id_user = users.id ORDER by users_causes.id_cause LIMIT 1 OFFSET 2)) as causes2, 

(SELECT causes.cause FROM causes WHERE causes.id  = (SELECT causes.id FROM users_causes JOIN causes ON users_causes.id_cause = causes.id WHERE users_causes.id_user = users.id ORDER by users_causes.id_cause LIMIT 1 OFFSET 3)) as causes3, 

(SELECT skills.skill FROM skills WHERE skills.id  = (SELECT skills.id FROM users_skills JOIN skills ON users_skills.id_skill = skills.id WHERE users_skills.id_user = users.id ORDER by users_skills.id_skill LIMIT 1 OFFSET 0)) as skills0, 

(SELECT skills.skill FROM skills WHERE skills.id  = (SELECT skills.id FROM users_skills JOIN skills ON users_skills.id_skill = skills.id WHERE users_skills.id_user = users.id ORDER by users_skills.id_skill LIMIT 1 OFFSET 1)) as skills1, 

(SELECT skills.skill FROM skills WHERE skills.id  = (SELECT skills.id FROM users_skills JOIN skills ON users_skills.id_skill = skills.id WHERE users_skills.id_user= users.id ORDER by users_skills.id_skill LIMIT 1 OFFSET 2)) as skills2, 

(SELECT skills.skill FROM skills WHERE skills.id  = (SELECT skills.id FROM users_skills JOIN skills ON users_skills.id_skill = skills.id WHERE users_skills.id_user = users.id ORDER by users_skills.id_skillLIMIT 1 OFFSET 3)) as skills3 FROM users