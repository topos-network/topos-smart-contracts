export const INDEX_OF_TX_DATA_36 = 36

class TransactionData {
  proofBlob: string
  txRaw: string
  txRoot: string
  optionalData?: string[]

  constructor(
    proofBlob: string,
    txRaw: string,
    txRoot: string,
    optionalData?: string[]
  ) {
    this.proofBlob = proofBlob
    this.txRaw = txRaw
    this.txRoot = txRoot
    this.optionalData = optionalData
  }
}

export const MINT_EXCEED_TRANSACTION: TransactionData = new TransactionData(
  '0xf8f80180f8f4f8f2822080b8edf8eb078451d6ca388301141c94dc64a140aa3e981100a' +
    '9beca4e685f962f0cf6c980b8845c914ec600000000000000000000000000000000000000' +
    '0000000000000000000000000200000000000000000000000070997970c51812dc3a010c7' +
    'd01b50e0d17dc79c80000000000000000000000000e1ae0256effbe0c5ea9a0972db2c449' +
    'f26bbaca000000000000000000000000000000000000000000000000000000000000006d8' +
    '2f4f5a0d15572e19b22d22e54b0e549dcb6dd6c982b45122f393221e0b7bb814ec73a2da0' +
    '3af2adda48922114c9fdb27736df86e93403953398a667091b56a75ffcdef1d5',
  '0xf8eb078451d6ca388301141c94dc64a140aa3e981100a9beca4e685f962f0cf6c980b88' +
    '45c914ec60000000000000000000000000000000000000000000000000000000000000002' +
    '00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8000000000' +
    '0000000000000000e1ae0256effbe0c5ea9a0972db2c449f26bbaca000000000000000000' +
    '000000000000000000000000000000000000000000006d82f4f5a0d15572e19b22d22e54b' +
    '0e549dcb6dd6c982b45122f393221e0b7bb814ec73a2da03af2adda48922114c9fdb27736' +
    'df86e93403953398a667091b56a75ffcdef1d5',
  '0xce34ded136a906b6d13f5b6a812d469030c2b9b6633883860a28cbae5ee91a86'
)

export const UNKNOWN_TOKEN_TRANSACTION: TransactionData = new TransactionData(
  '0xf8f80180f8f4f8f2822080b8edf8eb078451d6ca388301141c94dc64a140aa3e981100a' +
    '9beca4e685f962f0cf6c980b8845c914ec600000000000000000000000000000000000000' +
    '0000000000000000000000000200000000000000000000000070997970c51812dc3a010c7' +
    'd01b50e0d17dc79c800000000000000000000000084ca534d36b5d544251db6722e245409' +
    'd7293bb100000000000000000000000000000000000000000000000000000000000000328' +
    '2f4f6a06704fe2ef8c355cb750faddb21051d58f3198287ea54b2320c1cf2fcf0f2d4a1a0' +
    '25ffe4da9059821e8944ca10c4f6caaa3a8938ccb98f5c0698ac1d6a55c75030',
  '0xf8eb078451d6ca388301141c94dc64a140aa3e981100a9beca4e685f962f0cf6c980b88' +
    '45c914ec60000000000000000000000000000000000000000000000000000000000000002' +
    '00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8000000000' +
    '00000000000000084ca534d36b5d544251db6722e245409d7293bb1000000000000000000' +
    '000000000000000000000000000000000000000000003282f4f6a06704fe2ef8c355cb750' +
    'faddb21051d58f3198287ea54b2320c1cf2fcf0f2d4a1a025ffe4da9059821e8944ca10c4' +
    'f6caaa3a8938ccb98f5c0698ac1d6a55c75030',
  '0xe62585388b2c91456092920d65cfdf960460198ab64024f91b946f422d6eb401'
)

export const ZERO_ADDRESS_TRANSACTION: TransactionData = new TransactionData(
  '0xf8f80180f8f4f8f2822080b8edf8eb078451d6ca388301131a94dc64a140aa3e981100a' +
    '9beca4e685f962f0cf6c980b8845c914ec600000000000000000000000000000000000000' +
    '0000000000000000000000000200000000000000000000000000000000000000000000000' +
    '000000000000000000000000000000000000000000e1ae0256effbe0c5ea9a0972db2c449' +
    'f26bbaca00000000000000000000000000000000000000000000000000000000000000328' +
    '2f4f6a09626e65aa3948d04a7c6e356cdea668d3eadec65d0b15551e3eba926eee83fa8a0' +
    '12d11b82cb75204e0cffa7589b7d2d64501efe264c367b6da9215ac80d607750',
  '0xf8eb078451d6ca388301131a94dc64a140aa3e981100a9beca4e685f962f0cf6c980b88' +
    '45c914ec60000000000000000000000000000000000000000000000000000000000000002' +
    '0000000000000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000e1ae0256effbe0c5ea9a0972db2c449f26bbaca000000000000000000' +
    '000000000000000000000000000000000000000000003282f4f6a09626e65aa3948d04a7c' +
    '6e356cdea668d3eadec65d0b15551e3eba926eee83fa8a012d11b82cb75204e0cffa7589b' +
    '7d2d64501efe264c367b6da9215ac80d607750',
  '0xb472f2079358b76b31e2fe3116a6bef6ebc2aad4a83cebc9c184db1453afe09a'
)
