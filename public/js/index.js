
function init(){

 	var serverBaseUrl = document.domain;

	var socket = io.connect(serverBaseUrl);

	var sessionId = '';

  var who;

  var RoomNo;

  var playerId;
  
  var life=-1;

  var round=0;

  var voted=0;
  
  var stage=0;

  //var recieved=0;



	socket.on ('connect', function(){
		sessionId = socket.io.engine.id;
		console.log('Connected' + sessionId);
    
    if(life!=0 && RoomNo!=undefined){
      socket.emit('updateSocket',{id:playerId, RoomNo:RoomNo, sessionId:sessionId,who:who,stage:stage});
    }
	});

  socket.on('newConnection', function (data) {    
    updateParticipants(data.participants);
  });
  


  socket.on('disconnect', function (data) {
    socket.io.reconnect();
  });

  socket.on('Respond',function(data){
    $('#admin').prepend('<p>You are in Room No.'+data.id+'. </p><p>Please enter the number of players</p>');
    RoomNo=data.id;
    $('#admin').css('display','block');
  })

  socket.on('joined',function (data){
    $('#user').children().remove();
    $('#user').append('<p>You are player '+data.id+'.</p><p>Now waiting for other users to join</p>');
    playerId=data.id;
    $('#play').append('<h3>Player '+playerId+'</h3>');
    round=1;
  })

  socket.on('Err',function (data){
    if(data.type==1){
      $.notify("The Room No doesn't exit. Please enter a valid room no.","error");
    }
    else if(data.type==2){
      $.notify("The room is already full!","error");
    }
    else if(data.type==3){
      $.notify("The game has already started!","error");
    }
  })

  socket.on('Denied',function(data){
    if(data.type==0){
       $.notify("The Player No doesn't exit. Please enter a valid playerId.","error");
    }
    else if(data.type==1){
      $.notify("You can't join this room because you are dead or you are out.","error");
    }
    else if(data.type==2){
      $.notify("This player is already in the room.","error");
    }
  })

  socket.on('updated',function(data){
    who=data.who;
    life=1;
    playerId=data.id;
    round=data.round;
    console.log('current round: '+round);
    $('#user').remove();
    $('#admin').remove();
    $('#user2').remove();
    $('#play').css('display','block');
})



  socket.on('startGame',function(data){

    life=1;
    who=data.who;
    $('#user').remove();
    $('#admin').remove();
    $('#play').css('display','block');
    $('#play').append('<p id="initial">The killer game has started!</p>');
    if(data.who=='p'){
      $('#play').append('<p id="identity">You are the police.</p>');
    }
    else if(data.who=='k'){
       $('#play').append('<p id="identity">You are the killer.</p>')
    }
    else{
      $('#play').append('<p id="identity">You are the citizen.</p>')
    }

    startGame(data.participants);

  })

  socket.on('message',function(data){
    stage++;
    if(data.type==0){
      $('#choose').append('<p>Player '+data.sender+' chooses to verify Player '+data.reciever);
    }
    else if(data.type==1){
      $('#choose').append('<p>Player '+data.sender+' chooses to kill Player '+data.reciever);
    }
  })

  socket.on('update',function(data){
    stage=0;
    if(data.type==0){
      $('#choose').append('<p>Person to verify: Player '+data.reciever+'</p>');
      if(data.verify==0){
        $('#choose').append('<p>He is not the killer.</p>');
      }
      else{
        $('#choose').append('<p>He is the killer.</p>');
      }
    }

    if(data.type==1){
      $('#choose').append('<p>At the end, Player '+data.reciever+' is killed</p>');
    }

    setTimeout(function(){
        socket.emit('noted',{RoomNo:RoomNo,sessionId:sessionId});
    },5000);

  })

  //handle messages from the server and do the next step
  socket.on('nextStep', function(data){
     //recieved=0;
     if(data.stage==1){
      $('#choose').children().remove();
      $('#initial').remove();
      $('#identity').remove();
      $('#result').css('display','block');
      if(data.reciever==playerId){
        life=0;
        $('#result').append('<p>You are killed</p>'); //something should be added here
      }
      else{
     $('#result').append('<p>The night is over.</p><p>Player '+data.reciever+' was killed.</p>');
     $('#result').append('<p>So, who do you think is the killer</p>');
     $('#vote').css('display','block');
     $('#vote').append('<div><form action="">');
     for(var i=0; i<data.participants.length;i++){
        if(data.participants[i].id!=playerId){
        $('#vote').append('<input type="radio" name="vote" id="' + data.participants[i].id + 'voted'+round+'"><label for="' + data.participants[i].id + 'voted'+round+'">'+data.participants[i].id+'</label>');
        //$('#'+data.participants[i].id+'voted'+round).click({reciever:data.participants[i].id}, vote);
      }}
      $('#vote').append('<input type="radio" name="vote" id="notvoted'+round+'"><label for="notvoted'+round+'">Nobody</label>');
      $('#vote').append('<br><button id="subVote'+round+'">submit</button></form></div>');
      $('#subVote'+round).click({participants:data.participants},subVote);
      if(data.voted==1){
         $('#subVote'+round).attr('disabled',true);
      }

     /*if(sessionId==data.admin){
      $('#result').append('<button id="discuss'+round+'">End the discussion</button>');
      $('#discuss'+round).click(endDiscuss);
     }*/
   }
    }
    /*else if(data.stage==2){
    $('#result').children().remove();
    $('#result').css('display','none');
    $('#vote').css('display','block');
    $('#vote').append('<p>Who do you think is the killer?</p>');
    for(var i=0; i<data.participants.length;i++){
        if(data.participants[i].id!=playerId){
        $('#vote').append('<button id="' + data.participants[i].id + 'voted'+round+'">' + data.participants[i].id+'</button>');
        $('#'+data.participants[i].id+'voted'+round).click({reciever:data.participants[i].id}, vote);
      }}

    }*/
    else if(data.stage==3){
    round=data.round;
    console.log('Round '+round);
    voted=0;
    $('#result').children().remove();
    $('#result').css('display','none');
      $('#vote').children().remove();
       $('#vote').css('display','none');
       $('#end').css('display','block');
       
      //To show the voting result
      for(var i=0; i<data.participants.length;i++){
        if(data.participants[i].vote.length>0){
          $('#end').append('<p>Player '+data.participants[i].id+' is voted by:</p>');
          for(var j=0; j<data.participants[i].vote.length;j++){
            $('#end').append('<p>Player'+data.participants[i].vote[j].id+'</p>');
          }
          $('#end').append('<p>----------------------------</p>');
        }
       }

      if(data.reciever==-1){
        $('#end').append('<p>Nobody is out.</p>');
        $('#end').append('<button id="start'+round+'"">OK</button>');
        startGame(data.participants);
        $('#start'+round).click({participants:data.participants},startGame1);
      }

      else{

      if(playerId==data.reciever){
        life=0;
         $('#end').append('<p>Sorry, you are out.</p>');
      }
      else{
        $('#end').css('display','block');
      $('#end').append('<p>Player '+data.reciever+' is out</p>');
      /*if(data.who=='k'){
      $('#end').append('<p>He is a killer.</p>');}
      else if(data.who=='p'){
        $('#end').append('<p>He is a police.</p>');
      }
      else{
        $('#end').css('display','block');
        $('#end').append('<p>He is a citizen.</p>');
      }*/
      $('#end').append('<button id="start'+round+'"">OK</button>');
      startGame(data.participants);
      $('#start'+round).click({participants:data.participants},startGame1);}
    }
    }
    else if(data.stage==4){
    life=0;
    $('#result').children().remove();
    $('#result').css('display','none');
      $('#result').children().remove();
      $('#result').css('display','none');
      console.log('end');
      $('#vote').children().remove();
      $('#vote').css('display','none');
      $('#end').css('display','block');
      if(playerId==data.reciever){
        life=0;
         $('#end').append('<p>Sorry, you are out.</p>');
      }
      else{
      $('#end').append('<p>Player '+data.reciever+' is out</p>');}
      /*if(data.who=='k'){
      $('#end').append('<p>He is a killer.</p>');}
      else if(data.who=='p'){
        $('#end').append('<p>He is a police.</p>');
      }
      else{
        $('#end').append('<p>He is a citizen.</p>');
      }*/

      if(data.type==0){
        $('#end').append('<h3>Game over: all killers are out.</h3>');
      }
      else if(data.type==1){
        $('#end').append('<h3>Game over: all polices are out.</h3>');
      }
      else{
        $('#end').append('<h3>Game over: all citizens are out.</h3>');
      }

    }
    else if(data.stage==5){
      voted=0;
      console.log('yes');
      $('#result').children().remove();
      $('#result').css('display','none');
      $('#vote').children().remove();
      $('#vote').css('display','none');
      $('#end').css('display','block');
            for(var i=0; i<data.participants.length;i++){
        if(data.participants[i].vote.length>0){
          $('#end').append('<p>Player '+data.participants[i].id+' is voted by:</p>');
          for(var j=0; j<data.participants[i].vote.length;j++){
            $('#end').append('<p>Player'+data.participants[i].vote[j].id+'</p>');
          }
          $('#end').append('<p>----------------------------</p>');
        }
       }
       $('#end').append('<p>Please vote again:</p>');

     $('#end').append('<div><form action="">');
     var test=0;

     for(var j=0;j<data.max.length;j++){
      if(playerId==data.max[j]){
        test=1;
      }
     }

     if(test==1){
      $('#end').append('<p>Other users are voting...</p>');
     }
     else{
     for(var i=0; i<data.max.length;i++){
        $('#end').append('<input type="radio" name="vote" id="' + data.max[i] + 'voted2'+round+'"><label for="' + data.max[i] + 'voted2'+round+'">'+data.max[i]+'</label>');
        //$('#'+data.participants[i].id+'voted'+round).click({reciever:data.participants[i].id}, vote);
      }
      $('#end').append('<input type="radio" name="vote" id="notvoted2'+round+'"><label for="notvoted2'+round+'">Nobody</label>');
      $('#end').append('<br><button id="subVote2'+round+'">submit</button></form></div>');
      $('#subVote2'+round).click({max:data.max},subVote2);}
      if(data.voted==1){
         $('#subVote2'+round).attr('disabled',true);
      }


    }

    else if(data.stage==6){
      round=data.round;
      console.log('Round '+round);
      voted=0;
      $('#end').children().remove();
      for(var i=0; i<data.participants.length;i++){
        if(data.participants[i].vote.length>0){
          $('#end').append('<p>Player '+data.participants[i].id+' is voted by:</p>');
          for(var j=0; j<data.participants[i].vote.length;j++){
            $('#end').append('<p>Player'+data.participants[i].vote[j].id+'</p>');
          }
          $('#end').append('<p>----------------------------</p>');
        }
       }
      if(playerId==data.reciever){
        life=0;
         $('#end').append('<p>Sorry, you are out.</p>');
      }
      else{
        $('#end').css('display','block');
      $('#end').append('<p>Player '+data.reciever+' is out</p>');
      /*if(data.who=='k'){
      $('#end').append('<p>He is a killer.</p>');}
      else if(data.who=='p'){
        $('#end').append('<p>He is a police.</p>');
      }
      else{
        $('#end').css('display','block');
        $('#end').append('<p>He is a citizen.</p>');
      }*/
      $('#end').append('<button id="start'+round+'"">OK</button>');
      startGame(data.participants);
      $('#start'+round).click({participants:data.participants},startGame1);}


    }
  })

  //The admin requests for a new room
  function create(){ 
    socket.emit('Request',{id:sessionId});
    $('#home').css('display','none');
  }

  function join(){
    $('#home').css('display','none');
    $('#user').css('display','block');
  }

  function rejoin(){
    $('#home').css('display','none');
    $('#user2').css('display','block');
  }
  
  //request to join a room
  function joinGame(){
    RoomNo = $('#roomNo').val();
    if(RoomNo<1||isNaN(RoomNo)){
      $.notify('Please enter a valid room No.','error');
    }
    else{
    socket.emit('join',{player:sessionId, roomNo:RoomNo,sessionId:sessionId});}
  }

  function rejoinGame(){
    RoomNo=$('#roomNo2').val();
    playerId=$('#playerId').val();
    if(RoomNo<1||isNaN(RoomNo)){
      $.notify('Please enter a valid room No.','error');
    }
    else if(playerId<1||isNaN(playerId)){
     $.notify('Please enter a valid PlayerId','error');
    }
    else{
    $('#play').append('<h3>Player '+playerId+'</h3>');
    socket.emit('updateSocket2',{id:playerId, RoomNo:RoomNo});}

  }
  
  //Tell server the number of players in the game
  function createRoom(){
    var number = Number($('#number').val());
    //console.log(typeof number);
    if(number<1||isNaN(number)){
      $.notify('Please enter a valid number','error');
    }else{
    $('#admin').children().remove();
    socket.emit('newRoom',{admin:sessionId, number:number,sessionId:sessionId});
    $('#admin').append('<p style="text-align:center">You are Player 1(admin) of Room'+ RoomNo+'. Now waiting for other users to join.</p>');
    playerId=1;
    $('#play').append('<h3>Player '+playerId+'</h3>');
    round=1;
}
  }

  function startGame(participants){

    //recieved=1;
    //console.log('Round '+round);
    if(round==1){
    $('#end').children().remove();
    $('#choose').css('display','block');}
    else{
      $('#choose').css('display','none');
    }
    $('#choose').append('<p>The night has come...</p>');
    if(who=='p'){
      $('#choose').append('<p>Polices in this game:');
      for(var i=0;i<participants.length;i++){
        if(participants[i].who=='p'&& participants[i].life==1){
          $('#choose').append('<p>Player '+participants[i].id+';');
        }

      }
      $('#choose').append('</p>');

      $('#choose').append('<p>Please select someone to verify. You can modify your choice before achieving agreement with other polices.</p>');
      $('#choose').append('<div><form action="">');
          for(var i=0; i<participants.length;i++){
        if(participants[i].who!='p'&& participants[i].life==1){     //sequence of display need to be solved
        $('#choose').append('<input type="radio" name="killer" id="' + participants[i].id + 'selected'+round+'"><label for="' + participants[i].id + 'selected'+round+'">'+participants[i].id+'</label>');
        //$('#'+participants[i].id+'selected'+round).click({sender:playerId, reciever:participants[i].id}, action);
        } //modification needed here...
    }
        $('#choose').append('<br><button id="verify'+round+'">Submit</button></form></div>');
        $('#verify'+round).click({participants:participants, sender:playerId},action);
    }
    else if(who=='k'){
      $('#choose').append('<p>Killers in this game:');
      for(var i=0;i<participants.length;i++){
        if(participants[i].who=='k'&& participants[i].life==1){
          $('#choose').append('<p>Player '+participants[i].id+';');
        }

      }
      $('#choose').append('</p>');
      $('#choose').append('<p>Please select someone to kill. You can modify your choice before achieving agreement with other killers.</p>');
      $('#choose').append('<div><form action="">');
          for(var i=0; i<participants.length;i++){
        if(participants[i].who!='k'&& participants[i].life==1){     //sequence of display need to be solved
        $('#choose').append('<input type="radio" name="killer" id="' + participants[i].id + 'selected'+round+'"><label for="' + participants[i].id + 'selected'+round+'">'+participants[i].id+'</label>');
        //$('#'+participants[i].id+'selected'+round).click({sender:playerId, reciever:participants[i].id}, action);
        } //modification needed here...
    }
        $('#choose').append('<br><button id="verify'+round+'">Submit</button></form></div>');
        $('#verify'+round).click({participants:participants, sender:playerId},action);
    }

    }

    function startGame1(event){

    //recieved=1;

    $('#end').children().remove();
    $('#choose').css('display','block');
    

    }

  function action(event){
    for(var i=0; i<event.data.participants.length;i++){
        if($('#'+event.data.participants[i].id +'selected'+round).is(':checked')){
          socket.emit('upStatus',{RoomNo:RoomNo, sender:event.data.sender, reciever:event.data.participants[i].id, sessionId:sessionId});
          //socket.emit('newStatus',{stage:2, reciever:event.data.participants[i].id, RoomNo:RoomNo});
        }
      }
    //socket.emit('upStatus',{RoomNo:RoomNo, sender:event.data.sender, reciever:event.data.reciever});

  }
  
  /*function vote(event){
    socket.emit('newStatus',{stage:2, reciever:event.data.reciever, RoomNo:RoomNo});
    console.log('voted');
  }*/

  function subVote(event){
    if(voted==1){
      $.notify("You can't vote more than once.","warn");
    }
    else{
     for(var i=0; i<event.data.participants.length;i++){
        if($('#'+event.data.participants[i].id +'voted'+round).is(':checked')){
          voted=1;
          socket.emit('newStatus',{stage:2, reciever:event.data.participants[i].id, sender:playerId, RoomNo:RoomNo, sessionId:sessionId});
          //recieved=0;
          $.notify("You have submitted your vote.","success");
        }
      }
      if($('#notvoted'+round).is(':checked')){
        voted=1;
        socket.emit('newStatus',{stage:2, reciever:-1, sender:playerId, RoomNo:RoomNo,sessionId:sessionId});
        //recieved=0;
        $.notify("You have submitted your vote.","success");
      }
    }
    $('#subVote'+round).attr('disabled',true);
  }

  function subVote2(event){
    if(voted==1){
      $.notify("You can't vote more than once.","warn");
    }
      else{
     for(var i=0; i<event.data.max.length;i++){
        if($('#'+event.data.max[i] +'voted2'+round).is(':checked')){
          voted=1;
          socket.emit('newStatus',{stage:3, reciever:event.data.max[i], sender:playerId, RoomNo:RoomNo, max:event.data.max, sessionId:sessionId});
          //recieved=0;
          $.notify("You have submitted your vote.","success");
        }
      }
      if($('#notvoted2'+round).is(':checked')){
        voted=1;
        socket.emit('newStatus',{stage:3, reciever:-1, sender:playerId, RoomNo:RoomNo,max:event.data.max, sessionId:sessionId});
        //recieved=0;
        $.notify("You have submitted your vote.","success");
      }
    }
    $('#subVote2'+round).attr('disabled', true);

  }


  /*
  function endDiscuss(event){
    socket.emit('newStatus',{stage:1, RoomNo:RoomNo});
    $('#discuss'+round).remove();
  }*/


$('#create').on('click',create);
$('#acon').on('click',createRoom);
$('#join').on('click',join);
$('#jgame').on('click',joinGame);
$('#return').on('click', rejoin);
$('#jgame2').on('click',rejoinGame);
}

$(document).on('ready', init);