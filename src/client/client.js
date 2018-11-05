var Peer = require('../peer/peer.js');
var io = require('socket.io-client');
var util = require("../util/util");

const numSecretBytes = 48;

function Client(privateKey,tokenAddress){
    this.peer = new Peer(privateKey);
    this.peer.setTokenAddress(tokenAddress);
}

Client.prototype.connectToNode = function(url){
    this.peer.ConnectToNode(url);
    this.masterHTLCPromise = this.peer.GetMasterHTLCInstance();
    this.masterHTLCERC20Promise = this.peer.GetMasterHTLCERC20Instance();
    this.tokenTestPromise = this.peer.GetTestTokenInstance();
    this.masterHTLCERC20Promise.then(instance =>{
        address = instance.address;
        this.tokenTestPromise.then(result =>{
            return result.approve(address,10,{from : this.peer.account.address});
        }).then(value =>{
        }).catch(e =>{
            console.log(e);
        })    
    }).catch(err =>{
        console.log(err);
    })
    
}


//Transaction relevant functions

Client.prototype.parseMessage = function(msg,socket){
    switch(msg.msgType){
        case util.MsgTypeEnum.POOL_HASHES:
           this.poolHashes(msg,socket);
           break;

        case util.MsgTypeEnum.HTLC_CREATE:
            this.createHTLC(msg,socket);
            break;

        case util.MsgTypeEnum.POOL_SECRETS:
            this.poolSecrets(msg,socket);
            break;
        
        case util.MsgTypeEnum.FINALIZE:
            this.finalizeTx(msg,socket);
            break;
    }
}


Client.prototype.handleTransaction = function(managerAddress,txType,weiAmt,coinAmt){
    socket = io.connect(managerAddress,{reconnect : true});
    client = this;
    socket.on('MSG',function(incomingMsg){
        client.parseMessage(incomingMsg,socket);
    })
    if(txType === util.TxTypeEnum.WEI_TO_COIN){
        msg = util.createMsg(-1,util.MsgTypeEnum.INIT,util.TxTypeEnum.WEI_TO_COIN,this.peer.account.address,{wei: weiAmt,coin: coinAmt});
    }else if(txType === util.TxTypeEnum.COIN_TO_WEI){
        msg = util.createMsg(-1,util.MsgTypeEnum.INIT,util.TxTypeEnum.COIN_TO_WEI,this.peer.account.address,{wei: weiAmt,coin: coinAmt});
    }
    this.initTransaction(msg,socket);
}

Client.prototype.initTransaction = function(msg,socket){
    console.log("STEP 1: INIT")
    socket.emit('MSG',msg);
}

Client.prototype.poolHashes = function(msg,socket){
    console.log("STEP 2: POOL_HASHES")
    this.secret = this.peer.GenerateSecret(numSecretBytes);
    hash = this.peer.GetHash(this.secret);
    newMsg = util.createMsg(msg.txId,util.MsgTypeEnum.POOL_HASHES,msg.txType,this.peer.account.address,hash);
    socket.emit('MSG',newMsg);
}

Client.prototype.createHTLC = function(msg,socket){
    console.log("STEP 3: CREATE_HTLC");
    hashA = msg.data.hashA;
    hashB = msg.data.hashB;
    hashAB = Buffer.concat([hashA,hashB],hashA.length+hashB.length);
    newHash = this.peer.GetHash(hashAB);
    
    //TODO work on timelock details a bit later, 100 seconds by default right now
    if(msg.txType === util.TxTypeEnum.WEI_TO_COIN){
        contractPromise = this.peer.newContract(this.masterHTLCPromise,msg.from,this.peer.bufferToString(newHash),100,msg.data.wei);
        contractPromise.then(instance =>{
            msg = util.createMsg(msg.txId,util.MsgTypeEnum.HTLC_CREATE,msg.txType,this.peer.account.address,instance);
            socket.emit('MSG',msg);
        }).catch((err) =>{
            console.log(err);
        })
    }else if(msg.txType === util.TxTypeEnum.COIN_TO_WEI){
        contractPromise = this.peer.newERC20Contract(this.masterHTLCERC20Promise,msg.from,this.peer.bufferToString(newHash),100,this.peer.tokenAddress,msg.data.coin);
        contractPromise.then(instance =>{
            msg = util.createMsg(msg.txId,util.MsgTypeEnum.HTLC_CREATE,msg.txType,this.peer.account.address,instance);
            socket.emit('MSG',msg);
        }).catch((e) =>{
            console.log(e);
        })
    }
}

Client.prototype.poolSecrets = function(msg,socket){

    //Need to verify transaction from manager

    console.log("STEP 4: POOL_SECRETS");
    msg = util.createMsg(msg.txId,util.MsgTypeEnum.POOL_SECRETS,null,this.peer.account.address,this.secret);
    socket.emit('MSG',msg);
}

Client.prototype.finalizeTx = function(msg,socket){
    console.log("Done!");
}



module.exports = Client;