var vorpal = require('vorpal')();
var Peer = require("./peer/peer.js");

peer = new Peer("0x5cb33fc3599c66f103ffea62608dc47b08082481da882ffdf2eb9320224769b6");
peer.ConnectToNode("http://localhost:7545");
//peer.SendContract("../build/contracts/HashLock.json");
hashLock = peer.GetHashLock("0xf0dfd782f624b933bc2d8438d98f79353c92ff53");

hashLock.methods.Escrow(peer.web3.utils.toHex("0x1")).send({
  from : peer.account.address,
  value: 60,
  gas: 21000
})
.on('error',console.error)


/*hashLock.methods.hash().call((err,res)=>{
  console.log(res);
});*/

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