import React, { createContext, useState, useContext } from 'react';
import PropTypes from 'prop-types';

export const AppContext = createContext();

let provider


const AppContextProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [user, setUser] = useState()
  const [setting, setSetting] = useState()
  const [cityContract, setCityContract] = useState(null)
  
  
  const [provider, setProvider] = useState(null)
  const [onBoard, setOnBoard] = useState(null)
  const [notify, setNotify] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [address, setAddress] = useState("");
  const [unitCoast, setUnitCoast] = useState(null)
  const [web3, setWeb3] = useState(null)

  return (
    <AppContext.Provider
      value={{
        provider,
        setProvider,
        loading,
        setLoading,
        address,
        setAddress,
        status,
        setStatus,
        user,
        setUser,
        setting,
        setSetting,
        cityContract,
        setCityContract,
        onBoard,
        setOnBoard,
        notify,
        setNotify,
        wallet,
        setWallet,
        web3,
        setWeb3,
        unitCoast, 
        setUnitCoast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

AppContextProvider.propTypes = {
  children: PropTypes.object,
};

export default AppContextProvider;
export const useAppContext = () => useContext(AppContext);