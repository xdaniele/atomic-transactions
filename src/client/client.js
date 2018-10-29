var Peer = require('../peer/peer.js');
var io = require('socket.io-client');

function Client(privateKey){
    this.peer = new Peer(privateKey);
}

Client.prototype.connectToNode = function(url){
    this.peer.ConnectToNode(url);
}

Client.prototype.initTransaction = function(managerAddress,type,weiAmt,coinAmt){
    socket = io.connect(managerAddress, {reconnect: true});
    socket.on('MSG',function(message){
        console.log(message);
    })
    if(type == "WEI_TO_COIN"){
        this.weiToCoin(socket,weiAmt,coinAmt);
    }else if(type == "COIN_TO_WEI"){
        this.coinToWei(socket,coinAmt,weiAmt);
    }
}

Client.prototype.weiToCoin = function(socket,weiAmt,coinAmt){
    socket.emit('MSG', this.peer.account.address,{msg_type : "INIT",type: "WEI_TO_COIN",wei: weiAmt,coin: coinAmt});
    console.log("Requested WEI_TO_COIN transaction");
}

Client.prototype.coinToWei = function(socket,coinAmt,weiAmt){
    socket.emit('MSG', this.peer.account.address,{msg_type: "INIT",type : "COIN_TO_WEI",wei: weiAmt,coin: coinAmt});
    console.log("Requested COIN_TO_WEI transaction");
}


//Similar to manager parseMessage (a TODO)
//Message types: 

Client.prototype.parseMessage = function(msg,socket){
    
}



module.exports = Client;