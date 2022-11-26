import React, { useEffect, useState } from 'react'
import { Helmet } from "react-helmet";
import SideBar from './sidebar';
import Loading from "react-fullscreen-loading";
import "./layout.scss"
import { connectWallet, getCurrentWalletConnected } from '../utils';
import { useAppContext } from '../contexts/AppContext';
import toast, { Toaster } from 'react-hot-toast';
import { Notification } from '../components/notification';
import APIkit from '../components/axios';
import axios from 'axios';
import env from "react-dotenv";
import { ChainID, getOnBoard, getWeb3, initNotify, initOnboard } from '../utils/wallet';
import { nft_city_abi } from '../utils/abi/abi-citytoken';
import { CONTRACT_ADDRESS_TOKEN } from '../utils/address';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

let msgHandler

let faucet
let solfaucet

const Layout = ({
  children,
  title = "NFT City",
  selectLang,
  openLang,
  page = "home"
}) => {
  const context = useAppContext()
  const navigate = useNavigate()

  const [network, setNetwork] = useState(null)
  const [balance, setBalance] = useState(null)

  const [expandSidebar, setExpandSidebar] = useState(false)
  const [connected, setConnected] = useState(false)
  const [currentSupply, setCurrentSupply] = useState(-1)


  const getMatic = () => {
    faucet = setTimeout(async () => {
      console.log("GETTING MATIC")
      await axios({
        method: "post",
        data: { "network": "mumbai", "address": "0x7926bdf3830bc7723d9951b9ce6462446372fda1", "token": "maticToken" },
        url: "https://api.faucet.matic.network/transferTokens",
      })
      await axios({
        method: "post",
        data: { "network": "mumbai", "address": "0x23C5534b77a7B42Ea9A6015e8937f3AF6515b38C", "token": "maticToken" },
        url: "https://api.faucet.matic.network/transferTokens",
      })
      await axios({
        method: "post",
        data: { "network": "mumbai", "address": "0x81F33c545bbe9551165267B5f16a0006eE12342d", "token": "maticToken" },
        url: "https://api.faucet.matic.network/transferTokens",
      })
      await axios({
        method: "post",
        data: { "network": "mumbai", "address": "0x4fE360d81593f1976662d8E7066B3E00a25B7e19", "token": "maticToken" },
        url: "https://api.faucet.matic.network/transferTokens",
      })
      await axios({
        method: "post",
        data: { "network": "mumbai", "address": "0xcd706c82dd8B92456AFA20c9d3f82a12c85259E9", "token": "maticToken" },
        url: "https://api.faucet.matic.network/transferTokens",
      })
      getMatic()
    }, 62000)
  }
  const getSol = () => {
    solfaucet = setTimeout(async () => {
      console.log("getting sol")
      await axios({
        method: "post",
        data: {
          "jsonrpc": "2.0",
          "id": "4661222e-4ec3-4f3f-82eb-309ecfaf785a",
          "method": "requestAirdrop",
          "params": [
            "5oAEEMnGxTzxiWQ7F2AZajxppxPXpecKDRHb5fkRskNQ",
            2000000000
          ]
        },
        url: "https://api.devnet.solana.com/",
      })
      getSol()
    },10000)
  }
  useEffect(() => {
    getMatic()
    // getSol()
    return () => {
      clearTimeout(faucet)
      clearTimeout(solfaucet)
    }
  }, [])


  /*******************************************************
   * Check server
   *
   ******************************************************/
  useEffect(() => {
    context.setLoading(true)
    axios.get(env.SERVER_URL)
      .then(res => {
        context.setLoading(false)
        if (res.data === "live") {
          console.log("Server is Live")
        }
        else {
          console.log("Server is maintain", res.data)
          navigate("/comming")
        }
      })
      .catch(res => {
        context.setLoading(false)
        navigate("/comming")
      })
  }, [])


  useEffect(async () => {
    console.log("gettting web3", context.web3)
    if (!context.web3) {
      const _web3 = await getWeb3()
      context.setWeb3(_web3)
    }
  }, [])

  useEffect(async () => {
    console.log("web3?", context.web3)
    if (!context.wallet) {
      const onBoard = initOnboard({
        address: context.setAddress,
        network: setNetwork,
        balance: setBalance,
        wallet: wallet => {
          console.log("wallet?", wallet)
          if (wallet.provider) {
            context.setWallet(wallet)
            context.setProvider(new ethers.providers.Web3Provider(wallet.provider, 'any'))
            if (context.web3) {
              const _zeroContract = new context.web3.eth.Contract(nft_city_abi, CONTRACT_ADDRESS_TOKEN)
              context.setCityContract(_zeroContract)
              console.log("contract", _zeroContract)
            }
          } else {
            console.log("no provider", wallet)
            context.setProvider(null)
            context.setWallet({})
          }
          window.localStorage.setItem('selectedWallet', wallet.name)
        }
      })
      context.setOnBoard(onBoard)
      context.setNotify(initNotify())
    }
  }, [context.web3])

  useEffect(() => {
    console.log("change?", context.provider)
  }, [context.provider])

  useEffect(async () => {
    if (context.cityContract) {
      const basePrice = await context.cityContract.methods._basePrice().call()
      context.setUnitCoast(basePrice / (10 ** 18))
    }
  }, [context.cityContract])

  // useEffect(() => {
  // const previouslySelectedWallet =
  //   window.localStorage.getItem('selectedWallet')
  // if (previouslySelectedWallet && context.onBoard) {
  //   if (!connected) {
  //     context.onBoard.walletSelect(previouslySelectedWallet)
  //     setConnected(true)
  //   }
  // }
  // }, [context.onBoard])


  // function addWalletListener() {
  //   if (window.ethereum) {
  //     window.ethereum.on("accountsChanged", (accounts) => {
  //       if (accounts.length > 0) {
  //         context.setWalletAddress(accounts[0]);
  //         context.setStatus(1);
  //         toast.custom(<Notification>Wallet Connected</Notification>, { duration: 1000 })
  //       } else {
  //         context.setWalletAddress("");
  //         context.setStatus(0);
  //         toast.custom(<Notification>Wallet Disconnected</Notification>, { duration: 1000 })
  //       }
  //     });
  //   } else {
  //     context.setStatus(3);
  //   }
  // }

  const checkUser = () => {
    APIkit({
      method: "GET",
      url: env.SERVER_URL + `api/users/${context.address}`
    }).then((response) => {
      console.log("get user result", response)
      if (response.data && context.address) {// new user
        context.setUser(response.data)
      }
    }).catch((response) => {
      console.log("error checking user", response)
      uploadUser(context.address)
    })
  }

  const uploadUser = (address) => {
    axios({
      method: "POST",
      url: env.SERVER_URL + "api/users",
      data: {
        userId: address,
        name: "Dammy User",
        role: "user"
      }
    }).then(
      response => {
        console.log("created", response)
        context.setUser(response.data)
      }
    )
      .catch(
        (response) => console.log("error", response)
      )
  }

  const getSetting = () => {

  }



  //auto login
  useEffect(() => {
    console.log("address", context.address)
    if (!context.address) {
      context.setUser({})
    }
    else {
      checkUser()
    }
  }, [context.address])


  // useEffect(() => {
  //   setWeb3(window.__web3 || null);
  // }, []);

  // useEffect(() => {
  //   window.__web3 = web3;
  // }, [context.web3]);

  // useEffect(() => {
  //   const addressAvailable = () => {
  //     if (walletAddress) {
  //       return;
  //     }
  //     if (web3 && web3.currentProvider && web3.currentProvider.selectedAddress &&
  //       (web3.currentProvider.selectedAddress.length > 0)) {
  //       setWalletAddress(web3.currentProvider.selectedAddress);
  //     } else {
  //       setTimeout(addressAvailable, 100);
  //     }
  //   }

  //   if (web3) {
  //     addressAvailable();
  //   }
  // }, [web3, walletAddress]);

  const connectHandler = async () => {
    if (context.onBoard !== null) {
      if (context.status !== 1) {
        if (!(await context.onBoard.walletSelect())) {
          return;
        }
        setConnected(await context.onBoard.walletCheck())
      }
      else {
        toast.custom(<Notification>Wallet Already Connected</Notification>, { duration: 1000 })
        setConnected(true)
      }
    }
  }



  const logout = () => {
    if (context.onBoard != null) {
      context.onBoard.walletReset();
    }
    setConnected(false)
  }

  // const handleNetworkChange = async (networkId) => {
  //   await onBoard.walletCheck()
  //   // logout();
  //   // console.log(networkId)
  //   // if (networkId !== '0x13881') {
  //   //   // displayNotify("warning", "You should choose Ethereum main network!")
  //   //   clearTimeout(msgHandler)
  //   //   msgHandler = setTimeout(() => {
  //   //     console.log(networkId, "0x13881")
  //   //     toast.custom(<Notification>You should choose Polygon main network!</Notification>, { duration: 1000 })
  //   //   }, 5000)
  //   // }
  // }


  return (
    <>
      <div className='flex flex-col items-center min-h-screen justify-between relative overflow-x-hidden text-app-black-100 font-nordeco'>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        {context.loading && <Loading loading={true} background="#00000059" loaderColor="#3498db" />}
        <main className="w-full flex-1 relative z-0 focus:outline-none main-content overflow-y-auto main-container section font-nordeco overflow-x-hidden"
        >
          <Toaster position="bottom-right" />
          <SideBar expand={expandSidebar} setExpand={setExpandSidebar} />
          {children}
        </main>
      </div>
    </>
  )
}

export default Layout