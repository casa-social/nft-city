import React, { useEffect, useState } from "react";
import { faExpand, faRightToBracket, faTools, faUser, faWallet, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import CorePage from '../../assets/icons/logo_nft_city.png'
import { SideMenuButton } from "../../components/button";
import { menuList } from "./menu";
import { useAppContext } from "../../contexts/AppContext";
const SideBar = (props) => {
  const context = useAppContext()
  const { wallet } = props
  const [expand, setExpand] = useState(false)
  const navigate = useNavigate()
  const handleNavigate = (path) => {
    console.log(path)
    navigate(path)
  }

  return (
    <div className="h-screen px-1 bg-black justify-between w-14 fixed top-0 left-0 z-50 sm:flex hidden">
      <div className="flex flex-col justify-between pt-8 pb-4">
        <div className="flex flex-col gap-1 items-center text-white">
          <SideMenuButton onClick={() => setExpand(!expand)}>
            <FontAwesomeIcon icon={faExpand} className="text-app-primary-light" />
          </SideMenuButton>
          {menuList.map((menu, idx) => (
            <SideMenuButton menu={menu} onClick={() => handleNavigate(menu.path)} key={idx}>
              <FontAwesomeIcon icon={menu.icon} />
            </SideMenuButton>
          ))}
          <div onClick={() => {
            if (!context.wallet || !context.wallet.provider) {
              console.log(context.wallet)
              context.onBoard.walletSelect()
            }
            else if (context.wallet.provider) {
              context.notify.notification({
                eventCode: 'dbUpdate',
                type: 'hint',
                message:
                  'Wallet already connected'
              })
              context.onBoard.walletCheck()
            }
          }} >
            <SideMenuButton menu={{ path: "/signin" }}>
              <FontAwesomeIcon icon={faWallet} alt="login" />
            </SideMenuButton>
          </div>
          {context.user !== undefined && context.user.role === "admin" && <div className="cursor-pointer" onClick={() => handleNavigate("/manage")}>
            <SideMenuButton menu={{ path: "/manage" }} >
              <FontAwesomeIcon icon={faTools} />
            </SideMenuButton>
          </div>}
        </div>
        <div className="flex flex-col items-center justify-center text-white">
          <a href="http://nft-city.io/">
            <img src={CorePage} alt="core page" />
          </a>

        </div>
      </div>
      <div className={`h-screen flex transform tarnsform ${expand ? "tarnsform translate-x-0 " : "-translate-x-full"} duration-200 absolute left-0 w-screen bg-black max-w-30`}>
        <div className="flex flex-col justify-between relative w-full">
          {expand && <button className="absolute right-0 transform translate-x-10 translate-y-2" onClick={() => setExpand(false)}>
            <FontAwesomeIcon icon={faXmark} className="w-9 text-white" size="1x" />
          </button>}
          <div className="flex flex-col justify-between pt-8 pb-4 h-full">
            <div className="flex flex-col gap-1 items-start px-6 text-white uppercase font-bold">
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpand(!expand)}>
                <SideMenuButton>
                  <FontAwesomeIcon icon={faExpand} className="text-app-primary-light" />
                </SideMenuButton>
                <p className="text-app-primary-light">toggle menu</p>
              </div>
              <div className="flex flex-col gap-3 mt-2">
                {menuList.map((menu, idx) => (
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleNavigate(menu.path)} key={idx}>
                    <SideMenuButton menu={menu} >
                      <FontAwesomeIcon icon={menu.icon} />
                    </SideMenuButton>
                    <p className="text-white">{menu.label}</p>
                  </div>
                ))}

              </div>
              <div className="flex items-center gap-4 cursor-pointer" onClick={
                () => {
                  if (!context.wallet || !context.wallet.provider)
                    context.onBoard.walletSelect()
                  else if (context.wallet.provider)
                    context.onBoard.walletCheck()
                }
              } >
                <SideMenuButton menu={{ path: "/signin" }}>
                  <FontAwesomeIcon icon={faWallet} alt="login" />
                </SideMenuButton>
                <p className="text-white">Connect wallet</p>
              </div>
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleNavigate("/manage")}>
                <SideMenuButton menu={{ path: "/manage" }} >
                  <FontAwesomeIcon icon={faTools} />
                </SideMenuButton>
                <p className="text-white">Manage</p>
              </div>
            </div>
            <div className="flex flex-col items-start justify-center text-white gap-3 px-6">
              <a href="http://nft-city.io/" className="flex gap-4 items-center uppercase font-bold" >
                <div className="transform hover:scale-125 duration-100">
                  <img src={CorePage} alt="core page" className="w-9 h-9" />
                </div>
                <p className="text-white">back to website</p>
              </a>
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleNavigate("/admin")}>
                <SideMenuButton menu={{ path: "/admin" }} >
                  <FontAwesomeIcon icon={faUser} />
                </SideMenuButton>
                <p className="text-white">Login</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SideBar