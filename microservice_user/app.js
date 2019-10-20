const express	=	require('express')
const path		= 	require('path')
const fs		= 	require('fs')
var bodyParser 	=	require('body-parser')
var sqlite3 	=	require('sqlite3').verbose()
const cors 		=	require('cors')
const crypto    =   require('crypto')
const sha1      =   require('sha1')
var isBase64 	= 	require('is-base64')
const app		=	express()
const portNo	=	8080

var request_count = 0;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.static(path.join(__dirname, 'frontEnd')))
app.use(cors())
cors({credentials: true, origin: true})
app.all("/*",function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});



//add user
app.post('/api/v1/users',function(req,res){
	request_count++;
	var db = new sqlite3.Database('data/selfieLessActs.db');
	console.log(req.body)
	console.log(req.body.password)
	db.get("select * from users where username='"+req.body.username+"'",function(err,row){
		if(!row){			
			if(req.body.password.match(/[0-9a-fA-F]{40}/)){
				db.run("insert into users values('"+req.body.username+"', '"+req.body.password+"')")
				res.status(201).send()
			}
			else{
				res.status(400).send()//({message:"Password should be SHA1 hash hex format!"})
			}
		}
		else res.status(400).send()//({message:"Username is taken!"})
	})
	//res.status(200).send()
	db.close();
})

//list all users
app.get('/api/v1/users',function(req,res){
	//console.log(req.headers)
	request_count++;
	var db = new sqlite3.Database('data/selfieLessActs.db');
	db.all("select username from users",function(err,row){
		if(row.length){
			var list =[]
			for (var i = 0; i <row.length; i++) {
				list[i] = row[i]['username']
			}
			console.log(list)
			res.status(200).send(list)
		}
		else{
			res.status(204).send()//({message:"no users"})
		}
	})
	db.close();
})

//remove user
app.delete('/api/v1/users/:username',function(req,res){
	request_count++;
	var db = new sqlite3.Database('data/selfieLessActs.db');
	db.get("select * from users where username='"+req.params.username+"'",function(err,row){
		if(row){	
			db.run("delete from users where username='"+req.params.username+"'")
			res.status(200).send()//({user: req.params.username, message:"user deleted"})	
		}
		else res.status(400).send()//({message:"Username does not exist!"})
	})
	db.close();
})
app.all('/api/v1/users',function(req,res){
	request_count++;
	res.status(405).send()//{message:"This method is not allowed!"})
})
app.all('/api/v1/users/:username',function(req,res){
	request_count++;
	res.status(405).send()//{message:"This method is not allowed!"})
})


app.get('/api/v1/_count',function(req,res){
	var list = []
	list[0] = request_count;
	res.status(200).send(list)
})

app.delete('/api/v1/_count',function(req,res){
	request_count = 0;
	res.status(200).send() 
})

app.all('/api/v1/_count',function(req,res){
	
	res.status(405).send()
})

app.get('*',function(req,res){
	res.status(404).send("This is not a valid path")
})


app.listen(portNo)
