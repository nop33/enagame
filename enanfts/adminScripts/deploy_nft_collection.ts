import { DUST_AMOUNT, ONE_ALPH, binToHex, codec, stringToHex, subContractId, web3 } from '@alephium/web3'
import { testNodeWallet } from '@alephium/web3-test'
import { NFT, NFTOpenCollection } from '../artifacts/ts'

async function nonFungibleToken() {
  web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
  const signer = await testNodeWallet()
  const account = await signer.getSelectedAccount()

  // I should probably deploy the 2 contracts by myself
  const { contractInstance: awesomeNFTTemplate } = await NFT.deploy(signer, {
    initialFields: { collectionId: '', nftIndex: 0n, tokenUri: '' }
  })

  const { contractInstance: nftCollection } = await NFTOpenCollection.deploy(signer, {
    initialFields: {
      collectionOwner: account.address,
      nftTemplateId: awesomeNFTTemplate.contractId,
      collectionUri: stringToHex('https://arweave.net/MvagCPuLeFwSGaJvS22beU5lQepQ1gP5PE8cbms2sSY'),
      totalSupply: 0n
    }
  })

  console.log(`NFT Collection address: ${nftCollection.address}`)
}

nonFungibleToken()
