var Client = require('./client');
var vorpal = require("vorpal")();

var client;

vorpal
    .command('create_client')
    .option('--pk <private_key>,','Private key')
    .option('--ta <token_address>','ERC20 contract address')
    .option('--t <test_id>','Set to id of private key if you want to run with default cli arguments,othwerwise ignore')
    .types({
        string: ['pk','ta']
    })
    .action(function(args,callback){
        if(args.options.t != undefined && args.options.t > 0){
            defaultSetup(args.options.t);
        }else{
            if(args.options.pk != undefined && args.options.ta != undefined){
        
                this.log(`New client with private key:  ${args.options.pk}`);
                client = new Client(args.options.pk,args.options.ta);
                console.log(client);
            }else{
                console.log("usage");
            }
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
        string: ['m']
    })
    .action(function(args,callback){
        if(args.options.t != undefined && args.options.w != undefined && args.options.m != undefined && client != undefined && client.peer.connected){
            if(args.options.t === 0 || args.options.t === 1){
                client.handleTransaction(args.options.m,args.options.t,args.options.w,1);
            }else{
                console.log("Need to specify a valid type of transaction!");
            }
        }else{
            console.log("Need to create a client first!");
        }
        callback();
    });

vorpal
    .delimiter("atomic-transaction-client $ ")
    .show();


//Used mainly for debugging/testing instead of manually specifying cli arguments
//Might have to change local vars based on ganache private keys

function defaultSetup(id){
    pks = [null,"0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1", "0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c"];
    //Need to change this tokenAddress based on truffle migrate
    tokenAddress = "0xc89ce4735882c9f0f0fe26686c53074e09b0d550";
    port = 3000;
    ganacheAddress = "http://localhost:8545";
    managerAddress = "http://localhost:3000";
    client =  new Client(pks[id],tokenAddress);
    client.connectToNode(ganacheAddress);
    client.handleTransaction(managerAddress,id-1,100,1);
}