<h1>CAUSEWAY API</h1>
<p><em>This document provides general information on the Causeway app (formerly Non-Profit Match) and details on the api.  For more information about the Causeway client, please see <a href="https://github.com/brianjb-lfl/npmatch">Causeway front end</a>.</em></p>


Causeway
-------------
Causeway facilitates meaningful contributions to meaningful causes.  People WANT to make a difference, to do their part to make their neighborhood, community, world, better.  Individuals:  What many don't realize is that they already have talents, experiences, and/or disposable resources that could be put to use in this effort.  Causeway helps you find accessible opportunities to plug in.  Organizations:  Causeway also seeks to help caring organizations find impactful help.  It links them with the skills and resources that will make a real difference in their situation.

How it Works
------------
<table layout="fixed">
  <tr>
    <td width="55%">
      <p>placeholder</p>
    </td>
    <td width = "40%">
      <img src="/img/hands.jpg" max-height="200px" width="auto">
    </td>
  </tr>
  <tr>
    <td>
      <p>placeholder</p>
    </td>
    <td>
      <img src="/img/hands.jpg" max-height="200px" width="auto">
    </td>
  </tr>
  <tr>
    <td>
      <p>placeholder</p>
    </td>
    <td>
      <img src="/img/hands.jpg" max-height="200px" width="auto">
    </td>
  </tr>
  <tr>
    <td>
      <p>placeholder</p>
    </td>
    <td>
      <img src="/img/hands.jpg" max-height="200px" width="auto">
    </td>
  </tr>
</table>

Where to find Causeway
------

|          **desc**        |                   **location**                                          |
|--------------------------|-------------------------------------------------------------------------|
|live client               |   https://stoic-mccarthy-9c52cc.netlify.com/                            |
|client code               |   https://github.com/brianjb-lfl/npmatch                                |
|deployed api              |   https://dry-escarpment-60455.herokuapp.com/                           |
|api code                  |   https://github.com/brianjb-lfl/npm-server                             | 

Local API Use
------
1.  clone this repository<br>
``` git clone https://github.com/brianjb-lfl/npm-server```<br>

2.  move to the repository's local directory<br>
``` cd npm-server```<br>

3.  install dependencies<br>
``` npm install```<br>

4.  add a .env file to the project root *** NOTE: Make sure .env is included in the<br>
    package .gitignore file (also in the root).
```
    #Port
    PORT=8080

    #DB
    DATABASE_URL=
    TEST_DATABASE_URL=
    DB_MODE=dev

    #Cors
    CLIENT_ORIGIN=http://localhost:3000

    #jwt
    JWT_SECRET=
    JWT_EXPIRY=7d
```

note: use of this api requires access to a postgres database<br>

5.  if using a remote database instance (e.g. elephantSQL)<br>
    create a .env file in the repository root with the following line:<br>
``` DATABASE_URL=(database connection string/url)```<br>

6.  OR, you can use a local mongo database<br>
    when using a local database, omit the DATABASE_URL .env setting<br>
    in the config.js file, modify the second part of the following line accordingly<br>
``` process.env.DATABASE_URL || 'postgres://localhost:{port}/{dbname}'```<br>

7.  start the server<br>
``` npm start```<br>

The api can now be accessed at:  
```http://localhost:8080/```




Endpoints
------
Base url:  https://dry-escarpment-60455.herokuapp.com/

**api/auth**<br>
Login route
```    

```



**api/admin**<br>
Accessed on login to provide initial data load.
```

```



**api/users**<br>
Data retrieval and functionality related to individual and organization users.
```

```



**api/opportunities**<br>
Data retrieval and functionality related to opportunities to serve and be served.



**api/roles**<br>
Functionality to link organizations and their admin users.
Functionality to connect users to the organizations they want to follow.




**api/responses**<br>
Functionality to manage user responses to posted opportunities.




Technology Used
------
* javascript
* node.js
* express
* cors
* postgresql
* knex
* bcrypt
* passport
* mocha, chai

