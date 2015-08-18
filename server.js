/*
Module dependencies
*/

var express = require("express")

, app = express()

, http = require("http").createServer(app)

, bodyParser = require("body-parser")

, io = require ("socket.io").listen(http)

, _=require('underscore')

, room = []; //this is the array of object to record room





/*Server config*/

//Server's IP address
app.set("ipaddr", "127.0.0.1");

//Server's port number
//app.set("port", process.env.PORT);

//Specify the views folder
app.set("views", __dirname + "/views");

//View engine is Jade
app.set("view engine", "jade");

//Specify where the static content is
app.use(express.static("public", __dirname + "/public"));

//Tells server to support JSON requests
app.use(bodyParser.json());

/* Server routing*/

//Handle route "GET/", as in "http://localhost:8080/"
app.get("/", function(req,res){
	res.render("index");
});


/*

//POST method to create a private chat message 
app.post("/message2", function(req,res){

	//The request body expects a param named "message"
	var message = req.body.message;
     
    //If the message is empty or wasn't sent it's a bad request
	if(_.isUndefined(message) || _.isEmpty(message.trim())){
		return res.json(400,{error:"Message is invalid"});
	}
    
    //We also expect the recievers's name with the message
	var rname = req.body.rname;

	//the sender's name
    var sname = req.body.sname;

    //find the socket of the sender
    var sid = _.findWhere(participants, {name:sname}).id;
    
     // the sender's socket 
    var ssok = _.findWhere(users, {id:sid}).socket;

    if(rname === sname){
    	ssok.emit("selftalk",{name:sname});
    	return;
    }

    //if the reciever's name is invalid
	
	if((_.findWhere(participants, {name:rname}))===undefined){

	//tell the client 
	ssok.emit("wrongName",{name:rname});

	}
    else{
    //find the socket of the reciever
    var rid = _.findWhere(participants, {name:rname}).id;
	
	var rsok = _.findWhere(users, {id:rid}).socket;


    //Let the reciever know the message
	rsok.emit("incomingMessage", {message: message, sname: sname, rname:rname, pri:1});
    //Let the sender know the message
	ssok.emit("incomingMessage", {message: message, sname: sname, rname:rname, pri:2});


	//let the client know
	res.json(200, {message: "Messgae recieved"});}
});

*/



io.on("connection", function(socket){

	/*
    When a new user connects to our server, we expect an event called "newUser"
    and then we'll emit an event called "newConnection" with a list of all 
    participants to all connected clients*/
	socket.on("newUser", function(data){

		//if(data.name!=undefined){
		//participants.push({id: data.id, name: data.name});
        //users.push({id:data.id, socket:socket});
		//io.sockets.emit("newConnection", {participants:participants});}

	});

    socket.on('updateSocket',function(data){
        console.log('user update of Room'+data.RoomNo+', user '+data.id);
        
        if(room[data.RoomNo-1]!=undefined && _.findWhere(room[data.RoomNo-1].users, {id:data.id})!=undefined ){
        _.findWhere(room[data.RoomNo-1].users, {id:data.id}).socket = socket;
        _.findWhere(room[data.RoomNo-1].users, {id:data.id}).sessionId = data.sessionId;

        if(_.findWhere(room[data.RoomNo-1].users, {id:data.id}).events!=undefined){
            if(_.findWhere(room[data.RoomNo-1].users, {id:data.id}).events.length>0){
            var event=_.findWhere(room[data.RoomNo-1].users, {id:data.id}).events[0];
            if(event.status==0){
               _.findWhere(room[data.RoomNo-1].users, {id:data.id}).socket.emit('startGame',{participants:event.participants, who:event.who});

            }
            else if(event.status==1){
                if(event.stage==4){
                    _.findWhere(room[data.RoomNo-1].users, {id:data.id}).socket.emit('nextStep',{stage:4, reciever:event.reciever, who:event.who, type:event.type});
                }
                else if(event.stage==5){
                    _.findWhere(room[data.RoomNo-1].users, {id:data.id}).socket.emit('nextStep',{stage:5, max:event.max, participants:event.participants});
                }
                else{
                    _.findWhere(room[data.RoomNo-1].users, {id:data.id}).socket.emit('nextStep',{stage:event.stage, reciever:event.reciever, participants:event.participants, who:event.who});
                }
            }
            _.findWhere(room[data.RoomNo-1].users, {id:data.id}).events.splice(0,1);

        }
    }

        if(data.who=='k'&& data.stage<room[data.RoomNo-1].stage[1].event.length){
            for(var i=data.stage;i<room[data.RoomNo-1].stage[1].event.length;i++){
                socket.emit('message',{type:1,sender:room[data.RoomNo-1].stage[1].event[i].sender, reciever:room[data.RoomNo-1].stage[1].event[i].reciever});
        }
    }
        else if(data.who=='p' &&data.stage<room[data.RoomNo-1].stage[0].event.length){
            for(var i=data.stage;i<room[data.RoomNo-1].stage[0].event.length;i++){
                socket.emit('message',{type:0,sender:room[data.RoomNo-1].stage[0].event[i].sender, reciever:room[data.RoomNo-1].stage[0].event[i].reciever});
        }
    }
    }

    })


    //Create a new room object and push the first user(admin)
	socket.on('newRoom',function(data){
        console.log(data.sessionId+"sent");
        var users = [];
        var participants=[];
        var k=0;
        //var recieved=0;

        while(room[k]!=null||room[k]!=undefined){
            k++;
        }
        var stage=[];
        var event1=[];
        var event2=[]; //be careful when passing array variable 
        //var event3=[];
        room[k]={id:k+1, number:data.number, admin:data.admin, users:users, participants:participants,stage:stage};//recieved should be added later
        room[k].stage.push({event:event1});
        room[k].stage.push({event:event2});
        //room[k].stage.push({event:event3});
        /*room[k].id=k+1
        room[k].number=data.number;
        room[k].admin=data.admin;
        room[k].users=users;
        room[k].participants=participants;*/
		//room.push({id:room.length, number: data.number, admin:data.admin, users:users, participants:participants});
		var msg=null; //there might be errors
        var events = [];
		room[k].users.push({sessionId:data.admin, socket:socket, id:1, msg:msg, events:events});
        //connection.push({sessionId:data.admin, roomNo:room.length, id:1});
	})

    //handle the room request and respond with the room number
	socket.on('Request',function(data){ //there might need modification 
        var k=0;
        while(room[k]!=null||room[k]!=undefined){
            k++;
        }
		socket.emit('Respond',{id:k+1}); 
	})
    //handle a player request, error message handling can be added later
	socket.on('join',function(data){
        console.log(data.sessionId+"sent");
        if(data.roomNo>room.length){

            socket.emit('Err',{type:1});

        }
        else if(room[data.roomNo-1].users.length==room[data.roomNo-1].number){

            socket.emit('Err',{type:2});
        }
        else{
		var i = data.roomNo-1;
		var msg=null;
		room[i].users.push({sessionId:data.player,socket:socket, id:room[i].users.length+1, msg:msg, events:events});
		room[i].users[room[i].users.length-1].socket.emit('joined',{id:room[i].users.length});


		//when all users are in, assign different roles to them, update properties in users[] and tell the players
        if(room[i].users.length==room[i].number){

             var kNo=0;

             var pNo=0;

             var p=room[i].number;

             var length = room[i].number;

             var k;

             if(room[i].number<8){
                k=1;
             }
             else if(room[i].number<11){
                k=2;
             }
             else if(room[i].number<15){
                k=3;
             }
             else{
                k=4;
             }

             p=2*k;

             	while(room[i].number-length<k){ 
             		var killer = Math.floor(Math.random()*length);
             		room[i].users[killer].who='k';
             		length--;
             		swap(room[i].users,killer,length);
             	}

             	while(room[i].number-length<p){
             		var police = Math.floor(Math.random()*length);
             		room[i].users[police].who='p';
             		length--;
             		swap(room[i].users, police, length);
             	}

             	for(var j=0; j<length; j++){
             		room[i].users[j].who='c';
             	}

            //participants should be sorted
            for(var j=0; j<room[i].number;j++){
                var vote = [];
                room[i].participants.push({id:room[i].users[j].id, who:room[i].users[j].who, vote:vote}); 
             }

            room[i].participants=_.sortBy(room[i].participants,'id');

             /*
             for(var j=1; j<room[i].number+1;j++){
                swap(room[i].participants,_.indexOf(room[i].participants, _.max(room[i].participants, function(data){
                    return data.idf;
                })),room[i].number.length-j);
             }*/

             for (var j=0; j<room[i].number;j++){
                room[i].participants[j].life=1;
             }

             for(var j=0; j<room[i].number; j++){
                if(room[i].users[j].socket==undefined){
                    room[i].users[j].events.push({status:0, participants:room[i].participants, who:room[i].users[j].who});
                }
                else{
             	room[i].users[j].socket.emit('startGame',{participants:room[i].participants, who:room[i].users[j].who});}
             }

             room[i].asked = 0; 
             room[i].voted=0;
             room[i].ppl=p;
             room[i].killer=k;
             room[i].police=k;
             room[i].citizen=room[i].number-room[i].ppl;

		}
	}})


    //handle feedback from polices & killers(emit inforamtion, check status)   
    socket.on('upStatus',function(data){
        console.log(data.sessionId+"sent");
    	var no = data.RoomNo-1; 
        //room[no].recieved=0;


    	if(_.findWhere(room[no].users, {id:data.sender}).who==='p'){
    		_.findWhere(room[no].users, {id:data.sender}).msg = data.reciever;
            var police = [];
    		for(var i=0;i<room[no].users.length;i++){
                if(room[no].users[i].who=='p' && room[no].users[i].socket!=undefined){
    			room[no].users[i].socket.emit('message',{type:0,sender:data.sender, reciever:data.reciever});
                police.push({index:i});};
    		}
            room[no].stage[0].event.push({type:0, sender:data.sender, reciever:data.reciever});

            var all=1;

            if(police.length>1){
            for (var i=1; i<police.length;i++){
                if(room[no].users[police[i-1].index].msg!=room[no].users[police[i].index].msg){
                    all=0;
                }
            }}

            if(all==1){
                var verify;
                console.log('verify'+data.reciever);
                if(_.findWhere(room[no].users, {id:data.reciever}).who=='k'){
                    verify=1;
                }
                else{
                    verify=0;
                }
                for(var i=0;i<room[no].users.length;i++){
                if(room[no].users[i].who=='p' && room[no].users[i].socket!=undefined){
                room[no].users[i].socket.emit('update',{type:0, reciever:data.reciever, verify:verify});
                room[no].users[i].msg=undefined;
            }}

            }

    	}

    	else if(_.findWhere(room[no].users, {id:data.sender}).who==='k'){
    		_.findWhere(room[no].users, {id:data.sender}).msg=data.reciever;
            var killer = [];
            for(var i=0;i<room[no].users.length;i++){
                if(room[no].users[i].who=='k'&& room[no].users[i].socket!=undefined){
                room[no].users[i].socket.emit('message',{type:1,sender:data.sender, reciever:data.reciever});
                killer.push({index:i});};
            }
            room[no].stage[1].event.push({type:1, sender:data.sender, reciever:data.reciever});



            var all=1;

            if(killer.length>1){

            for (var i=1; i<killer.length;i++){
                if(room[no].users[killer[i-1].index].msg!=room[no].users[killer[i].index].msg){
                    all=0;
                }
            }}

            if(all==1){
            for(var i=0;i<room[no].users.length;i++){
                if(room[no].users[i].who=='k'&& room[no].users[i].socket!=undefined){
                room[no].users[i].socket.emit('update',{type:1, reciever:data.reciever});
                room[no].users[i].msg=undefined;}}
                room[no].killed = data.reciever;
                room[no].victim = _.findWhere(room[no].users, {id:data.reciever}).who;
                _.findWhere(room[no].participants, {id:data.reciever}).life=0;
                console.log(room[no].killed+' is killed');
            }
        }

    	})
    
    //'kill' people and tell everyone the result(including condition checking)
    socket.on('noted',function(data){
        var type;
        console.log(data.sessionId+"sent");
        var no=data.RoomNo-1;
        room[no].asked++;
        console.log(room[no].asked +' asked');
        if(room[no].asked===room[no].ppl){
            room[no].stage[1].event.splice(0,room[no].stage[1].event.length);
            room[no].stage[0].event.splice(0,room[no].stage[0].event.length);

            if(room[no].victim=='p'){
                    room[no].police--;
                    room[no].ppl--;
                }
                else if(room[no].victim=='k'){
                    room[no].killer--;
                    room[no].ppl--;
                }
                else{
                    room[no].citizen--;
                }
            room[no].participants.splice(_.indexOf(room[no].participants, _.findWhere(room[no].participants,{id:room[no].killed})),1);
            console.log('k:'+room[no].killer);
            console.log('p:'+room[no].police);
            console.log('c:'+room[no].citizen);
            console.log('--------------');
            for(var j=0; j<room[no].users.length; j++){
                if(room[no].killer==0){
                if(room[no].users[j].socket==undefined){
                    room[no].users[j].events.push({status:1, stage:4, reciever:room[no].killed, who:room[no].victim, type:0});
                }
                else{
                room[no].users[j].socket.emit('nextStep',{stage:4, reciever:room[no].killed, who:room[no].victim, type:0});}}
                else if(room[no].police==0){
                 if(room[no].users[j].socket==undefined){
                    room[no].users[j].events.push({status:1, stage:4, reciever:room[no].killed, who:room[no].victim, type:1});
                }
                 else{
                    room[no].users[j].socket.emit('nextStep',{stage:4, reciever:room[no].killed, who:room[no].victim, type:1});}
                }
                else if(room[no].citizen==0){
                 if(room[no].users[j].socket==undefined){
                    room[no].users[j].events.push({status:1, stage:4, reciever:room[no].killed, who:room[no].victim, type:2});
                }
                else{
                    room[no].users[j].socket.emit('nextStep',{stage:4, reciever:room[no].killed, who:room[no].victim, type:2});
                }}
                else{
                if(room[no].users[j].socket==undefined){
                    room[no].users[j].events.push({status:1, stage:1, reciever:room[no].killed, who:room[no].victim, participants:room[no].participants});
                }
                else{
                    room[no].users[j].socket.emit('nextStep',{stage:1, reciever:room[no].killed, who:room[no].victim, participants:room[no].participants});
                    if(j<room[no].users.length-1){
                       room[no].participants[j].votes=0;
                       }
                }}
             }

            /*
            if(type==3){
                room[no].stage[2].event.push({stage:1,reciever:room[no].killed, who:room[no].victim, participants:room[no].participants});
            }
            else{
                room[no].stage[2].event.push({stage:4,reciever:room[no].killed, who:room[no].victim, type:type});          
            }*/
            //room[no].recieved=1;

            room[no].users.splice(_.indexOf(room[no].users, _.findWhere(room[no].users,{id:room[no].killed})),1);
            room[no].asked=0;

            if(room[no].killer==0||room[no].police==0||room[no].citizen==0){
                room[no]=null;
            }
        }
    })

    socket.on('newStatus',function(data){
        //room[data.RoomNo-1].recieved=0;
        console.log(data.sessionId+"sent");
        /*
        if(data.stage==1){
            no=data.RoomNo-1;
              for(var j=0; j<room[no].users.length; j++){
                room[no].users[j].socket.emit('nextStep',{stage:2, participants:room[no].participants});
                room[no].participants[j].vote=0;
             }
        }*/

        //this is the first vote
        if(data.stage==2){
            var type;
            no=data.RoomNo-1;
            room[no].voted++;
            if(data.reciever!=-1){
            _.findWhere(room[no].participants, {id:data.reciever}).vote.push({id:data.sender});
            _.findWhere(room[no].participants, {id:data.reciever}).votes++;}
            if(room[no].voted==room[no].participants.length){
                var max=[];
                var maximum=_.max(room[no].participants, function(data){
                    return data.votes;
                }).votes;
                if(maximum==0){
                for(var j=0;j<room[no].participants.length;j++){
                if(room[no].users[j].socket==undefined){
                    room[no].users[j].events.push({status:1, stage:3, reciever:-1, participants:room[no].participants, who:who});
                }
                else{
                    room[no].users[j].socket.emit('nextStep',{stage:3, reciever:-1, participants:room[no].participants, who:who});}
                    }
                room[no].voted=0;
                //room[no].stage[2].event.push({stage:3, reciever:-1, participants:room[no].participants, who:who});
                //room[no].recieved=1;
                }
                else{
                max.push(_.max(room[no].participants, function(data){
                    return data.votes;
                }).id);
                console.log(max[max.length-1]);
                var temp=_.without(room[no].participants,_.findWhere(room[no].participants, {id:max[0]}));
                m=_.max(temp, function(data){
                    return data.votes;
                }).votes;
                while(m==maximum){
                    max.push(_.max(temp, function(data){
                    return data.votes;
                }).id);
                    console.log(max[max.length-1]);
                    temp=_.without(temp,_.findWhere(room[no].participants, {id:max[max.length-1]}));
                    m=_.max(temp, function(data){
                    return data.votes;
                }).votes;
                }

                if(max.length>1){
                    console.log('there is a draw');
                    for(var j=0; j<room[no].users.length;j++){
                if(room[no].users[j].socket==undefined){
                    room[no].users[j].events.push({status:1, stage:5, max:max, participants:room[no].participants});
                }
                else{
                        room[no].users[j].socket.emit('nextStep',{stage:5, max:max, participants:room[no].participants});}
                    }
                    room[no].voted=0;
                    //room[no].stage[2].event.push({stage:5, max:max, participants:room[no].participants});
                    //room[no].recieved=1;
            for(var j=0; j<room[no].participants.length;j++){
                room[no].participants[j].votes=0;
                room[no].participants[j].vote.splice(0,room[no].participants[j].vote.length);
            }

                }
                else{
             var reciever=max[0];
             var who=_.findWhere(room[no].participants,{id:reciever}).who;
             _.findWhere(room[no].participants,{id:reciever}).life=0;
            //room[no].participants.splice(_.indexOf(room[no].participants, _.findWhere(room[no].participants,{id:reciever})),1);
            if(who=='p'){
                    room[no].police--;
                    room[no].ppl--;
                }
            else if(who=='k'){
                room[no].killer--;
                room[no].ppl--;
            }
            else{
                room[no].citizen--;
            }
             room[no].voted=0;


            for(var j=0; j<room[no].users.length; j++){
                if(room[no].killer==0){
                if(room[no].users[j].socket==undefined){
                    room[no].users[j].events.push({status:1, stage:4, reciever:reciever, who:who, type:0});
                }
                else{
                room[no].users[j].socket.emit('nextStep',{stage:4, reciever:reciever,who:who, type:0});}
            }
                else if(room[no].police==0){
            if(room[no].users[j].socket==undefined){
                    room[no].users[j].events.push({status:1, stage:4, reciever:reciever, who:who, type:1});
                }
                else{
                    room[no].users[j].socket.emit('nextStep',{stage:4, reciever:reciever, who:who, type:1});
                }}
                else if(room[no].citizen==0){
                if(room[no].users[j].socket==undefined){
                    room[no].users[j].events.push({status:1, stage:4, reciever:reciever, who:who, type:2});
                }
                else{
                    room[no].users[j].socket.emit('nextStep',{stage:4, reciever:reciever,who:who, type:2});
                }}
                else{
                if(room[no].users[j].socket==undefined){
                    room[no].users[j].events.push({status:1, stage:3, reciever:reciever, participants:room[no].participants, who:who});
                }
                else{
                room[no].users[j].socket.emit('nextStep',{stage:3, reciever:reciever, participants:room[no].participants, who:who});}}

             }

            for(var j=0; j<room[no].participants.length;j++){
                room[no].participants[j].votes=0;
                room[no].participants[j].vote.splice(0,room[no].participants[j].vote.length);
            }
            /*
            if(type==3){
                room[no].stage[2].event.push({stage:3,reciever:reciever, participants:room[no].participants, who:who});
            }
            else{
                room[no].stage[2].event.push({stage:4,reciever:reciever, who:who, type:type});
            }*/

            //room[no].recieved=1;

            console.log(reciever+' is out.');
            console.log('--------------');
            room[no].users.splice(_.indexOf(room[no].users, _.findWhere(room[no].users,{id:reciever})),1);
            room[no].participants.splice(_.indexOf(room[no].participants, _.findWhere(room[no].participants,{id:reciever})),1);

            if(room[no].killer==0||room[no].police==0||room[no].citizen==0){
                room[no]=null;
            }

         }
        }
        } //this is the end of the for (vote==votes) loop
    }

    //this is the second vote 
    else if(data.stage==3){
        var type;
        no=data.RoomNo-1;
        room[no].voted++;
        if(data.reciever!=-1){
        _.findWhere(room[no].participants, {id:data.reciever}).vote.push({id:data.sender});
        _.findWhere(room[no].participants, {id:data.reciever}).votes++;}

        if(room[no].voted==room[no].participants.length-data.max.length){
            var maximum=_.max(room[no].participants, function(data){
                    return data.votes;
                }).votes;
            var reciever=_.max(room[no].participants, function(data){
                    return data.votes;
                }).id;
            console.log('Player '+reciever+' recieved '+maximum+' votes');
            var temp=_.without(room[no].participants,_.findWhere(room[no].participants, {id:reciever}));
            var m=_.max(temp, function(data){
                    return data.votes;
                }).votes;
            var r=_.max(temp, function(data){
                    return data.votes;
                }).id;
            console.log('Player '+r+' recieved '+m+' votes');

                if(m==maximum||maximum==0){
                    for(var j=0;j<room[no].participants.length;j++){
                if(room[no].users[j].socket==undefined){
                    room[no].users[j].events.push({status:1, stage:3, reciever:-1, participants:room[no].participants, who:who});
                }
                else{
                        room[no].users[j].socket.emit('nextStep',{stage:3, reciever:-1, participants:room[no].participants, who:who});}
                    }
                room[no].voted=0;
                for(var j=0; j<room[no].participants.length;j++){
                room[no].participants[j].votes=0;
                room[no].participants[j].vote.splice(0,room[no].participants[j].vote.length);}
                //room[no].stage[2].event.push({stage:3, reciever:-1, participants:room[no].participants, who:who});
                //room[no].recieved=1;
                }
                else{
                    var reciever=_.max(room[no].participants, function(data){
                    return data.votes;
                }).id;
                    var who=_.findWhere(room[no].participants,{id:reciever}).who;
                    _.findWhere(room[no].participants,{id:reciever}).life=0;
            if(who=='p'){
                    room[no].police--;
                    room[no].ppl--;
                }
            else if(who=='k'){
                room[no].killer--;
                room[no].ppl--;
            }
            else{
                room[no].citizen--;
            }
            room[no].voted=0;

            for(var j=0; j<room[no].users.length; j++){
                if(room[no].killer==0){
                 if(room[no].users[j].socket==undefined){
                    room[no].users[j].events.push({status:1, stage:4, reciever:reciever, who:who, type:0});
                }
                else{
                room[no].users[j].socket.emit('nextStep',{stage:4, reciever:reciever, who:who, type:0});}}
                else if(room[no].police==0){
                if(room[no].users[j].socket==undefined){
                    room[no].users[j].events.push({status:1, stage:4, reciever:reciever, who:who, type:1});
                }
                else{
                    room[no].users[j].socket.emit('nextStep',{stage:4, reciever:reciever, who:who, type:1});
                }}
                else if(room[no].citizen==0){
                 if(room[no].users[j].socket==undefined){
                    room[no].users[j].events.push({status:1, stage:4, reciever:reciever, who:who, type:2});
                }
                else{
                    room[no].users[j].socket.emit('nextStep',{stage:4, reciever:reciever, who:who, type:2});
                }}
                else{
                 if(room[no].users[j].socket==undefined){
                    room[no].users[j].events.push({status:1, stage:6, reciever:reciever, who:who, participants:room[no].participants});
                }
                else{
                room[no].users[j].socket.emit('nextStep',{stage:6, reciever:reciever, participants:room[no].participants, who:who});}}

             }

            for(var j=0; j<room[no].participants.length;j++){
                room[no].participants[j].votes=0;
                room[no].participants[j].vote.splice(0,room[no].participants[j].vote.length);
            }
            
            /*
            if(type==3){
                room[no].stage[2].event.push({stage:6,reciever:reciever, participants:room[no].participants, who:who});
            }
            else{
                room[no].stage[2].event.push({stage:4,reciever:reciever, who:who, type:type});
            }*/

            //room[no].recieved=1;

            console.log(reciever+' is out.');
            console.log('--------------');
            room[no].users.splice(_.indexOf(room[no].users, _.findWhere(room[no].users,{id:reciever})),1);
            room[no].participants.splice(_.indexOf(room[no].participants, _.findWhere(room[no].participants,{id:reciever})),1);

            if(room[no].killer==0||room[no].police==0||room[no].citizen==0){
                room[no]=null;
            }


                }


        }


    }
})


socket.on('disconnect',function(){
if(room.length>0){
    for (var j=0; j<room.length;j++){
        if(room[j]!=null){
        if(room[j].users.length>0){
            for(var i=0; i<room[j].users.length;i++){
                if(room[j].users[i].socket==socket){
                    room[j].users[i].socket=undefined;
                    console.log('Room '+(j+1)+' user '+room[j].users[i].id+' disconnects');
                    break;
                }
            }
        }
    }}
}
})






/*
	socket.on("disconnect", function() {
    console.log('disconnection');
    var disconnect = _.findWhere(connection, _.findWhere(connection, {sessionId: socket.id}));
    room[disconnect.roomNo-1].users.splice(_.indexOf(room[disconnect.roomNo-1].users, _.findWhere(room[disconnect.roomNo-1].users,{id:disconnect.id})),1);
    room[disconnect.roomNo-1].participants.splice(_.indexOf(room[disconnect.roomNo-1].participants, _.findWhere(room[disconnect.roomNo-1].participants,{id:disconnect.id})),1);
    for(var j=0; j<room[disconnect.roomNo-1].length; j++){
        room[disconnect.roomNo-1].users.socket,emit('disconnect',{id:disconnect.id});
    }
    
    connection = _.without(connection,_.findWhere(connection, {sessionId: socket.id}));

    //users = _.without(users,_.findWhere(users,{id:socket.id}));
    //io.sockets.emit("userDisconnected", {id: socket.id, sender:"system"});
  });*/

});

var port = process.env.PORT||8080;

http.listen(port, function(){
	console.log("Server up and running. Go to http://" + app.get("ipaddr"))
});

function swap(array, i, j){
	var k;
	k=array[i];
	array[i]=array[j];
	array[j]=k;
}

