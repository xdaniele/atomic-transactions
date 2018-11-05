//Currently is meant to just work for 2 participants

function Tx(clientA,clientB,clientATxType,clientBTxType,wei,coin){
    this.clientA = clientA;
    this.clientB = clientB;
    this.clientATxType = clientATxType;
    this.clientBTxType = clientBTxType;
    this.wei = wei;
    this.coin = coin;
    this.hashSecrets = [null,null];
    this.hashSecretsIn = false;
    this.secrets = [null,null];
    this.secretsIn = false;
    this.contractIds = [null,null];
    this.idsIn = false;
    this.masterHash = undefined;
}



module.exports ={
    Tx
}