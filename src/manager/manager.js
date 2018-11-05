var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Peer = require("../peer/peer");
var util = require("../util/util");
var transaction = require("../util/transaction");

function Manager(privateKey,chatPort,tokenAddress){
    this.peer = new Peer(privateKey);
    this.peer.setTokenAddress(tokenAddress);
    this.users = new Map();
    this.weiToCoinTx = new Array();
    this.coinToWeiTx = new Array();
    this.txList = new Array();
    let manager = this;
    io.on('connection', function (socket){

       socket.on('MSG', function (incomingMsg) {
        manager.parseMessage(incomingMsg,socket);
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
        this.masterHTLCPromise = this.peer.GetMasterHTLCInstance();
        this.masterHTLCERC20Promise = this.peer.GetMasterHTLCERC20Instance();
        this.tokenTestPromise = this.peer.GetTestTokenInstance();
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

Manager.prototype.listPartialTx = function(){
    console.log("WEI_TO_COIN TX")
    if(this.weiToCoinTx.length === 0){
        console.log("EMPTY");
    }else{
        for(let i = 0;i<this.weiToCoinTx.length;i++){
            console.log(this.weiToCoinTx[i]);
        }
    }
    console.log("COIN_TO_WEI TX")
    if(this.coinToWeiTx.length === 0){
        console.log("EMPTY");
    }else{
        for(let i = 0;i<this.coinToWeiTx.length;i++){
            console.log(this.coinToWeiTx[i]);
        }
    }
}

Manager.prototype.listTx = function(){
    console.log("TX")
    if(this.weiToCoinTx.length === 0){
        console.log("EMPTY");
    }else{
        for(let i = 0;i<this.txList.length;i++){
            console.log(this.txList[i]);
        }
    }
}



//Transaction relevant functions

Manager.prototype.parseMessage = function(msg,socket){
    switch(msg.msgType){
        case util.MsgTypeEnum.INIT:
            this.initTransaction(msg,socket);
            break;
        
        case util.MsgTypeEnum.POOL_HASHES:
            this.poolHashes(msg,socket);
            break;

        case util.MsgTypeEnum.HTLC_CREATE:
            this.verifyClientTx(msg,socket);
            break;
        
        case util.MsgTypeEnum.POOL_SECRETS:
            this.poolSecrets(msg,socket);
            break;
    }
}


Manager.prototype.initTransaction = function(msg,socket){
    //Keep track of the clients socket
    if(this.users.get(msg.from) === undefined){
        this.users.set(msg.from,socket);
    }
    let newTxIndex;
    switch(msg.txType){
        case util.TxTypeEnum.WEI_TO_COIN:
            newTxIndex = this.weiToCoin(msg,socket);
            break;
        case util.TxTypeEnum.COIN_TO_WEI:
            newTxIndex = this.coinToWei(msg,socket);
            break;
    }
    if(newTxIndex != -1){
        console.log("STEP 2: POOL_HASHES")
        tx = this.txList[newTxIndex];
        msgA = util.createMsg(newTxIndex,util.MsgTypeEnum.POOL_HASHES,msg.txType,this.peer.account.address,null);
        socketA = this.users.get(tx.clientA.from);
        socketA.emit('MSG',msgA);
        msgB = util.createMsg(newTxIndex,util.MsgTypeEnum.POOL_HASHES,msg.txType,this.peer.account.address,null);
        socketB = this.users.get(tx.clientB.from);
        socketB.emit('MSG',msgB);        
    }
}

Manager.prototype.weiToCoin = function(msg,socket){
    let matchTx;
    let j;
    for(let i = 0;i<this.coinToWeiTx.length;i++){
        if(this.coinToWeiTx[i].data.wei === msg.data.wei && this.coinToWeiTx[i].data.coin === msg.data.coin){
            matchTx = this.coinToWeiTx[i];
            j = i;
        }
    }
    if(matchTx != undefined){
        console.log("Found match!");
        console.log("STEP 1: INIT")
        this.coinToWeiTx.splice(j,1);
        console.log(matchTx);
        tx = new transaction.Tx(msg,matchTx,util.TxTypeEnum.WEI_TO_COIN,util.TxTypeEnum.COIN_TO_WEI);
        return this.txList.push(tx) - 1;
    }else{
        console.log(`Adding WEI_TO_COIN Tx from ${msg.from}`)
        console.log(`Wei : ${msg.data.wei}, Coin : ${msg.data.coin}`);
        this.weiToCoinTx.push(msg);
        return -1;
    }
}

Manager.prototype.coinToWei = function(msg,socket){
    let matchTx;
    let j;
    for(let i = 0;i<this.weiToCoinTx.length;i++){
        if(this.weiToCoinTx[i].data.wei === msg.data.wei && this.weiToCoinTx[i].data.coin === msg.data.coin){
            matchTx = this.weiToCoinTx[i];
            j = i;
        }
    }
    if(matchTx != undefined){
        console.log("Found match!");
        console.log("STEP 1: INIT")
        this.weiToCoinTx.splice(j,1);
        console.log(matchTx);
        tx = new transaction.Tx(msg,matchTx,util.TxTypeEnum.COIN_TO_WEI,util.TxTypeEnum.WEI_TO_COIN,msg.data.wei,msg.data.coin);
        return this.txList.push(tx)-1;
    }else{
        console.log(`Adding COIN_TO_WEI Tx from ${msg.from}`)
        console.log(`Wei : ${msg.data.wei}, Coin : ${msg.data.coin}`);
        this.coinToWeiTx.push(msg);
        return -1;
    }
}

Manager.prototype.poolHashes = function(msg,socket){
    txId = msg.txId;
    tx = this.txList[txId];
    if(msg.from === tx.clientA.from){
        tx.hashSecrets[0] = msg.data;
        if(tx.hashSecrets[1] != null){
            tx.hashSecretsIn = true;
        }
    }else if(msg.from === tx.clientB.from){
        tx.hashSecrets[1] = msg.data;
        if(tx.hashSecrets[0] != null){
            tx.hashSecretsIn = true;
        }
    }
    if(tx.hashSecretsIn)
    {
        hashAB = Buffer.concat([tx.hashSecrets[0],tx.hashSecrets[1]],tx.hashSecrets[0].length + tx.hashSecrets[1].length);
        this.masterHash = this.peer.GetHash(hashAB);
        newMsgA = util.createMsg(txId,util.MsgTypeEnum.HTLC_CREATE,tx.clientATxType,this.peer.account.address,{hashA: tx.hashSecrets[0],hashB: tx.hashSecrets[1],wei: tx.wei,coin : tx.coin});
        newMsgB = util.createMsg(txId,util.MsgTypeEnum.HTLC_CREATE,tx.clientBTxType,this.peer.account.address,{hashA: tx.hashSecrets[0],hashB: tx.hashSecrets[1],wei : tx.wei,coin : tx.coin});
        socketA = this.users.get(tx.clientA.from);
        socketB = this.users.get(tx.clientB.from);
        console.log("STEP 3: CREATE_HTLC");
        socketA.emit('MSG',newMsgA);
        socketB.emit('MSG',newMsgB);
    }
} 

Manager.prototype.verifyClientTx = function(msg,socket){
    txId = msg.txId;
    tx = this.txList[txId];
    if(msg.from === tx.clientA.from){
        tx.contractIds[0] = msg.data;
        if(tx.contractIds[1] != null){
            tx.idsIn = true;
        }
    }else if(msg.from === tx.clientB.from){
        tx.contractIds[1] = msg.data;
        if(tx.contractIds[0] != null){
            tx.idsIn = true;
        }
    }

    if(tx.idsIn)
    {
        idA = tx.contractIds[0];
        idB = tx.contractIds[1];
        let verified = false;
        if(tx.clientATxType === util.TxTypeEnum.WEI_TO_COIN){
            this.peer.getContract(this.masterHTLCPromise,idA).then(result =>{
                if(this.peer.verifyContract(result,this.peer.account.address,tx.wei,this.peer.bufferToString(this.masterHash))){
                    console.log("WEI from A->B");
                     //ERC20 token requires approval
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

                    contractPromise = this.peer.newContract(this.masterHTLCPromise,tx.clientB.from,this.peer.bufferToString(tx.hashSecrets[0]),100,tx.wei);
                    contractPromise.then(instance =>{
                        msg = util.createMsg(txId,util.MsgTypeEnum.POOL_SECRETS,null,this.peer.account.address,instance);
                        socket = this.users.get(tx.clientB.from);
                        socket.emit('MSG',msg);
                    }).catch(err =>{
                        console.log(err);
                    });
                }
            }).catch(err =>{
                console.log(err);
            })
            this.peer.getContract(this.masterHTLCERC20Promise,idB).then(result =>{
                if(this.peer.verifyERC20Contract(result,this.peer.account.address,tx.coin,this.peer.bufferToString(this.masterHash))){
                    console.log("COIN from B->A");
                    contractPromise = this.peer.newERC20Contract(this.masterHTLCERC20Promise,tx.clientA.from,this.peer.bufferToString(tx.hashSecrets[1]),100,this.peer.tokenAddress,tx.coin);
                    contractPromise.then(instance =>{
                        msg = util.createMsg(txId,util.MsgTypeEnum.POOL_SECRETS,null,this.peer.account.address,instance);
                        socket = this.users.get(tx.clientA.from);
                        socket.emit('MSG',msg);
                        console.log("COIN from B->A");
                    }).catch(err =>{
                        console.log(err);
                    });
                }
            }).catch(err =>{
                console.log(err);
            });
        }else if(tx.clientATxType === util.TxTypeEnum.COIN_TO_WEI){
            this.peer.getContract(this.masterHTLCERC20Promise,idA).then(result =>{
                if(this.peer.verifyERC20Contract(result,this.peer.account.address,tx.coin,this.peer.bufferToString(this.masterHash))){
                    console.log("COIN from A->B");
                    //ERC20 token requires approval
                    this.masterHTLCERC20Promise.then(instance =>{
                        address = instance.address;
                        this.tokenTestPromise.then(result =>{
                            return result.approve(address,10,{from : this.peer.account.address});
                        }).then(value =>{
                            //Create outgoing contract
                            contractPromise = this.peer.newERC20Contract(this.masterHTLCERC20Promise,tx.clientB.from,this.peer.bufferToString(tx.hashSecrets[0]),100,this.peer.tokenAddress,tx.coin);
                            contractPromise.then(id =>{
                                msg = util.createMsg(txId,util.MsgTypeEnum.POOL_SECRETS,null,this.peer.account.address,id);
                                socket = this.users.get(tx.clientB.from);
                                socket.emit('MSG',msg);
                            }).catch(err =>{
                                console.log(err);
                            });
                        }).catch(e =>{
                            console.log(e);
                        })    
                    }).catch(err =>{
                        console.log(err);
                    });
                }
            }).catch(err =>{
                console.log(err);
            })
            this.peer.getContract(this.masterHTLCPromise,idB).then(result =>{
                if(this.peer.verifyContract(result,this.peer.account.address,tx.wei,this.peer.bufferToString(this.masterHash))){
                    console.log("WEI from B->A");
                    contractPromise = this.peer.newContract(this.masterHTLCPromise,tx.clientA.from,this.peer.bufferToString(tx.hashSecrets[1]),100,tx.wei);
                    contractPromise.then(instance =>{
                        msg = util.createMsg(txId,util.MsgTypeEnum.POOL_SECRETS,null,this.peer.account.address,instance);
                        socket = this.users.get(tx.clientA.from);
                        socket.emit('MSG',msg);
                    }).catch(err =>{
                        console.log(err);
                    });
                }
            }).catch(err =>{
                console.log(err);
            });
        }
    }
}

Manager.prototype.poolSecrets = function(msg,socket){
    txId = msg.txId;
    tx = this.txList[txId];
    if(msg.from === tx.clientA.from){
        tx.secrets[0] = msg.data;
        if(tx.secrets[1] != null){
            tx.secretsIn = true;
        }
    }else if(msg.from === tx.clientB.from){
        tx.secrets[1] = msg.data;
        if(tx.secrets[0] != null){
            tx.secretsIn = true;
        }
    }

    if(tx.secretsIn){
        console.log("SECRETS!");

        hashA = this.peer.GetHash(tx.secrets[0]);
        hashB = this.peer.GetHash(tx.secrets[1]);
        hashAB = Buffer.concat([hashA,hashB],hashA.length+hashB.length);
        newHash = this.peer.GetHash(hashAB);

        //Do withdraw from both contracts
        if(this.clientATxType === util.TxTypeEnum.WEI_TO_COIN){
            this.peer.withdraw(this.masterHTLCPromise,tx.contractIds[0],this.peer.bufferToString(tx.secrets[0]));
            this.peer.withdrawERC20(this.masterHTLCERC20Promise,tx.contractIds[1],this.peer.bufferToString(tx.secrets[1]));
        }

        //Send a message to client (client might not expect this final message)
        msg = util.createMsg(txId,util.MsgTypeEnum.FINALIZE,null,null,null);
        socketA = this.users.get(tx.clientA.from);
        socketA.emit('MSG',msg)
        socketB = this.users.get(tx.clientB.from,msg);
        socketB.emit('MSG',msg);
    }
}


module.exports = Manager;