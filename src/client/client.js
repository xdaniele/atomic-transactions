var Peer = require('../peer/peer.js');
var web3 = undefined;

Client.prototype = Object.create(Peer.prototype);
Client.prototype.constructor = Client;

function Client(privateKey){
    Peer.call(this,privateKey);
}

Client.prototype.GenerateSecret = function(numBytes){
    return crypto.randomBytes(numBytes);
}

Client.prototype.CreateHashLock = function(){
    var fs= require('fs');

    let source = fs.readFileSync("../build/contracts/HashLock.json");
    let sourceJSON = JSON.parse(source);
    let abi = sourceJSON.abi;
    let bin = sourceJSON.bytecode;

    let HashLock = new this.web3.eth.Contract(abi);
    options = {
        data : bin
    }
    let deployed = HashLock.deploy(options).send({
        from : this.account.address,
        gas: 1500000
    })
    deployed
    .then(function(newContractInstance){
        HashLock = newContractInstance;
        HashLock.options = newContractInstance.options;
        console.log(HashLock.options.address);
        //How to retrieve contract public field
        HashLock.methods.owner().call((err,res) =>{
            console.log(res);
        });
        HashLock.methods.Escrow(this.client.web3.utils.toHex("0x000000000000000000000000000010")).send({from : this.client.account.address,value: 60},(err,res) =>{
            HashLock.methods.hash().call((err,res) =>{
                console.log(res);
            });
        });
        //console.log(this.web3);
        
      
    });
    
}

//Client.prototype.QueryContract


module.exports = Client;