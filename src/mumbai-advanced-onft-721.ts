import { BigInt, Bytes, store } from "@graphprotocol/graph-ts"
import {
  AdvancedONFT721,
  ReceiveFromChain as ReceiveFromChainEvent,
  SendToChain as SendToChainEvent,
  Transfer as TransferEvent
} from "../generated/AdvancedONFT721/AdvancedONFT721"
import {
  ReceiveFromChain,
  SendToChain,
  Token,
  Transfer
} from "../generated/schema"

export function handleReceiveFromChain(event: ReceiveFromChainEvent): void {
  let entity = new ReceiveFromChain(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity._srcChainId = event.params._srcChainId
  entity._srcAddress = event.params._srcAddress
  entity._toAddress = event.params._toAddress
  entity._tokenId = event.params._tokenId
  entity._nonce = event.params._nonce

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSendToChain(event: SendToChainEvent): void {
  let entity = new SendToChain(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity._sender = event.params._sender
  entity._dstChainId = event.params._dstChainId
  entity._toAddress = event.params._toAddress
  entity._tokenId = event.params._tokenId
  entity._nonce = event.params._nonce

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let token = Token.load(event.address.toHexString() + event.params.tokenId.toString())
  if (!token) {
    token = new Token(event.address.toHexString() + event.params.tokenId.toString())
    token.token_id = event.params.tokenId

    let tokenContract = AdvancedONFT721.bind(event.address)
    const tokenURI = tokenContract.try_tokenURI(event.params.tokenId)
    token.token_uri = tokenURI.reverted ? '' : tokenURI.value
    token.updated_at_blocktimestamp = BigInt.fromString("0")
  }
  token.owner = event.params.to.toHexString()
  token.col_url = ''
  if (event.address.toHexString().includes('0xe470095690273485Ed251e7F2246d5561121B6A6')) {
    token.col_url = 'gregs_eth'
  } else if (event.address.toHexString().includes('0x6Db3b03c030451AE66627716e49dE40109E40697')) {
    token.col_url = 'kanpai_pandas'
  } else if (event.address.toHexString().includes('0x896CA9931238169186001228ab2D3e060cA21179')) {
    token.col_url = 'milady'
  }
  token.contract_type = 'ERC721'
  token.amount = BigInt.fromString('1')
  token.chain_id = BigInt.fromString('80001')
  token.collection_address = event.address.toHexString()
  if (event.block.timestamp.gt(token.updated_at_blocktimestamp)) {
    token.updated_at_blocktimestamp = event.block.timestamp
    token.save()
  }

  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.collection = event.address
  entity.from = event.params.from
  entity.to = event.params.to
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
