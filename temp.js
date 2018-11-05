var Web3 = require('web3');
var contract = require('truffle-contract');
var Peer = require('./src/peer/peer');
var hashedTimelockERC20JSON = require('./build/contracts/HashedTimelockERC20.json');

Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;


peer = new Peer("0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1");
peer.ConnectToNode("http://localhost:8545");

hashedTimelockERC20 = contract(hashedTimelockERC20JSON);
hashedTimelockERC20.setProvider(peer.web3.currentProvider);
hashedTimelockERC20.deployed().then(instance =>{
    now = Number((Date.now()/1000).toFixed(0));
    return instance.newContract("0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1","0x0",now + 100,"0x54a8520e673048fcbfcce39a0b9ec64fee0bf4676cac648d3807e601e03988e9",1,{from: "0xffcf8fdee72ac11b5c542428b35eef5769c409f0", gas: 1000000});
}).then(function(result){
    console.log(result);
}).catch((err) =>{
    console.log(err);
})
/*
    return hashedTimelockERC20.deployed();

    let address = this.account.address;
    let now;
    let contractId;

    return new Promise((resolve,reject)=>{
        masterPromise.then(function(instance){
            now = Number((Date.now()/1000).toFixed(0));
            return instance.newContract(receiver,hashlock,now+timelock,tokenAddress,amount,{from: address,gas:1000000})
        }).then(function(result){
            for(i = 0;i<result.logs.length;i++){
                log = result.logs[i];
                if(log.event === 'LogHTLCERC20New'){
                    contractId = log.args.contractId;
                    console.log("Created HTLCERC20 with id: "+ contractId );
                    resolve(contractId);
                }
            }
        }).catch(function(err){
            console.log(err);
            reject(err);
        })
    });*/
    