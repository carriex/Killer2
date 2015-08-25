function init(){

 	var serverBaseUrl = document.domain;

	var socket = io.connect(serverBaseUrl);

	var sessionId = '';

	var round =0;

	var RoomNo;

	socket.on ('connect', function(){
		sessionId = socket.io.engine.id;
		console.log('Connected' + sessionId);
	});

	socket.on('Err',function(){
		$.notify('The room doesn\'t exist','error');
	})

	socket.on('success',function(){
		$('#title').append('<h3> Room '+RoomNo+'</h3>');
		$('#admin').remove();
	})

	socket.on('list',function(data){
		$('#list').children().remove();
		round=data.round;
		$('#list').append('<div><form action="">');
		for(var i=0; i<data.participants.length; i++){
			$('#list').append('<input type="radio" id="' + data.participants[i].id + 'selected'+round+'"><label for="' + data.participants[i].id + 'selected'+round+'">'+data.participants[i].id+'</label>');
	}
	     $('#list').append('<br><button id="confirm'+round+'">Disconnect</button></form></div>');
	     $('#confirm'+round).click({participants:data.participants},action);
	})

	socket.on('end',function(){
		$('#list').children().remove();
		$('#list').append('<p>The game has ended</p>');
	})

	function admin(event){

		RoomNo = $('#RoomNo').val();
	if(RoomNo<1||isNaN(RoomNo)){
      $.notify('Please enter a valid room No.','error');
    }
    else{
		socket.emit('admin',{sessionId:sessionId, RoomNo: RoomNo});
	}

	}

	function action(event){
		for(var i=0; i<event.data.participants.length;i++){
        if($('#'+event.data.participants[i].id +'selected'+round).is(':checked')){
          socket.emit('adminAction',{RoomNo:RoomNo, reciever:event.data.participants[i].id});
          //socket.emit('newStatus',{stage:2, reciever:event.data.participants[i].id, RoomNo:RoomNo});
        }
      }
	}


$('#confirm').on('click',admin);
}
$(document).on('ready', init);

