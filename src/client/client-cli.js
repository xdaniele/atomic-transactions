var Client = require('./client');
var vorpal = require("vorpal")();

var client;

vorpal
    .command('create_client')
    .option('--pk <private_key>,','Private key')
    .types({
        string: ['pk']
    })
    .action(function(args,callback){
        if(args.options.pk != undefined){
    
            this.log(`New client with private key:  ${args.options.pk}`);
            client = new Client(args.options.pk);
            console.log(client);
            //console.log(`Address: ${client.peer.account.address}`);
        }else{
            console.log("issue");
        }
        callback();
    });

vorpal
    .command('connect')
    .option('--a <address>','Ethereum node address')
    .types({
        string: ['a']
    })
    .action(function(args,callback){
        if(args.options.a != undefined && client != undefined){
            client.connectToNode(args.options.a);
        }else{
            console.log("Need to create a client first!");
        }
        callback();
    });

vorpal
    .command('start_transaction')
    .option('--t <type>','Type of transaction: two types right now for testing (wei -> coin and coin -> wei)')
    .option('--w <amount_wei>','Amount of wei involved in tranasction')
    .option('--m <manager_address>','Manager chat address')
    .types({
        string: ['t','m']
    })
    .action(function(args,callback){
        if(args.options.t != undefined && args.options.w != undefined && args.options.m != undefined && client != undefined && client.peer.connected){
            client.initTransaction(args.options.m,args.options.t,args.options.w,1);
        }else{
            console.log("Need to create a client first!");
        }
        callback();
    });

vorpal
    .delimiter("atomic-transaction-client $ ")
    .show();