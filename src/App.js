import React, { useEffect, useState } from 'react';
import './App.css';

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';

import idl from './idl.json'

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Create a keypair for the account that will hold the GIF data.
let baseAccount = Keypair.generate();

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

      console.log("got account " + account);
      setGifList(account.gifList);
    }catch(err){
      console.log(err);
      setGifList(null);
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
    if (inputValue.length > 0) {
      setGifList([...gifList, inputValue]);
      setInputValue("");
    }else{
      alert("you must enter link in text box");
    }
  }

  const renderConnectedContainer = () => (
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
        {gifList.map((gif) => (
          <div className="gif-item" key={gif}>
            <img src={gif} alt={gif} />
          </div>
        ))}
      </div>
    </div>
  );

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
