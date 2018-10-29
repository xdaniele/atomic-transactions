var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var Peer = require("../peer/peer");


//Message types: INIT ,ABORT

function Manager(privateKey,chatPort){
    this.peer = new Peer(privateKey);
    this.users = new Map();
    this.weiToCoinTx = new Array();
    this.coinToWeiTx = new Array();
    let manager = this;
    io.on('connection', function (socket){

       socket.on('MSG', function (from, msg) {
        //console.log(msg);
        manager.parseMessage(from,msg,socket);
       });

     });
     
     http.listen(chatPort, function () {
       console.log(`listening on *:${chatPort}`);
     });
}

Manager.prototype.connectToNode = function(url){
    if(this.peer === undefined){
        console.log("Must create a manager first!");
    }else{
        this.peer.ConnectToNode(url);
    }
}

Manager.prototype.listUsers = function(){
    if(this.users.length === 0){
        console.log("Empty users list")
    }else{
        console.log("Users:");
        for (var [address, value] of this.users) {
            console.log(address);
        }
    }
}

Manager.prototype.addUser = function(publicAddress,socket){
    this.users.set(publicAddress,socket);
}

//MSG types: INIT,POOL_HASHES,POOL_SECRETS

Manager.prototype.parseMessage = function(from,msg,socket){
    if(msg.msg_type == "INIT"){
        manager.initTransaction(from,socket,msg);
    }
}


Manager.prototype.initTransaction = function(from,socket,data){
    this.addUser(from,socket);
    console.log(`Added user: ${from}`);
    let type = data.type;
    let wei = data.wei;
    let coin = data.coin;
    if(type === "WEI_TO_COIN"){
        console.log("User starting WEI_TO_COIN transaction")
        this.weiToCoinTx.push({wei: wei,coin: coin,user : from});
        otherUser = this.findCoinToWeiMatch(wei,coin);
    }else if(type === "COIN_TO_WEI"){
        this.coinToWeiTx.push({wei: wei,coin: coin,user: from});
        console.log("User starting COIN_TO_WEI transaction")
        otherUser = this.findWeiToCoinMatch(wei,coin);
    }else{
        console.log("Invalid msg type!");
    }
}

Manager.prototype.getClientHashes = function(userA,userB){
    userASocket = this.users.get(userA);
    userBSocket = this.users.get(userB);
    userASocket.emit('MSG',this.peer.account.address,{type: "SECRET_HASH"})
    userBSocket.emit('MSG',this.peer.account.address,{type: "SECRET_HASH"})
}

//Searches for weiToCoin transaction proposed by some client (sloppy right now)

Manager.prototype.findWeiToCoinMatch = function(wei,coin){
    for(var data of this.weiToCoinTx){
        if(data.wei === wei && data.coin == coin){
            console.log("Found a match!");
            return data.user;
        }
    }
    return null;
}

Manager.prototype.findCoinToWeiMatch = function(coin,wei){
    for(var data of this.coinToWeiTx){
        if(data.wei === wei && data.coin == coin){
            console.log("Found a match!");
            return data.user;
        }
    }
    return null;
}


module.exports = Manager;