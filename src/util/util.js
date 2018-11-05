var MsgTypeEnum ={
    INIT : 0,
    POOL_HASHES : 1,
    HTLC_CREATE : 2,
    POOL_SECRETS : 3,
    FINALIZE: 4,
    ABORT: 5
}

var TxTypeEnum = {
    WEI_TO_COIN : 0,
    COIN_TO_WEI : 1
}

/*Data format
data = {
    wei: wei,
    coin: coin
}
*/

function createMsg(txId,msgType,txType,from,data){
    return {
        txId : txId,
        msgType : msgType,
        txType : txType,
        from : from,
        data : data
    }
}


module.exports = {
    MsgTypeEnum,
    TxTypeEnum,
    createMsg
}