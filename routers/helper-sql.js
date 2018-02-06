'use strict';

const { keys } = require('./helper-keys');

const sql = {

  oneManyQuery3Tables (t1, f1, f12, t2, t3, f3, f32, f3get, offsetIndex, saveAs)  {
    const as = saveAs ? saveAs : t3 ;
    return `(SELECT ${t3}.${f3get} FROM ${t3} WHERE ${t3}.${f3} =(SELECT ${t3}.${f3} FROM ${t2} JOIN ${t3} ON ${t2}.${f32} = ${t3}.${f3} WHERE ${t2}.${f12} = ${t1}.${f1} ORDER by ${t2}.${f32} LIMIT 1 OFFSET ${offsetIndex})) as ${t3}${offsetIndex}`;
  },
  
  oneManyQuery2Tables (t1, f1, f12, t2, f2, f22, f2get, offsetIndex, saveAs)  {
    const as = saveAs ? saveAs : t2 ;
    return `(SELECT ${t2}.${f2get} FROM ${t2} WHERE ${t2}.${f12} = ${t1}.${f1} ORDER by ${t2}.${f22} LIMIT 1 OFFSET ${offsetIndex}) as ${t2}${offsetIndex}`;
  },
  
  oneManyQueryArray3Tables (t1, f1, f12, t2, t3, f3, f32, f3get, reps, saveAs)  {
    const queryArray = [];
    for (let i=0; i<reps; i++) {
      queryArray.push(this.oneManyQuery3Tables (t1, f1, f12, t2, t3, f3, f32, f3get, i, saveAs));
    }
    return queryArray;
  },
  
  oneManyQueryArray2Tables (t1, f1, f12, t2, f2, f22, f2get, reps, saveAs)  {
    const queryArray = [];
    for (let i=0; i<reps; i++) {
      queryArray.push(this.oneManyQuery2Tables (t1, f1, f12, t2, f2, f22, f2get, i, saveAs));
    }
    return queryArray;
  },
  
  oneManyQueryUsersToLinkUrl () {
    const t1    = 'users';
    const f1    = 'id';
    const f12   = 'id_user';
    const t2    = 'links';
    const f2    = 'id';
    const f22   = 'link_url';
    const f2get = 'link_url';
    const reps  = 4;
    const saveAs = f22;
    return this.oneManyQueryArray2Tables(t1, f1, f12, t2, f2, f22, f2get, reps, saveAs);
  },
    
  oneManyQueryUsersToLinkType () {
    const t1    = 'users';
    const f1    = 'id';
    const f12   = 'id_user';
    const t2    = 'links';
    const f2    = 'id';
    const f22   = 'link_url';
    const f2get = 'link_type';
    const reps  = 4;
    const saveAs = f22;
    return this.oneManyQueryArray2Tables(t1, f1, f12, t2, f2, f22, f2get, reps, saveAs);
  },
    
  oneManyQueryUsersToCauses () {
    const t1    = 'users';
    const f1    = 'id';
    const f12   = 'id_user';
    const t2    = 'users_causes'  ;
    const t3    = 'causes' ;
    const f3    = 'id'  ;
    const f32   = 'id_cause';
    const f3get = 'cause';
    const reps  = 4;
    return this.oneManyQueryArray3Tables(t1, f1, f12, t2, t3, f3, f32, f3get, reps);
  },
  
  oneManyQueryUsersToSkills () {
    const t1    = 'users';
    const f1    = 'id';
    const f12   = 'id_user';
    const t2    = 'users_skills'  ;
    const t3    = 'skills' ;
    const f3    = 'id'  ;
    const f32   = 'id_skill';
    const f3get = 'skill';
    const reps  = 4;
    return this.oneManyQueryArray3Tables(t1, f1, f12, t2, t3, f3, f32, f3get, reps);
  },
  
  usersListSelectStatement () {
    // output 'SELECT [all users field], (SELECT complex join) as x1, (SELECT complex join) as y1'
    const users =     keys.usersKeysRaw.map(key => `users.${key}`);
    const linksType = this.oneManyQueryUsersToLinkType();
    const linksUrl =  this.oneManyQueryUsersToLinkUrl();
    const causes =    this.oneManyQueryUsersToCauses();
    const skills =    this.oneManyQueryUsersToSkills();
    return `SELECT ${users.join(', ')}, ${linksType.join(', ')}, ${linksUrl.join(', ')}, ${causes.join(', ')}, ${skills.join(', ')}`;
  },
  
  rawFromQuery: function(queryObjectCC = {}, table, selectStatement ) {
    const select = selectStatement ? selectStatement : 'SELECT *' ;
    let rawSql = `${select} FROM ${table}`;
    if(Object.keys(queryObjectCC).length > 0) {
      const queryObject = this.convertCase(queryObjectCC, 'ccToSnake');
      const arrayOfQueries = Object.keys(queryObject).map( key => {
        return `LOWER(${key}) LIKE LOWER('%${queryObject[key]}%')`;
      });
      rawSql = arrayOfQueries.length > 1 ?
        `${select} FROM ${table} WHERE (${arrayOfQueries.join(') AND (')})`
        : `${select} FROM ${table} WHERE ${arrayOfQueries[0]}` ;
    }
    return rawSql;
  },

};

module.exports = { sql };

