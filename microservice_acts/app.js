const express	=	require('express')
const path		= 	require('path')
const fs		= 	require('fs')
var bodyParser 	=	require('body-parser')
var sqlite3 	=	require('sqlite3').verbose()
const cors 		=	require('cors')
const crypto    =   require('crypto')
const sha1      =   require('sha1')
var isBase64 	= 	require('is-base64')
const request   =   require('request')
const axios     =   require('axios')
const app		=	express()
const portNo	=	8000

var request_count = 0;
var health_flag   = 1;

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



//list categories
app.get('/api/v1/categories',function(req,res,next){
	request_count++;
	console.log("list cat called")
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	var db = new sqlite3.Database('data/selfieLessActs.db');
	db.all("select * from categories",function(err,row,feilds){
		
		var o ={}
		
		if(row.length){
			for (var i = 0; i < row.length; i++) {	
			o[row[i].categoryName] = row[i].noOfActs
			} 
			console.log(o)
			res.status(200).json(o)			
		}
		else res.status(204).send()//{message:"No categories found"})
	})
	
	db.close();
	}
})

//add category  // tested on raw-json format list 
app.post('/api/v1/categories',function(req,res){
	request_count++;
	console.log("add cat called")
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	var db = new sqlite3.Database('data/selfieLessActs.db');
	//console.log(req.body)
	//for(var catName in req.body)
	//{
	catName = req.body[0]
	db.get("select * from categories where categoryName='"+catName+"'",function(err,row){
		if(!row){
			
				db.run("insert into categories values('"+catName+"',0)")
				res.status(201).send()//({category: req.body.categoryName})
			
		}
		else res.status(400).send()//({message:"Category already exists!"})
	})
	
	db.close();
	}
})

//remove a category
app.delete('/api/v1/categories/:categoryName',function(req,res){
	request_count++;
	console.log("remove cat called")
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	var db = new sqlite3.Database('data/selfieLessActs.db');
	db.get("select * from categories where categoryName='"+req.params.categoryName+"'",function(err,row){
		if(row){	
			db.run("delete from categories where categoryName='"+req.params.categoryName+"'")
			res.status(200).send()//({message:"Category deleted"})	
		}
		else {
			res.status(400).send()//({message:"Category does not exist!"})

		}
	})
	db.close();
	}
})

app.all('/api/v1/categories',function(req,res){
	request_count++;
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	res.status(405).send()//{message:"This method is not allowed!"})
	}
})
app.all('/api/v1/categories/:categoryName',function(req,res){
	request_count++;
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	res.status(405).send()//{message:"This method is not allowed!"})
	}
})

//add act
app.post('/api/v1/acts',function(req,res){
	request_count++;
	console.log("add act called")
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	var db = new sqlite3.Database('data/selfieLessActs.db');
	
	axios.get('http://3.88.194.146/api/v1/users',{
		headers: {
			'Origin':'http://54.205.107.127'
		}
	})
		.then(response => {
			console.log(response.data)
			var flag = 0;
			if(response.data){
			for(i = 0 ; i < response.data.length ; i++)
			{
				if(response.data[i] == req.body.username){
				//console.log(body[i])
				//console.log(req.body.username)
				flag=1;
				console.log(flag)
				}
			}
			}
		if(flag == 0){
			console.log("rejected")
			res.status(400).send()//{message:"Username doesn't exist"})
		
		}	

		})
		.catch(error => {
			console.log(error)
		})
	

	
	db.get("select * from acts where actId="+req.body.actId+"",function(err,row){
		//console.log(typeof(req.bodyactid))
		if(!row){
			//db.get("select * from users where username='"+req.body.username+"'",function(err,row){
				//if(row){
					db.get("select * from categories where categoryName='"+req.body.categoryName+"'",function(err,row){
						if(row){
							if(isBase64(req.body.imgB64) | isBase64(req.body.imgB64,{mime:true})){
								if(!req.body.upvotes){
									var reg = /((0[1-9])|([12]\d)|(3[01]))-((0[1-9])|(1[0-2]))-([12]\d{3}):(([0-5][0-9])-([0-5][0-9])-(([0-1][0-9])|(2[0-3])))/;
									reg.lastIndex=0
									var match = reg.exec(req.body.timestamp)
									console.log(req.body.timestamp)
									console.log(match)
									if(match){

										if(match[0]==req.body.timestamp){
											console.log("insert into acts values("+req.body.actId+",'"+req.body.username+"','"+req.body.timestamp+"','"+req.body.caption+"','"+req.body.categoryName+"',"+"0,'"+req.body.imgB64+"')");
											db.run("insert into acts values("+req.body.actId+",'"+req.body.username+"','"+req.body.timestamp+"','"+req.body.caption+"','"+req.body.categoryName+"',"+"0,'"+req.body.imgB64+"')");
											db.run("update categories set noOfActs = noOfActs + 1 where categoryName='"+req.query.categoryName+"'");
											res.status(200).send()	
										}
										else{
											res.status(400).send()//"incorrect timestamp")
										}
									}
									else
									{
										res.status(400).send()//"not timestamp format")
									}
									
								}
								else res.status(400).send()//{message:"no upvotes allowed"})

							}
							else res.status(400).send()//"image isn't in base64")
						}
						else
							res.status(400).send()//{message:"Category doesn't exist"})
					})
	
		}
		else res.status(400).send()//{message:"incorrect act number"})
	})
	
	db.close();
	}
})


// remove an act
app.delete('/api/v1/acts/:actId',function(req,res){
	request_count++;
	console.log("remove act called")
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	var db = new sqlite3.Database('data/selfieLessActs.db');
	console.log(req.params.actId);
	//res.status(200).send("Category meh")
	db.all("select * from acts where actid='"+req.params.actId+"'",function(err,row){
		console.log(row)
		if(row.length!=0)
		{
			db.run("update categories set noOfActs = noOfActs - 1 where categoryName='"+row['categoryName']+"'")

			db.run("delete from acts where actid='"+req.params.actId+"'")
			res.status(200).send()//({message:"Act deleted"})	
		}
		else res.status(400).send()//({message:"Act does not exist!"})
	})
	db.close();
	}
})

//List number of acts for a given category
app.get('/api/v1/categories/:categoryName/acts/size',function(req,res){
	request_count++;
	console.log("lis num of acts called")
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	var db = new sqlite3.Database('data/selfieLessActs.db');
	var param = req.params.categoryName;
	var list = []
	db.get("select * from categories where categoryName='"+param+"'",function(err,row){
		if(row){
			db.get("select count(*) as cnt from acts where categoryName='"+param+"'",function(err,row2){
				if(row2){
					console.log(row2["cnt"])
					list.push(row2["cnt"])
					res.status(200).send(list)
				}
			})
		}
		else res.status(204).send()//{message:"Category doesn't exist"})
	})
	db.close();
	}
})

app.all('/api/v1/categories/:categoryName/acts/size',function(req,res){
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	res.status(405).send()//{message:"This method is not allowed!"})
	}
})

//act in category in given range 
app.get('/api/v1/categories/:categoryName/acts',function(req,res){
	console.log("acts in range called")
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	var db = new sqlite3.Database('data/selfieLessActs.db');
	//console.log('hi')
	console.log(req.query)
	var flag = 0
	for( i in req.query){
		flag = 1
	}

	console.log(req.params)
	//res.status(200).send()

	if(flag == 0){
		console.log("list acts called")
	var param = req.params.categoryName;
	//console.log(req.params)
	db.get("select * from categories where categoryName='"+param+"'",function(err,row){
		console.log(row)
		if(row){
			db.get("select count(*) as length from acts where categoryName='"+param+"'",function(err,row2){
				if(row2['length']<100){
					db.all("select actId, username, timestamp, caption, upvotes, imgB64 from acts where categoryName='"+param+"' order by timestamp desc",function(err,row3){
						res.status(200).send(row3)
					})
				}
				else {
					res.status(413).send()//({message:"More than 100"})
				}
			})
		}
		else res.status(204).send()//({message:"Category doesn't exist"})
	})
	}
	else{
		console.log("list acts in range called")
		console.log(req.query.start)
		console.log(req.query.end)
		console.log(req.params.categoryName)
		if((req.query.end - req.query.start + 1)>=100){
			res.status(413).send({message:"Requested range greater than 100"})
		}
		else {
			db.get("select * from categories where categoryName='"+req.params.categoryName+"'",function(err,row){
			console.log(row)
			if(row){


				db.all("select * from acts where categoryName='"+req.params.categoryName+"' order by timestamp desc",function(err,row){
					console.log(row.slice(req.query.start-1,req.query.end))
					res.status(200).send(row.slice(req.query.start-1,req.query.end))
				})
	
			}
			else res.status(204).send()//{message:"Category doesn't exist"})
			})
		}
		
	}
	db.close();
	}
})
app.all('/api/v1/categories/:categoryName/acts',function(req,res){
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	res.status(405).send()//{message:"This method is not allowed!!"})
	}
})


//Upvote an act
//tested on raw-json list 
app.post('/api/v1/acts/upvote',function(req,res){
	request_count++;
	console.log("upvote called")
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	var db = new sqlite3.Database('data/selfieLessActs.db');
	console.log(req.body)
	var id = req.body[0]
	db.get("select * from acts where actid="+id+"",function(err,row){
		if(row){
			db.run('UPDATE acts SET upvotes = upvotes + 1 WHERE actid = '+id)
			res.status(200).send()//json({actid: id, msg:'Upvoted'})
		}
		else res.status(400).send()//({message:"Can't find act"})
	})
	db.close();
	}
})

app.all('/api/v1/acts/upvote',function(req,res){
	request_count++;
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	res.status(405).send()//{message:"This method is not allowed!"})
	}
})

app.get('/api/v1/_count',function(req,res){
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	var list = []
	list[0] = request_count;
	res.status(200).send(list)
	}
})

app.delete('/api/v1/_count',function(req,res){
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	request_count = 0;
	res.status(200).send() 
	}
})

app.all('/api/v1/_count',function(req,res){
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	request_count++;
	res.status(405).send()
	}
})

app.get('/api/v1/acts/count',function(req,res){
	request_count++;
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	var db = new sqlite3.Database('data/selfieLessActs.db');
	var list = []
	list[0]  = 0
	db.get("select count(*) as cnt from acts",function(err,row){
		if(row){
			//console.log(row["cnt"])
			
			list[0]  = row["cnt"]
			
		}
		res.status(200).send(list)
	})
	db.close();
	}
})

app.all('/api/v1/acts/:actId',function(req,res){
	request_count++;
	if(health_flag==0){
		res.status(500).send()
	}
	else{
	res.status(405).send()//{message:"This method is not allowed!"})
	}
})

app.get('/api/v1/_health', function(req,res){
	if(health_flag==1)
		res.status(200).send();
	else
		res.status(500).send();
})

app.post('/api/v1/_crash', function(req,res){
	health_flag=0;
	res.status(200).send();
})

app.get('*',function(req,res){
	res.status(404).send("This is not a valid path")
})


app.listen(portNo)
