var Web3 = require('web3');
var Tx = require('ethereumjs-tx');
var crypto = require('crypto');
var fs= require('fs');

const hashLockPath = "../build/contracts/HashLock.json";
const timeLockPath = "../build/contracts/TimeLock.json";


//Issue right now (will want to replace this privateKey stuff later with a wallet or MetaMask)
function Peer(privateKey){
    this.privateKey = privateKey;
    this.transactions = new Array();
    this.secrets = new Array();
}

Peer.prototype.ConnectToNode = function(url){
   this.web3 = new Web3(url);
   this.account = this.web3.eth.accounts.privateKeyToAccount(this.privateKey);
}

Peer.prototype.GetEther = function(address){
    this.web3.eth.getBalance(address,(err,res) =>{
        console.log("Balance: " +this.web3.utils.fromWei(res,'ether') + " ether");
    });
}

Peer.prototype.SendEther = function(amt,address){
    this.web3.eth.getTransactionCount(this.account.address, (err, txCount) => {
        const txRaw = {
          nonce:    this.web3.utils.toHex(txCount),
          to:       address,
          value:    this.web3.utils.toHex(this.web3.utils.toWei(amt.toString(), 'ether')),
          gasLimit: this.web3.utils.toHex(21000),
          gasPrice: this.web3.utils.toHex(this.web3.utils.toWei('10', 'gwei'))
        }
      
        const tx = new Tx(txRaw);
        let privateKeyBuffer = Buffer.from(this.privateKey.substring(2,this.privateKey.length),'hex');
        tx.sign(privateKeyBuffer);
      
        const serializedTx = tx.serialize()
        const raw = '0x' + serializedTx.toString('hex')
      
        this.web3.eth.sendSignedTransaction(raw, (err, txHash) => {
          if(!err){
            console.log('TX Hash:', txHash)
            this.transactions.push(txHash);
          }
        })
      })
}

Peer.prototype.GetTransactionByHash = function(txHash){
    this.web3.eth.getTransactionReceipt(txHash,(err,res) =>{
        if(err){
            console.log(err);
        }else{
            if(res == null){
                console.log("No tx matching that hash!");
            }else{
                console.log(res);
            }
        }
    });
}

Peer.prototype.GetTransactionByLocalId = function(id){
    if(this.transactions.length > 0){
        this.GetTransactionByHash(this.transactions[id]);
    }else{
        console.log("You haven't submitted any transactions yet!");
    }
}

Peer.prototype.PrintTxHashes = function(){
    this.transactions.forEach((ele) =>{
        console.log(ele);
    });
}

//Returns a promise to a contract
Peer.prototype.SendContract = function(filePath){

    let source = fs.readFileSync(filePath);
    let sourceJSON = JSON.parse(source);
    let abi = sourceJSON.abi;
    let bin = sourceJSON.bytecode;

    let contract = new this.web3.eth.Contract(abi);
    options = {
        data : bin
    }
    let deployed = contract.deploy(options).send({
        from : this.account.address,
        gas: 1500000
    })
    return deployed
}

//Returns a contract
Peer.prototype.GetContract = function(filePath,address){
    let source = fs.readFileSync(filePath);
    let sourceJSON = JSON.parse(source);
    let abi = sourceJSON.abi;

    let contract = new this.web3.eth.Contract(abi,address);
    return contract;
}

Peer.prototype.SendHashLock = function(secret){
    this.SendContract(hashLockPath)
    .on('error',(err)=>{
        console.log(err);
    })
}

Peer.prototype.GetHashLock = function(address){
    return this.GetContract(hashLockPath,address);
}

Peer.prototype.HashLockEscrow = function(secret){

}


//Peer.prototype.CreateHTLC = function(time,)


module.exports  = Peer;