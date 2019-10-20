const express 		= require('express');
const axios			= require('axios');
var   AsyncPolling  = require('async-polling');
const exec  		= require('child_process').exec;
const request 		= require('request');
const app 			= express();

const instance_ip   = "54.205.107.127"  
var   request_count = 0
var   first_req 	= 1
var   container_url = ""
var   port_nos      = [8000,8001,8002,8003,8004,8005,8006,8007,8008,8009]  
var   index		    = 0
var   active_cnts	= 1

app.all("/api/*",function(req,res){
	request_count++;

	if(first_req == 1){
		setTimeout(function(){scaling_check.run()}, 120000);
		first_req = 0;
	}

	container_url ="http://localhost:"+port_nos[index].toString()+req.url;
	index = (index+1)%active_cnts;

	options = {
	            url: container_url,
	            method: req.method,
	            headers: {
	                'Accept': 'application/json',
	                'Accept-Charset': 'utf-8'
	            },
                body: JSON.stringify(res.body)
	}
	console.log(container_url);
	request(options,function(err,res2,body){
	if(res2.statusCode!=200){
        res.status(res2.statusCode).send({});
    }
    
    if(body==''){   
            res.json(JSON.parse('{}'));}
    else{   
            res.json(JSON.parse(body));
        }
    })
})

scaling_check = AsyncPolling(function(end) {
    
    console.log("scale check ");


	var req_cnts = parseInt(request_count/20)+1;

	if(req_cnts < active_cnts){

		for(var i=req_cnts; i<active_cnts; i++){
      		act_num = port_nos[i]%10;

      		cmd="sudo docker stop act"+act_num.toString()
        	console.log(cmd);
        	exec(cmd,function(error,stdout,stderr){
        		console.log(stdout)
        	})

        	cmd="sudo docker rm act"+act_num.toString()
        	console.log(cmd);
        	exec(cmd,function(error,stdout,stderr){
        		console.log(stdout)
        	})
    } 
    console.log('Removed containers '+req_cnts+'to '+active_cnts-1);
    active_cnts = req_cnts;		

	}
	else if( req_cnts > active_cnts){

		for(var i = active_cnts; i<req_cnts; i++){
		
		var act_num  = port_nos[i]%10;
		var port_num = port_nos[i];

		cmd="sudo docker run -d --name act"+act_num.toString()+ " -p "+port_num.toString()+":8000 -v myvol:/home/node/app/data acts"
		console.log(cmd);
		exec(cmd,function(error, stdout, stderr) {
	    	console.log(stdout)
  		});
	}
	console.log('Added containers'+active_cnts+'to'+req_cnts-1);
	active_cnts = req_cnts;

	}
	else{
		console.log("no scaling needed");
	}
      	
    request_count=0;
    end();

}, 120000);

AsyncPolling(function(end){
    console.log("health check")
    for(var i=0; i<active_cnts; i++){

    	container_url = "http://"+instance_ip+":"+port_nos[i].toString()+"/api/v1/_health"

    	axios.get(container_url).catch(function(error) { 
    		console.log("crash caught")
    		//console.log(error)
            var temp    = error.config.url
            var num     = temp.substr(temp.lastIndexOf(":")+1,4);
            num 		= parseInt(num) 
            var act_num = num%10
            var port_num= num   
            
            cmd="sudo docker stop act"+act_num.toString()
            console.log(cmd);
            exec(cmd,function(error,stdout,stderr){
                console.log(stdout)
            })
            
            cmd="sudo docker rm act"+act_num.toString()
            console.log(cmd);
            exec(cmd,function(error,stdout,stderr){
                console.log(stdout)
            })
            
            cmd="sudo docker run -d --name act"+act_num.toString()+ " -p "+port_num.toString()+":8000 -v myvol:/home/node/app/data acts"
            console.log(cmd);
            exec(cmd,function(error, stdout, stderr) {
            	console.log(stdout)
          	});
         })
    }
    end();
}, 1000).run();


app.all('/',function(request, response){
  response.status(200).send();
})

app.all('*', function(request, response){
  response.status(405).send();
})

app.listen(80);


