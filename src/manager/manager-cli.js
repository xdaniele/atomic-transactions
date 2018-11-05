var Manager = require('./manager');
var vorpal = require("vorpal")();

var manager;

vorpal
    .command('create_manager')
    .option('--pk <private_key>,','Private key')
    .option('--p <port>','Chat port')
    .option('--ta <token_address>','ERC20 contract address')
    .option('--t <test_value>','Set to 1 if you want to run with default cli arguments,othwerwise ignore')
    .types({
        string: ['pk']
    })
    .action(function(args,callback){
        if(args.options.t != undefined && args.options.t === 1){
            defaultSetup();
        }else{
            if(args.options.pk != undefined && args.options.p != undefined && args.options.ta != undefined){
        
                this.log(`New manager with private key:  ${args.options.pk}`);
                this.log(`with chat port : ${args.options.p}`);
                manager = new Manager(args.options.pk,args.options.p,args.options.ta);
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
        if(args.options.a != undefined && manager != undefined){
            manager.connectToNode(args.options.a);
        }else{
            console.log("Need to create a manager first!");
        }
        callback();
    });

vorpal
    .command('listUsers','Lists users in chat with manager')
    .action(function(args,callback){
        if(manager != undefined){
            manager.listUsers();
        }else{
            console.log("Need to create a manager first!");
        }
        callback();
    });

vorpal
    .command('listPartialTx','Lists pending transaction pieces currently waiting to be matched')
    .action(function(args,callback){
        if(manager != undefined){
            manager.listPartialTx();
        }else{
            console.log("Need to create a manager first!");
        }
        callback();
    });

vorpal
    .command('listTx','Lists pending transaction pieces currently waiting to be matched')
    .action(function(args,callback){
        if(manager != undefined){
            manager.listTx();
        }else{
            console.log("Need to create a manager first!");
        }
        callback();
    });

vorpal
    .delimiter("atomic-transaction-manager $ ")
    .show();


//Used mainly for debugging/testing instead of manually specifying cli arguments
//Might have to change local vars based on ganache private keys

function defaultSetup(){
    pk = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
    port = 3000;
    ganacheAddress = "http://localhost:8545";
    tokenAddress = "0xc89ce4735882c9f0f0fe26686c53074e09b0d550";
    manager =  new Manager(pk,port,tokenAddress);
    manager.connectToNode(ganacheAddress);
}