'use strict';

const { keys } = require('./helper-keys');

const oneOneQuery2Tables = (t1, f1, f12, t2, f2, f2get, saveAs) => {
  const as = saveAs ? saveAs : t2 ;
  return `(SELECT ${t2}.${f2get} FROM ${t2} WHERE ${t1}.${f12} = ${t2}.${f2} LIMIT 1) as ${as}`;
};

const oneManyQuery2Tables = (t1, f1, f12, t2, f2, f2sort, f2get, offsetIndex, saveAs) => {
  const as = saveAs ? saveAs : t2 ;
  return `(SELECT ${t2}.${f2get} FROM ${t2} WHERE ${t2}.${f12} = ${t1}.${f1} ORDER by ${t2}.${f2sort} LIMIT 1 OFFSET ${offsetIndex}) as ${as}${offsetIndex}`;
};

const oneManyQuery3Tables = (t1, f1, f12, t2, t3, f3, f3sort, f3get, offsetIndex, saveAs) => {
  const as = saveAs ? saveAs : t3 ;
  return `(SELECT ${t3}.${f3get} FROM ${t3} WHERE ${t3}.${f3} =(SELECT ${t3}.${f3} FROM ${t2} JOIN ${t3} ON ${t2}.${f3sort} = ${t3}.${f3} WHERE ${t2}.${f12} = ${t1}.${f1} ORDER by ${t2}.${f3sort} LIMIT 1 OFFSET ${offsetIndex})) as ${as}${offsetIndex}`;
};

const oneManyQueryArray3Tables = (t1, f1, f12, t2, t3, f3, f3sort, f3get, reps, saveAs) => {
  const queryArray = [];
  for (let i=0; i<reps; i++) {
    queryArray.push(oneManyQuery3Tables (t1, f1, f12, t2, t3, f3, f3sort, f3get, i, saveAs));
  }
  return queryArray;
};
  
const oneManyQueryArray2Tables = (t1, f1, f12, t2, f2, f2sort, f2get, reps, saveAs) => {
  const queryArray = [];
  for (let i=0; i<reps; i++) {
    queryArray.push(oneManyQuery2Tables (t1, f1, f12, t2, f2, f2sort, f2get, i, saveAs));
  }
  // console.log('@ @ @ @ @ @ @ @',queryArray);
  return queryArray;
};

const oneOneQueryOppsToUsers = (key, saveItAs) => {
  const t1    = 'opportunities';
  const f1    = 'id';
  const f12   = 'id_user';
  const t2    = 'users';
  const f2    = 'id';
  const f2get = key;
  const saveAs= saveItAs || key;
  return oneOneQuery2Tables(t1, f1, f12, t2, f2, f2get, saveAs);
};

const oneManyQueryUsersToLinkUrl = () => {
  const t1    = 'users';
  const f1    = 'id';
  const f12   = 'id_user';
  const t2    = 'links';
  const f2    = 'id';
  const f2sort= 'link_url';
  const f2get = 'link_url';
  const reps  = 4;
  const saveAs= f2get;
  return oneManyQueryArray2Tables(t1, f1, f12, t2, f2, f2sort, f2get, reps, saveAs);
};
    
const oneManyQueryUsersToLinkType = () => {
  const t1    = 'users';
  const f1    = 'id';
  const f12   = 'id_user';
  const t2    = 'links';
  const f2    = 'id';
  const f2sort= 'link_url';
  const f2get = 'link_type';
  const reps  = 4;
  const saveAs = f2get;
  return oneManyQueryArray2Tables(t1, f1, f12, t2, f2, f2sort, f2get, reps, saveAs);
};

const oneManyQueryOppsToCauses = () => {
  const t1    = 'opportunities';
  const f1    = 'id';
  const f12   = 'id_opportunity';
  const t2    = 'opportunities_causes';
  const t3    = 'causes';
  const f3    = 'id';
  const f3sort= 'id_cause';
  const f3get = 'cause';
  const reps  = 4;
  return oneManyQueryArray3Tables(t1, f1, f12, t2, t3, f3, f3sort, f3get, reps);
};

const oneManyQueryUsersToCauses = () => {
  const t1    = 'users';
  const f1    = 'id';
  const f12   = 'id_user';
  const t2    = 'users_causes'  ;
  const t3    = 'causes' ;
  const f3    = 'id'  ;
  const f3sort= 'id_cause';
  const f3get = 'cause';
  const reps  = 4;
  return oneManyQueryArray3Tables(t1, f1, f12, t2, t3, f3, f3sort, f3get, reps);
};
  
const oneManyQueryUsersToSkills = () => {
  const t1    = 'users';
  const f1    = 'id';
  const f12   = 'id_user';
  const t2    = 'users_skills'  ;
  const t3    = 'skills' ;
  const f3    = 'id'  ;
  const f3sort= 'id_skill';
  const f3get = 'skill';
  const reps  = 4;
  return oneManyQueryArray3Tables(t1, f1, f12, t2, t3, f3, f3sort, f3get, reps);
};
  
const usersListSelectStatement = () => {
  // output 'SELECT [all users field], (SELECT complex join) as x1, (SELECT complex join) as y1'
  const users =     keys.usersKeysRaw.map(key => `users.${key}`);
  const linksType = oneManyQueryUsersToLinkType();
  const linksUrl =  oneManyQueryUsersToLinkUrl();
  const causes =    oneManyQueryUsersToCauses();
  const skills =    oneManyQueryUsersToSkills();
  return `SELECT ${users.join(', ')}, ${linksType.join(', ')}, ${linksUrl.join(', ')}, ${causes.join(', ')}, ${skills.join(', ')}`;
};

const oppsListSelectStatement = () => {
  // output 'SELECT [all opportunities field], (SELECT complex join) as x1, (SELECT complex join) as y1'
  const opps =     keys.opportunitiesKeysRawInsert.map(key => `opportunities.${key}`);
  const causes    = oneManyQueryOppsToCauses();
  const usersList = keys.usersKeysAppendToOpportunityRaw.map(key=>{
    const correctedKey = key.includes('.') ? key.slice(key.indexOf('.')+1,key.length) : key ;
    const saveAs = correctedKey.includes(' as ') ? correctedKey.slice(correctedKey.indexOf(' as ')+4,correctedKey.length) : correctedKey ;
    return oneOneQueryOppsToUsers(correctedKey, saveAs);
  });
  return `SELECT ${opps.join(', ')}, ${causes.join(', ')}, ${usersList.join(', ')}`;
};

module.exports = { usersListSelectStatement, oppsListSelectStatement };

