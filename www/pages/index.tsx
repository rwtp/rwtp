import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'



const Home: NextPage = () => {
  return (
    <div >
      <Head>
        <title>RWTP - Real World Transport Protocol</title>
        <meta name="description" content="A way of shipping real world goods on ethereum" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className='max-w-4xl mx-auto flex flex-col'>

     
        <div className='m-8 border-b-2 border-black'>
          <div className='pb-4 flex justify-between'>
        <a className='font-mono flex underline' href="/">
        rwtp
        </a>

        <div className='flex '>
          <a className='font-mono flex underline ml-2' href="/whitepaper.pdf">
          whitepaper
          </a>

          <a className='font-mono flex underline ml-2' href="/">
          github
          </a>
        </div>

        </div>
        <Image src={"/Header.png"} layout="responsive" height={1} width={2} />
        </div>
        <div className='px-8'>

          <h1 className='text-xl font-bold mb-1'>Real World Transport Protocol</h1>
          <p className='mt-2'>The Real World Transport Protocol <code>(RWTP)</code> is a way to buy and sell real-world goods on Ethereum. Use RWTP to build automated companies, low-cost futures markets, decentralized ecommerce platforms, or sell stickers like we do.</p>

          <h2 className='mt-4 font-bold mb-1 text-lg'>How it works</h2>
          <div className='flex mt-4 items-start'>

          <div>
              1. A seller deploys a <code>SellOrder</code> contract and puts down a deposit.
              </div>

          </div>

          <div className='flex mt-4 items-start'>
   

              2. A buyer makes an offer to the seller and also puts down a deposit.

          </div>

          <div className='flex mt-4 items-start'>
    

              3. To accept the offer, the seller generates a new keypair for the item. They encrypt the item's private key with the buyer's public key. Then, they publish the item's public key on-chain. Finally, they ship the item and include the encrypted private key within the package, such as on QR code or NFC tag.

          </div>

          <div className='flex mt-4 items-start'>
          <div>
              4. If the buyer receives the package, they decrypt the encrypted item private key with their own keypair. They sign and publish a message containing the address of the <code>SellOrder</code> to prove that they received the package. After completion, the payment is transfered to the seller, and both parties get their deposit back.
              </div>
          </div>


        </div>
      </div>

    </div>
  )
}

export default Home
