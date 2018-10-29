//Note this is just for testing purposes right now and wont be in the final code
var vorpal = require('vorpal')();
var Peer = require('./peer');

var peer;

vorpal
    .command('create_peer [private_key]','Creates peer when you pass in private key')
    .action(function(args,callback){
        if(args.private_key != undefined){
            if(args.private_key === "0x8f6c5b40e4d7dc28e81760e1385b06b73f93d78102d684728241c777fcc5ec7d"){
                console.log("test");
            }
            peer = new Peer(args.private_key);
            this.log("New peer with private key: " + args.private_key);
        }
        callback();
    });

vorpal
    .command('connect [address]','Connect to node for network')
    .action(function(args,callback){
        if(args.address != undefined && peer!=undefined){
            console.log(args);
            peer.ConnectToNode(args.address);
        }else{
            this.log("Need to create a peer with private key first!");
        }
        callback();
    })
    .types({string: '_'});

vorpal
    .command('create_htlc [num_seconds] [to]','Creates HTLC for num_seconds after you can claim your funds')
    .action(function(args,callback){
        if(args.num_seconds != undefined && args.to != undefined && peer != undefined){
            console.log("yay");
        }
        callback();
    });



vorpal
    .delimiter("peer$ ")
    .show();
