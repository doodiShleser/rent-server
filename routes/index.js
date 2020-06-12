var express = require('express');
var router = express.Router();
var axios =  require('axios');

const mysql = require('mysql');
const connection = mysql.createConnection({
    //mysql://b33e928f32b600:40652018@eu-cdbr-west-03.cleardb.net/heroku_78a2b252de1e833?reconnect=true
    host : 'doodi.c6a8wbut6cut.eu-west-1.rds.amazonaws.com',
    user : 'admin',
    password : '12345678',
    database : 'doodi_db'
  // host : 'localhost',
  // user : 'root',
  // password : '123456',
  // database : 'rentsure'
  });
  connection.connect();

  function hashCode (str){
    var hash = 0;
    if (str.length == 0) return hash;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);      
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}



var session = {
  id: "",
  sessionID: "",
  propertyID: "",
  agreementID: "",
  agreementURL: "",
};



var landlords = {
  id: "",
  first_name: "",
  last_name: "",
  idNumber: "",
  city: "",
  street: "",
  email: "",
  phone: "",
};

var propertyLandlords = {
  id: "",
  landlordID: "",
  propertyID: "",
};

var tenants = {
  id: "",
  first_name: "",
  last_name: "",
  id_number: "",
  city: "",
  street: "",
  phone: "",
  email: "",
};

var propertyTenants = {
  id: "",
  tenantID : "",
  propertyID: "",
};


const data = {
  "properties": {
    "landlordID": "",
    "id": "",
    "city": "",
    "street": "",
    "street_number" : "",
    "department_number": "",
    "rooms": "",
  },
  "agreements" : {
    "id": "",
    "entry_date": "",
    "end_date": "",
    "extra_time": "",
  },
  "pay_detailes" : {
    "id": "",
    "pay": "",
   "biling_date": "",
    "people": "",
    "other_extension": "nnnnnnnn"
},

  "collateral" : {
    "id": "",
    "security_check": "",
    "bank_guarantee": "",
    "security_deposit": "",
    "promissory_note" : "",
    "bank_cheque": "",
  },

  "about" : {
    "id": "",
    "detailes_in": "",
    "Faults14": "",
    "Faults": "",
  },

  "rules" : {
    "id": "",
    "pets": "",
    "paint": "",
    "parking": "",
    "warehouse": "",
},

"additions": {
  "id": "",
    "tma": "",
    "reduced": "",
    "tma_reduced": "",
    "insurance": "",
    "free_text": "",
},
};

router.post('/all',async function(req, res) {
  // assume its new one
  let curr_data = req.body;
  console.log(curr_data);
  let tbl = curr_data["name"];
  delete curr_data["name"];

  for(prop in curr_data)
  {    
    data[tbl][prop] = curr_data[prop];
  }
  res.send("succ");
});
 

router.post('/send',async function(req, res) {

  let email = req.body["user"];
  //console.log(email);
  
  let ID = hashCode(email);

  let OK = await new Promise(
    (resolve, reject) =>  connection.query(`UPDATE Counter SET value = value+1;`, (error) => {
      if (error) throw error;  
     resolve( true);
  }));
  if(!OK)
    res.send(OK);

  
  let nID = await new Promise(
    (resolve, reject) =>  connection.query(`SELECT * FROM Counter`, (error, result, fields) => {
      if (error) throw error;
      console.log("value" , Object.values(result[0])[0]);
      
      resolve( Object.values(result[0])[0]);
  }));

  
  for(tbl in data)
  {
    let postQuery = await new Promise(
      (resolve, reject) =>  connection.query(`SELECT * FROM ${tbl}`, (error, results, fields) => {
      
        // error will be an Error if one occurred during the query
      if (error) throw error;

      let types = [];
      for (let i in fields)
      {  
        let name = fields[i].name;   
        let type = fields[i].type;
        types.push({ [name] : type});
      }
      //console.log(tbl, 'types', types);
  
      //build the query
      let postQuery = `INSERT INTO ${tbl} VALUES(`;
      let i= 0;
      
      for(prop in data[tbl])
      {
        let name = Object.keys(types[i]);
        //console.log(prop);
        
        if (prop === "landlordID") 
          postQuery += `${ID},`;  
        else if(prop === "id")
          postQuery += `${nID},`;    
        else if (data[tbl][prop] === '')
          postQuery += `null,`;
        else if (types[i][name] === 253) //string
          postQuery += `"${data[tbl][prop]}",`;
        else if (types[i][name] === 10) //date
          postQuery += `DATE("${data[tbl][prop]}"),`;
        else 
          postQuery += `${data[tbl][prop]},`;
        
        i++;
      }
      postQuery = postQuery.slice(0, -1) + ')';
      resolve( postQuery);
      }));
    console.log(tbl,postQuery);

    connection.query( postQuery, (error, results) => {
      // error will be an Error if one occurred during the query
      if (error) throw error;
      // results will contain the results of the query
      //console.log("results", results);
      });
  }
  res.send();
});

router.post('/userExists',async function(req, res) {
  let {email} = req.body;
  console.log("email: " ,email);
  const existsQuery = `SELECT EXISTS(SELECT * from users WHERE email = "${email}")`;
    
  let exists = await new Promise( (resolve, reject) => 
                connection.query( existsQuery, (error, results) => {
    // error will be an Error if one occurred during the query
      if (error) throw error;

      //results will contain the results of the query
      resolve(Object.values(results[0])[0]);
  }));
    res.json({ Exists: exists });
});

router.post('/register',async function(req, res) {
  let {email,password} = req.body;
  console.log("email: " ,email);
  console.log("password: " ,password);
  id = hashCode(email);
  let insertQuery = `INSERT INTO users VALUES(${id},"${email}","${password}",null)`;
  //console.log(insertQuery);
  
  const result = connection.query( insertQuery, (error, results) => {
      // error will be an Error if one occurred during the query
        if (error) throw error;
        //results will contain the results of the query
        //console.log("results", results);
        //resolve(register);
      })
      //console.log(result);
      
      res.send({status: res.status});
  });


router.post('/login',async function(req, res) {
  let {Email,password} = req.body;
  console.log("email: " ,Email);
  console.log("password: " ,password);
  //const ID= hashCode(email);
  Query = `SELECT * from users WHERE email = Email;`  
  //(landlordID,city,street,street_number,department_number,rooms)
  // const result = connection.query( Query, (error, results) => {
  //     // error will be an Error if one occurred during the query
  //     if (error) throw error;
  //     //results will contain the results of the query
  //     console.log("results", results);
  //     //resolve(register);
  //   })
  //   console.log(res);
    
  //  res.json();
});




console.log('1'==1);

router.get('/:user', function(req, res, next) {
  let ID = hashCode(req.params['user']);
  console.log(req.params['user'], ID);
  
  connection.query(`SELECT * FROM  properties WHERE landlordID = ${ID}`, (error, results, fields) => {
    // error will be an Error if one occurred during the query
    if (error) throw error;
    // results will contain the results of the query
    res.json(results);
    console.log("results", results);
    // fields will contain information about the returned results fields (if any)
    //console.log("fields", fields);
    });
  
});











var dataArr = [];
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/users', function(req, res, next) {
  res.json(dataArr);
});

router.post('/users', function(req, res) {
  var data = req.body;
  console.log(data);
  dataArr.push(data);
  res.send("Dog added!");
});


module.exports = router;
