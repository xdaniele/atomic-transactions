//var peer_cli = require('./src/peer/peer-cli');
var Manager = require("./src/manager/manager");

var manager = new Manager("0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",3000);
manager.connectToNode("http://localhost:8545");

//var vorpal = require('vorpal')();
/*var Peer = require("./src/peer/peer.js");



var peerA = new Peer("0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d");
peerA.ConnectToNode("http://localhost:8545");
instancePromiseA = peerA.GetMasterHTLCInstance();
secretA = peerA.GenerateSecret(32);
hashA = peerA.GetHash(secretA);

contractIdPromiseA = peerA.newContract(instancePromiseA,"0xffcf8fdee72ac11b5c542428b35eef5769c409f0",peerA.bufferToString(hashA),1,100);

contractIdPromiseA.then(function(result){
  return peerA.haveContract(instancePromiseA,result)
}).then(function(res){
  console.log(res);
}).catch((err) => {console.log(err);})*/

//peerA.refund(instancePromiseA,"0xfee25bdd3fa8695219490e72b026886cbfd10f9711c72c6fdc7e14cebccdbe9e");

/*
contractIdPromiseA.then(function(result){
  peerA.refund(instancePromiseA,result);
})
*/

/*contractIdPromiseA.then(function(result){
  var peerB = new Peer("0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1");
  peerB.ConnectToNode("http://localhost:8545");
  peerB.withdraw(instancePromiseA,result,peerB.bufferToString(secretA));
});*/


//hash = peer.GetHash(secret);
//contractIdPromise = peer.newContract(instancePromise,"0xf4075fc1cc9fbc3d2cd9f86ca981dac2da658659",peer.bufferToString(hash),120,100);*/
//id = "0x2021b100b3481a5ebdc4c65d0228387999eacdc3dac61f78be50e6b6dec9b454";
//contractIdPromise.then((id)=>{
  //peer.withdraw(instancePromise,id,peer.bufferToString(secret),{from : peer.account.address});
//})*/
//peer.withdraw(instancePromise,contractId,secret);





//All vorpal stuff I was testing for the cli (ignore for now)
/*
vorpal
  .command('-c',"Run the client version of the application")
  .action(function(args,callback){
    this.log(args);
    callb0xf71d237bf4f5015a1ed6424965fa153c76d9d42cack();
  });

vorpal
  .command('-m',"Run the manager version of the application")
  .action(function(args,callback){
    this.log("manager");
    callback();
  });

vorpal
  .delimiter('atomic $')
  .show();
*/
