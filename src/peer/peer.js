var Web3 = require('web3');
var Tx = require('ethereumjs-tx');
var crypto = require('crypto');
var contract = require('truffle-contract');
var hashedTimelockJSON = require('../../build/contracts/HashedTimelock.json');
var hashedTimelockERC20JSON = require('../../build/contracts/HashedTimelockERC20.json');
var tokenTestJSON = require('../../build/contracts/TestToken.json');
var util = require("../util/util");
var assert = require('assert-diff');
assert.options.strict = true;

//A fix for the truffle bug that they haven't fixed... https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;



//Issue right now (will want to replace this privateKey stuff later with a wallet or MetaMask)
function Peer(privateKey){
    this.privateKey = privateKey;
    this.connected = false;
}

Peer.prototype.ConnectToNode = function(url){
   this.web3 = new Web3(url);
   this.account = this.web3.eth.accounts.privateKeyToAccount(this.privateKey);
   this.connected = true;
   console.log(`Connected to ${url}`);
}


Peer.prototype.GetMasterHTLCInstance = function (){
    let hashedTimelock = contract(hashedTimelockJSON);
    hashedTimelock.setProvider(this.web3.currentProvider);
    return hashedTimelock.deployed();
}

Peer.prototype.GetMasterHTLCERC20Instance = function (){
    let hashedTimelockERC20 = contract(hashedTimelockERC20JSON);
    hashedTimelockERC20.setProvider(this.web3.currentProvider);
    return hashedTimelockERC20.deployed();
}

Peer.prototype.GetTestTokenInstance = function(){
    let tokenTest = contract(tokenTestJSON);
    tokenTest.setProvider(this.web3.currentProvider);
    return tokenTest.deployed();
}

//Timelock is how long you want the lock to last but in the contract is the Unix epoch time

Peer.prototype.newContract = function(masterPromise,receiver,hashlock,timelock,value){
    let address = this.account.address;
    let now;
    let contractId;

    return new Promise((resolve,reject)=>{
        masterPromise.then(function(instance){
            now = Number((Date.now()/1000).toFixed(0));
            return instance.newContract(receiver,hashlock,now+timelock,{from: address,value: value,gas:1000000})
        }).then(function(result){
            for(i = 0;i<result.logs.length;i++){
                log = result.logs[i];
                if(log.event === 'LogHTLCNew'){
                    contractId = log.args.contractId;
                    console.log("Created HTLC with id: "+ contractId );
                    console.log(`Hash: ${log.args.hashlock}`);
                    resolve(contractId);
                }
            }
        }).catch(function(err){
            console.log(err);
            reject(err);
        })
    });

}

Peer.prototype.newERC20Contract = function(masterPromise,receiver,hashlock,timelock,tokenAddress,amount){
    let address = this.account.address;
    let now;
    let contractId;

    return new Promise((resolve,reject)=>{
        masterPromise.then(async function(instance){
            now = Number((Date.now()/1000).toFixed(0));
            return instance.newContract(receiver,hashlock,now+timelock,tokenAddress,amount,{from: address,gas:1000000});
        }).then(function(result){
            for(i = 0;i<result.logs.length;i++){
                log = result.logs[i];
                if(log.event === 'LogHTLCERC20New'){
                    contractId = log.args.contractId;
                    console.log("Created HTLCERC20 with id: "+ contractId );
                    console.log(`Hash: ${log.args.hashlock}`);
                    resolve(contractId);
                }
            }
        }).catch(function(err){
            console.log(err);
            reject(err);
        })
    });

}

Peer.prototype.withdraw = function(masterPromise,contractId,preImage){
    let address = this.account.address;
    masterPromise.then(function(instance){
        return instance.withdraw(contractId,preImage,{from: address})
    }).then(function(result){
        console.log(result);

        for(i = 0;i<result.logs.length;i++){
            log = result.logs[i];
            if(log.event === 'LogHTLCWithdraw'){
                contractId = log.args.contractId;
                console.log("Withdrew HTLC with id: "+ contractId);
            }
        }
    }).catch(function(err){
        console.log(err);
    })
}

Peer.prototype.withdrawERC20 = function(masterPromise,contractId,preImage){
    let address = this.account.address;
    masterPromise.then(function(instance){
        return instance.withdraw(contractId,preImage,{from: address})
    }).then(function(result){
        console.log(result);

        for(i = 0;i<result.logs.length;i++){
            log = result.logs[i];
            if(log.event === 'LogHTLCERC20Withdraw'){
                contractId = log.args.contractId;
                console.log("Withdrew HTLCERC20 with id: "+ contractId);
            }
        }
    }).catch(function(err){
        console.log(err);
    })
}


Peer.prototype.refund = function(masterPromise,contractId){
    let address = this.account.address;
    masterPromise.then(function(instance){
        return instance.refund(contractId,{from: address})
    }).then(function(result){
        for(i = 0;i<result.logs.length;i++){
            log = result.logs[i];
            if(log.event === 'LogHTLCRefund'){
                contractId = log.args.contractId;
                console.log("Refund HTLC with id: "+ contractId);
            }
        }
    }).catch(function(err){
        console.log(err);
    })
}

Peer.prototype.refundERC20 = function(masterPromise,contractId){
    let address = this.account.address;
    masterPromise.then(function(instance){
        return instance.refund(contractId,{from: address})
    }).then(function(result){
        for(i = 0;i<result.logs.length;i++){
            log = result.logs[i];
            if(log.event === 'LogHTLCERC20Refund'){
                contractId = log.args.contractId;
                console.log("Refund HTLCERC20 with id: "+ contractId);
            }
        }
    }).catch(function(err){
        console.log(err);
    })
}

Peer.prototype.getContract = function(masterPromise,contractId){
    let address = this.account.address;
    return new Promise((resolve,reject) =>{
        masterPromise.then(async function(instance){
          resolve(await instance.getContract(contractId));
        }).catch(function(err){
          reject(err);
        })
    });
}

Peer.prototype.GenerateSecret = function(numBytes){
    return crypto.randomBytes(numBytes);
}

Peer.prototype.GetHash = function(buffer){
    return crypto.createHash('sha256').update(buffer).digest();
}

Peer.prototype.bufferToString = function(buffer){
    return '0x'+buffer.toString('hex');
}

Peer.prototype.setTokenAddress = function(tokenAddress){
    this.tokenAddress = tokenAddress;
}

Peer.prototype.verifyContract = function(contractObj,receiver,amount){
    if(contractObj[1] === receiver.toLowerCase() && contractObj[2].toNumber() === amount){
        return true;
    }else{
        return false;
    }
}

Peer.prototype.verifyERC20Contract = function(contractObj,receiver,amount){
    if(contractObj[1] === receiver.toLowerCase() && contractObj[3].toNumber() === amount){
        return true;
    }else{
        return false;
    }
}

Peer.prototype.testContractState = function(masterPromise,contractId,expectedState){
  this.getContract(masterPromise,contractId).then(function(instance) {
    let actualState = util.contractToObject(instance);
    assert.deepEqual(actualState, expectedState, 'HTLC has unexpected state');
    console.log("TEST PASSED!!");
  });
}



module.exports  = Peer;
