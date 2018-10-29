var Manager = require('./manager');
var vorpal = require("vorpal")();

var manager;

vorpal
    .command('create_manager')
    .option('--pk <private_key>,','Private key')
    .option('--p <port>','Chat port')
    .types({
        string: ['pk']
    })
    .action(function(args,callback){
        if(args.options.pk != undefined && args.options.p != undefined){
    
            this.log(`New manager with private key:  ${args.options.pk}`);
            this.log(`with chat port : ${args.options.p}`);
            manager = new Manager(args.options.pk,args.options.p);
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
    .delimiter("atomic-transaction-manager $ ")
    .show();