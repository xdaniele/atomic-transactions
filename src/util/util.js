var web3 = require('web3');

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


function createMsg(txId,msgType,txType,from,data){
    return {
        txId : txId,
        msgType : msgType,
        txType : txType,
        from : from,
        data : data
    }
}

function isString(s) {
    return typeof(s) === 'string' || s instanceof String;
}

function contractToObject(contractArray) {

  var contractObject = {};

  for (i = 0; i < contractArray.length; i++) {
    switch (+i) {
      case 0:
        let senderAddress = web3.utils.toChecksumAddress(contractArray[i]);
        contractObject['sender'] = senderAddress;
        break;
      case 1:
        let receiverAddress = web3.utils.toChecksumAddress(contractArray[i]);
        contractObject['receiver'] = receiverAddress;
        break;
      case 2:
        if (isString(contractArray[i])) {
          let tokenAddress = web3.utils.toChecksumAddress(contractArray[i]);
          contractObject['tokenAddress'] = tokenAddress;
          var shift = 0;
          break;
        } else {
          contractObject['tokenAddress'] = null;
          var shift = 1;
          contractArray.push(null);
          i++;
        }
      case 3:
        contractObject['amount'] = contractArray[i-shift];
        break;
      case 4:
        contractObject['hashlock'] = contractArray[i-shift];
        break;
      case 5:
        contractObject['timelock'] = contractArray[i-shift];
        break;
      case 6:
        contractObject['withdrawn'] = contractArray[i-shift];
        break;
      case 7:
        contractObject['refunded'] = contractArray[i-shift];
        break;
      case 8:
        contractObject['preImage'] = contractArray[i-shift];
        break;
    }
  }

  return contractObject;
}


module.exports = {
    MsgTypeEnum,
    TxTypeEnum,
    createMsg,
    contractToObject,
}
