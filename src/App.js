import React, { useEffect, useState } from 'react';
import './App.css';

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';

import idl from './idl.json';

import kp from './keypair.json';
import {Buffer} from 'buffer';


// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

const arr = Object.values(kp._keypair.secretKey)
const secret = Buffer.from(arr, "base64")
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [gifList, setGifList] = useState([]);

  useEffect(()=>{
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };

    window.addEventListener("load", onLoad);
    return () => {window.removeEventListener("load", onLoad);};
  }, []);

  useEffect(()=>{
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList();
    }
  }, [walletAddress])

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const getGifList = async () => {
    try{
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("got account " + JSON.stringify(account));
      setGifList(account.gifList);
    }catch(err){
      console.log("getGifList: " + err);
      setGifList(null);
    }
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();
  
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const checkIfWalletIsConnected = async () => {
    try{
      const {solana} = window;

      if (solana) {
        if(solana.isPhantom){
          console.log('Phantom wallet found!');

          const response = await solana.connect({onlyIfTrusted:true});
          console.log(response.publicKey.toString());
          setWalletAddress(response.publicKey.toString());
        }
      }else{
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    }catch(err){
      console.error(err);
    }
  };

  const connectWallet = async () => {
      const {solana} = window;

      if (solana) {
        const response = await solana.connect();
        console.log('Connected with Public Key:', response.publicKey.toString());
        setWalletAddress(response.publicKey.toString());
      }
  };

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    setInputValue('');
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
  
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue)
  
      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };

  const upvote = async (e) => {
    try {
      let index = e.target.parentNode.parentNode.getAttribute("index").toString();
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
  
      await program.rpc.incrementGifUpvotes(index, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("GIF successfully upvoted", index)
  
      await getGifList();
    } catch (error) {
      console.log("Error upvoting GIF:", error)
    }
  };

  const renderConnectedContainer = () => {
    if (gifList == null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    }else{
      return (
        <div className="connected-container">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendGif();
          }}
        >
          <input type="text" placeholder="Enter gif link!" value={inputValue} onChange={(e)=>{setInputValue(e.target.value)}} />
          <button type="submit" className="cta-button submit-gif-button" >Submit</button>
        </form>
        <div className="gif-grid">
          {gifList.map((item, index) => (
            <div className="gif-item" key={index} index={index}>
              <img src={item.link} alt={item.link} />
              <div className="gif-footer">
                <div className="git-footer-address">
                  <h6>submitted by</h6>
                  <p>{item.userAddress.toString()}</p>
                </div>

                <div className="gif-footer-button" onClick={upvote}>
                  <p>👍</p>
                  <p>{item.upvotes.toString()}</p>
                </div>
                
              </div>
              
            </div>
          ))}
        </div>
      </div>
      )
    }
  };

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View polar bears in the metaverse ✨
          </p>
          {
            (!walletAddress && renderNotConnectedContainer())
            || renderConnectedContainer()
          }
        </div>
      </div>
    </div>
  );
};

export default App;
