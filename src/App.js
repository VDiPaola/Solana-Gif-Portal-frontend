import React, { useEffect, useState } from 'react';
import './App.css';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const TEST_GIFS = [
	'https://c.tenor.com/Ekg6QgoYnrsAAAAd/ours-polaire-polar-bear.gif',
	'https://c.tenor.com/xKGq2sWzs5IAAAAC/polar-bear-lazy.gif',
	'https://www.gannett-cdn.com/experiments/usatoday/polar-bears/static/img/standing-baby-polar-bear-compressed.gif',
	'https://media2.giphy.com/media/aK4wh0UE3oddS/200.gif'
]

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
      
      // Call Solana program here.
  
      // Set state
      setGifList(TEST_GIFS);
    }
  }, [walletAddress])

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
