import React, { useRef, useEffect, useState, useCallback, useContext, useMemo, memo } from 'react';
import { faAngleLeft, faAngleRight, faArrowUp, faEye, faInfo, faInfoCircle, faLocation, faLocationCrosshairs, faLocationDot, faMapLocation, faMicrochip, faMinus, faMoneyCheckDollar, faPlus, fas, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ReactMapGL, { Source, Layer } from 'react-map-gl';
import * as turf from "@turf/turf";
import Geocoder from 'react-map-gl-geocoder'
import mapboxgl, { LngLat } from 'mapbox-gl';
import axios from 'axios';
import { CommonButton, PrimaryButton } from '../../components/button';
import Accordion from '../../components/accordion';
import Layout from "../../layout/layout";
import { mapStype } from './mapconfig';
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { checkDistance, checkDouplicate, getKeyPoint, getLandArea, getSelectedArea, getTileArea, getTileFromKey, getTilePoint, simplifyTile } from '../../utils/fasalib';
import { selectOptions } from '@testing-library/user-event/dist/select-options';
import { connectWallet } from '../../utils';
import env from 'react-dotenv';
import { useAppContext } from '../../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/input';
import Logo from '../../assets/icons/logo_nft_city.png'
import WhiteLogo from '../../assets/icons/logo.png'
import "./homepage.scss"
import { calculatePrice, filteredLands, filteredNFT, getAddress, getCurrency, getPlace, getSpecLands, uploadNFT } from '../../utils/map-api';
import { createMetaData, pinFileToIPFS, pinJSONToIPFS } from '../../utils/pinata';
import { FullscreenLoader, Loader } from '../../components/loader';
import { CONTRACT_ADDRESS_TOKEN } from '../../utils/address';
import { feature } from '@turf/turf';

// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require("worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker").default;

let request;
let requestSaved;
const VISIBLE = 17
const MAXTILE = 2500;

let toggleMultiSelect = false
const HomePage = (props) => {
  const context = useAppContext()
  const navigate = useNavigate()
  const [zoom, setZoom] = useState(20);
  const [expand, setExpand] = useState(true)
  const [gridData, setGridData] = useState([])
  const [savedLand, setSavedLand] = useState()
  const [existingNFT, setExistingNFT] = useState()
  const [selectPath, setSelectPath] = useState([])
  const [startPoint, setStartPoint] = useState([])
  const [dragPoint, setDragPoint] = useState()
  const [selecting, setSelecting] = useState(false)
  const [drag, setDrag] = useState(false)
  const [rendered, setRendered] = useState(false)
  const [landPrice, setLandPrice] = useState(0)

  const [previewData, setPreviewData] = useState([])
  const [address, setAddress] = useState()
  const [hoverInfo, setHoverInfo] = useState(null);


  const [preview, setPreview] = useState()
  const [landName, setLandName] = useState("no-name")
  const [landDesc, setLandDesc] = useState("no-description")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("")

  const [mapstyle, setMapStyle] = useState({
    url: "mapbox://styles/apetit0111/ckyjvuv9iary214o1hsoph9il",
    name: "satellite"
  })
  const [viewport, setViewport] = useState({
    latitude: 21.8926623,
    longitude: -160.16041746073756,
    zoom: 20,
    bearing: 0,
    pitch: 0
  });

  const geocoderContainerRef = useRef(); //GeoCoder
  const mapRef = useRef(); //Map container

  const layerStyle = {
    id: 'point',
    type: 'line',
    paint: {
      'line-width': 0.5,
      'line-color': '#60c1f5',
    }
  };

  const areaStyle = {
    id: 'data',
    type: 'fill',
    paint: {
      'fill-color': {
        property: 'type',
        stops: [
          [1, '#FFFFFF'],
          [2, '#abdda4'],
          [3, '#FFFFFF'],
          [4, '#FFFbbb'],
        ]
      },
      "fill-opacity": {
        property: 'type',
        stops: [
          [1, 0.5],
          [2, 1],
          [3, 0.5],
          [4, 1],
        ]
      }
    }
  }


  /**
   * move to zero point
   */
  const handleCross = () => {
    setZoom(20)
    setViewport({
      latitude: parseFloat(0),
      longitude: parseFloat(0),
      zoom: 20
    })
  }


  /**
   * Zoom control
   * @param {*} e
   */

  const handleZoom = (e) => {
    setZoom(e.target.value)
    setViewport({
      latitude: viewport.latitude,
      longitude: viewport.longitude,
      zoom: parseFloat(e.target.value)
    })
  }

  const handleStepZoom = (increase) => {
    let newZoom;
    if (increase) {
      newZoom = zoom < 24 ? zoom + 1 : 24
    }
    else (
      newZoom = zoom > 1 ? zoom - 1 : 0
    )
    setViewport({
      latitude: viewport.latitude,
      longitude: viewport.longitude,
      zoom: newZoom
    })
    setZoom(newZoom)
  }




  const makeGridData = (data) => {
    let featureData = []
    const buffData = data.features[0].geometry.coordinates
    buffData.map((item, idx) => {
      if (idx < buffData.length)
        // if (idx == (buffData.length - 1))
        featureData.push(item)
    })
    setGridData(featureData)
  }


  const handleViewportChange = useCallback(
    (newViewport) => {
      setViewport(newViewport)
    },
    []
  );

  // if you are happy with Geocoder default settings, you can just use handleViewportChange directly
  const handleGeocoderViewportChange = useCallback(
    (newViewport) => {

      const geocoderDefaultOverrides = { transitionDuration: 1000 };
      return handleViewportChange({
        ...newViewport,
        ...geocoderDefaultOverrides
      });
    },
    [handleViewportChange]
  );

  /**
   * select area when user click map tile
   * @param {*} event map event object
   */
  const selectArea = (event) => {
    if (viewport.zoom > VISIBLE) {
      if (selectPath.length > 0) {
        const distance = turf.distance(event.lngLat, [getKeyPoint(selectPath[0][0]).lng, getKeyPoint(selectPath[0][0]).lat])
        console.log("distance", distance)
        if (distance > 0.4) {
          context.notify.notification({
            eventCode: 'dbUpdate',
            type: 'hint',
            message:
              'Too far away from selected land'
          })
          return
        }
      }
      const newArea = getTilePoint(gridData, event.lngLat)
      // if clicked point is out of seleceted area. drag preview area and select new area.
      if (selectPath.filter(e => JSON.stringify(e) === JSON.stringify([newArea])).length === 0) {
        if (!drag) {
          toggleMultiSelect = !toggleMultiSelect
          setSelecting(!selecting)
          if (toggleMultiSelect) {
            setStartPoint(event.lngLat)
          }
          else {
            const buffer = selectPath.concat(getSelectedArea(gridData, previewData))
            let filteredBuffer = Array.from(new Set(buffer.map(JSON.stringify)), JSON.parse)
            setSelectPath(filteredBuffer.slice(0, MAXTILE))
            setPreviewData([])
            setStartPoint([])
          }
        }
        setDrag(false)
      }
      // if clicked point is under selected area, remove it from selected area.
      else {
        setSelectPath(selectPath.filter(e => JSON.stringify(e) !== JSON.stringify([newArea])).slice(0, MAXTILE))
      }
    }
  }




  const readyToTransact = async () => {
    console.log(context.provider)
    if (!context.provider) {
      const walletSelected = await context.onBoard.walletSelect()
      if (!walletSelected) return false
    }
    const ready = await context.onBoard.walletCheck()
    return ready
  }

  const uploadData = async () => {
    setStatus(1)
    setLoading(true)
    // var img = mapRef.current.getMap().getCanvas().toDataURL();
    // setPreview(img)
    let result = await pinFileToIPFS(preview)
    if (result.success) {
      const image = result.imageUri
      result = await createMetaData(landName, result.imageUri, selectPath, landDesc)
      console.log(result)
      setLoading(false)
      setStatus(0)
      return {
        uri: result.hash,
        image: image
      }
    }
    else {
      setStatus(0)
      setLoading(false)
      //   //handle error
    }
    return false
  }

  const mintNFT = async () => {
    if (context.address !== undefined && context.cityContract) {
      // const specPrice = await calculatePrice(selectPath)
      const price = await getCurrency(landPrice)
      const maticPrice = price * 10 ** 18

      const uri = await uploadData()
      // const uri = "https://growth.mypinata.cloud/ipfs/QmPP7qQCyoQ1MBZYkAfzxZRoedB9w6ZpPTuo3bXx61Jbxn/3.json"

      if (uri) {
        setStatus(2)
        const ready = await readyToTransact()
        console.log(ready)
        if (!ready) {
          return
        }
        setLoading(true)
        console.log("connected??", context.cityContract, context.address)
        const { update } = context.notify.notification({
          eventCode: 'dbUpdate',
          type: 'pending',
          message:
            'Confirming transaction'
        })
        console.log(landName, uri)
        const hash = await context.cityContract.methods
          .mintNFT(uri)
          .send({ from: context.address, value: maticPrice })
          .once('sending', function (payload) {
            update({
              eventCode: 'pending',
              message: 'Transaction is sending',
              type: 'pending'
            })
          })
          .on("error", () => {
            setLoading(false)
            setStatus(0)
            update({
              eventCode: 'error',
              message: 'Transacton failed',
              type: 'error'
            })
          })
          .then(res => {
            setLoading(false)
            setStatus(0)
            if (res?.events?.newTokenId?.returnValues?._value) {
              const area = getLandArea(selectPath)
              uploadNFT(res.events.newTokenId.returnValues._value, uri.image, selectPath.length, selectPath, uri.image, maticPrice / (10 ** 18), context.address, area)
            }
          })
        update(
          {
            eventCode: 'success',
            message: 'Your Transaction has been successed',
            type: 'success'
          }
        )
      }
    }
  }

  const freeMintNFT = async () => {
    if (context.address !== undefined && context.cityContract) {
      // const specPrice = await calculatePrice(selectPath)
      const price = await getCurrency(landPrice)
      const maticPrice = price * 10 ** 18

      const uri = await uploadData()
      // const uri = "https://growth.mypinata.cloud/ipfs/QmPP7qQCyoQ1MBZYkAfzxZRoedB9w6ZpPTuo3bXx61Jbxn/3.json"

      if (uri) {
        setStatus(2)
        const ready = await readyToTransact()
        console.log(ready)
        if (!ready) {
          return
        }
        setLoading(true)
        console.log("connected??", context.cityContract, context.address)
        const { update } = context.notify.notification({
          eventCode: 'dbUpdate',
          type: 'pending',
          message:
            'Confirming transaction'
        })
        console.log(landName, uri)
        const hash = await context.cityContract.methods
          .freeMintNFT(uri)
          .send({ from: context.address })
          .once('sending', function (payload) {
            update({
              eventCode: 'pending',
              message: 'Transaction is sending',
              type: 'pending'
            })
          })
          .on("error", () => {
            setLoading(false)
            setStatus(0)
            update({
              eventCode: 'error',
              message: 'Transacton failed',
              type: 'error'
            })
          })
          .then(res => {
            setLoading(false)
            setStatus(0)
            if (res?.events?.newTokenId?.returnValues?._value) {
              const area = getLandArea(selectPath)
              uploadNFT(res.events.newTokenId.returnValues._value, uri.image, selectPath.length, selectPath, uri.image, maticPrice / (10 ** 18), context.address, area)
            }
          })
        update(
          {
            eventCode: 'success',
            message: 'Your Transaction has been successed',
            type: 'success'
          }
        )
      }
    }
    else (
      console.log(context.address, context.cityContract)
    )
  }


 




  const data = useMemo(() => {
    let features = [
      {
        "type": "Feature",
        "properties": {
          "name": "grid",
          "type": 2
        },
        "geometry": {
          "coordinates": gridData,
          "type": "MultiLineString"
        },
      },
      {
        "type": "Feature",
        "properties": {
          "name": "Selected",
          "type": 2,
          "price": context.unitCoast
        },
        "geometry": {
          "type": "MultiPolygon",
          "coordinates": selectPath  //selected Area
        }
      },
      {
        "type": "Feature",
        "properties": {
          "name": "Arkansas",
          "type": 1
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            previewData  //Previewing Area
          ]
        },
      },
    ]
    if (savedLand !== undefined)
      features = features.concat(savedLand)
    if (existingNFT !== undefined)
      features = features.concat(existingNFT)
    return {
      "type": "FeatureCollection",
      "features": features
    }
  }, [selectPath, previewData, gridData, savedLand, existingNFT])


  const onHover = useCallback(event => {
    const {
      features,
      srcEvent: { offsetX, offsetY }
    } = event;
    const hoveredFeature = features && features[0];
    setHoverInfo(
      hoveredFeature
        ? {
          feature: hoveredFeature,
          x: offsetX,
          y: offsetY
        }
        : null
    );
  }, []);

  const getFilter = () => {
    const filter = {
      lngMin: Math.min(mapRef.current.getMap().getBounds()._ne.lng, mapRef.current.getMap().getBounds()._sw.lng),
      lngMax: Math.max(mapRef.current.getMap().getBounds()._ne.lng, mapRef.current.getMap().getBounds()._sw.lng),
      latMin: Math.min(mapRef.current.getMap().getBounds()._ne.lat, mapRef.current.getMap().getBounds()._sw.lat),
      latMax: Math.max(mapRef.current.getMap().getBounds()._ne.lat, mapRef.current.getMap().getBounds()._sw.lat),
    }
    return filter
  }

  useEffect(async () => {
    const valid = checkDouplicate(existingNFT, selectPath)
    if (valid !== selectPath) {
      setSelectPath(valid)
    }
    const specPrice = await calculatePrice(getFilter(), selectPath)
    setTimeout(() => {
      setPreview(mapRef.current.getMap().getCanvas().toDataURL())
    }, 500)
    setLandPrice((context.unitCoast * (selectPath.length - specPrice.count) + specPrice.price).toFixed(2))
  }, [selectPath, context.unitCoast])


  /**
   * get grid lat lng from api, to draw grid view on map
   * @param {*} viewport map props object
   */
  useEffect(() => {
    const filter = {
      lngMin: Math.min(mapRef.current.getMap().getBounds()._ne.lng, mapRef.current.getMap().getBounds()._sw.lng),
      lngMax: Math.max(mapRef.current.getMap().getBounds()._ne.lng, mapRef.current.getMap().getBounds()._sw.lng),
      latMin: Math.min(mapRef.current.getMap().getBounds()._ne.lat, mapRef.current.getMap().getBounds()._sw.lat),
      latMax: Math.max(mapRef.current.getMap().getBounds()._ne.lat, mapRef.current.getMap().getBounds()._sw.lat),
    }
    clearTimeout(requestSaved)
    requestSaved = setTimeout(async () => {
      // const savedLand = await filteredLands(filter)
      // setSavedLand(savedLand)
      const nfts = await filteredNFT(getFilter())
      setExistingNFT(nfts)
      const specLand = await getSpecLands(filter)
      setSavedLand(specLand)
    }, 500)
    if (!selecting) {
      clearTimeout(request)
      request = setTimeout(async () => {
        if (viewport.zoom >= VISIBLE) {
          axios.get("https://api.what3words.com/v3/grid-section", {
            params: {
              "key": env.W3W_KEY,
              "bounding-box": `${mapRef.current.getMap().getBounds()._ne.lat},${mapRef.current.getMap().getBounds()._ne.lng},${mapRef.current.getMap().getBounds()._sw.lat},${mapRef.current.getMap().getBounds()._sw.lng}`,
              "format": "geojson"
            }
          }).then((response) => {
            makeGridData(response.data)
          }).catch(response => console.log(response))
        }
        const address = await getAddress({
          lnglat: {
            lng: viewport.longitude,
            lat: viewport.latitude
          }
        })
        if (address !== undefined)
          setAddress(address.place_name_en)

        // const cityName = await getPlace({
        //   lnglat: {
        //     lng: viewport.longitude,
        //     lat: viewport.latitude
        //   }
        // })

        // axios.get(env.SERVER_URL + "setting/check", {
        //   params: {
        //     cityname: cityName.text
        //   }
        // })
        //   .then(res => {
        //     console.log("blocked?", res)
        //     setSelecting(false)
        //     setBlocked(res.data)
        //   })
        //   .catch(res => console.log(res))
      }, 100)
    }
    setZoom(viewport.zoom)
    setDrag(true)
  }, [viewport])

  /**
   * Draw preview tile
   */
  useEffect(() => {
    if (viewport.zoom > VISIBLE) {
      if (toggleMultiSelect) {
        setPreviewData(getTileArea(getTilePoint(gridData, startPoint), getTilePoint(gridData, dragPoint.lngLat)))
      }
    }
  }, [toggleMultiSelect, dragPoint, startPoint])


  // useEffect(() => {
  //   setSavedLand(
  //     {
  //       "type": "FeatureCollection",
  //       "features": [
  //         {
  //           "type": "Feature",
  //           "properties": {
  //             "name": "Selected",
  //           },
  //           "geometry": {
  //             "type": "MultiPolygon",
  //             "coordinates": savedlandPath  //selected Area
  //           }
  //         },
  //       ]
  //     }
  //   )
  // }, [savedlandPath])

  return (
    <Layout>
      {loading && <FullscreenLoader msg={status === 1 ? "uploading" : status === 2 ? "confirming" : ""} />}
      <div className='home-container h-screen flex'>
        <ReactMapGL
          {...viewport}
          ref={mapRef}
          width="100%"
          height="100%"
          mapStyle={mapstyle.url}
          mapboxApiAccessToken={env.MAPBPX_ACCESSTOKEN}
          onViewportChange={setViewport}
          onMouseDown={() => setDrag(false)}
          onMouseMove={(e) => setDragPoint(e)}
          onMouseUp={selectArea}
          onHover={onHover}
          preserveDrawingBuffer={true}
        >
          {viewport.zoom > VISIBLE && <>
            <Source id="my-data" type="geojson" data={data}>
              <Layer {...layerStyle} />
              <Layer {...areaStyle} />
            </Source>
          </>
          }
          {viewport.zoom > VISIBLE && hoverInfo && hoverInfo.x != 0 && hoverInfo.y != 0 && hoverInfo.feature.properties.name !== "grid" && (
            <div className="z-50 absolute text-white bg-gray-900 bg-opacity-50 p-4 rounded-md" style={{ left: hoverInfo.x, top: hoverInfo.y }}>
              {hoverInfo.feature.properties?.existing ? <div className='flex gap-1'>Owner : <p className='font-bold text-cyan-400'>{hoverInfo.feature.properties.name}</p></div>
                : <div className='flex gap-1'>Land Name: <p className='font-bold text-cyan-400'>{hoverInfo.feature.properties.name}</p></div>}
              {hoverInfo.feature.properties?.existing ? <div className='flex gap-1'>Price: <p className='font-bold text-yellow-400'>{hoverInfo.feature.properties.price}</p></div>
                : <div className='flex gap-1'>Land Price: <p className='font-bold text-yellow-400'>{hoverInfo.feature.properties.price} / Tile</p></div>}
            </div>
          )}
          <Geocoder
            mapRef={mapRef}
            containerRef={geocoderContainerRef}
            onViewportChange={handleGeocoderViewportChange}
            mapboxApiAccessToken={env.MAPBPX_ACCESSTOKEN}
            newZoom={20}
            zoom={20}
            setZoom={20}
            position="top-right"
          />
        </ReactMapGL>

        <div className='flex select-none'>
          <div className='select-none absolute left-24 flex items-center bottom-10 cursor-pointer zoom-controller gap-1 bg-black bg-opacity-50  p-4 rounded-md text-app-primary-100'>
            <CommonButton onClick={() => { handleStepZoom(false) }}><FontAwesomeIcon icon={faMinus} /></CommonButton>
            <div className='bg-white flex items-center px-2 bg-opacity-50 h-12 rounded-md'>
              <input className='zoom-seeker' type="range" name="vol" min="0" max="24" step={"0.01"} value={zoom} fill={zoom} onChange={handleZoom} style={{ background: 'linear-gradient(to right, #FF35C0 0%, #FF35C0 ' + zoom / 24 * 100 + '%, #fff ' + zoom / 24 * 100 + '%, white 100%)' }} />
            </div>
            <CommonButton onClick={() => { handleStepZoom(true) }}><FontAwesomeIcon icon={faPlus} /></CommonButton>
          </div>
        </div>

        <div className={`w-full max-w-50 bg-gray-900 h-screen absolute top-0 right-0 bg-opacity-50 py-4 px-2 flex flex-col gap-4 ${expand ? "translate-x-0" : "translate-x-full transform"} duration-200`}>
          <div className='flex items-end justify-end gap-4'>
            <Accordion summary={<div className='flex gap-2 cursor-pointer items-center'><FontAwesomeIcon icon={faEye} /><p>{mapstyle.name}</p></div>} className="bg-white py-2 rounded-md  w-40 relative" autoclose={true}>
              <div className='flex flex-col gap-2 mt-4 absolute bg-white w-full left-0 rounded-md px-4 py-2 z-10' >
                {mapStype.map((style, idx) => (
                  <div className='cursor-pointer' onClick={() => { setMapStyle(style); setRendered(false) }} key={idx}>{style.name}</div>
                ))}
              </div>
            </Accordion>
            <button className='p-2 text-white rounded-full bg-white bg-opacity-10 w-12 h-12 hover:bg-app-primary-100 outline-none flex-shrink-0' onClick={() => setExpand(!expand)}>
              <FontAwesomeIcon icon={faAngleRight} size='1x' />
            </button>
          </div>
          {/* <div className='flex justify-center items-center h-32'>
            <img src={Logo} className='h-full' />
          </div> */}
          <div className='flex gap-6 h-12 justify-center w-full px-4 mt-8'>
            <div className='flex items-center bg-white gap-4 rounded-md w-full ' ref={geocoderContainerRef}>
            </div>
          </div>
          {selectPath.length > 0 &&
            <div className='mt-4'>
              {selecting && <p className='text-2xl font-bold text-app-green'>Selecting...</p>}
              {!selecting && <div className='flex gap-4 flex-col px-4'>

                <div className='rounded-xl bg-gray-400 bg-opacity-50 text-white font-semibold relative'>
                  {/* {uploading && <Loader />} */}
                  <div className='p-6 flex flex-col gap-4'>
                    <div className='flex text-white justify-between uppercase '>
                      <p className='text-right text-gray-300'>{selectPath.length}/2500</p>
                      <button className='font-semibold px-4 py-1 bg-gray-900 rounded-full' onClick={() => setSelectPath([])}>clear selection</button>
                    </div>
                    {
                      selectPath.length > 0 && <div>
                        <p>preview</p>
                        <div className='flex items-center gap-8'>
                          <img src={preview} alt="preview" className="w-32 h-32 rounded-xl border" />
                          <div className='flex-col gap-4 hidden'>
                            <div>
                              <p>Land name</p>
                              <Input value={landName} setValue={setLandName} />
                            </div>
                            <div>
                              <p>Land Description</p>
                              <Input value={landDesc} setValue={setLandDesc} />
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                    <div className='flex gap-2 items-center justify-between'>
                      <div className='flex gap-2 items-center'>
                        <p className='text-2xl'>Price per Land {context.unitCoast}  USDT</p>
                      </div>
                      <FontAwesomeIcon icon={faInfoCircle} size='lg' className='' />
                    </div>
                    <div className='flex gap-2'>
                      <p className='text-gray-300'>{address}</p>
                    </div>
                    <div className='text-gray-300 flex gap-4'>
                      <p>{viewport.longitude}</p>
                      <p>{viewport.latitude}</p>
                    </div>
                    <div className='flex gap-2 flex-col justify-end items-end'>
                      <div className='flex gap-2 w-1/2'>
                        <p className='text-gray-300 w-28'>TOTAL</p>
                        <p className=''>{landPrice} USDT</p>
                      </div>
                      <div className='flex gap-2 w-1/2'>
                        <p className='text-gray-300 w-28'>Current Owner</p>
                        <p className=''>-</p>
                      </div>
                    </div>
                  </div>
                  <div className='bg-black p-6 rounded-b-xl flex flex-col gap-4 bg-opacity-70'>
                    <PrimaryButton className="w-full uppercase text-xl" onClick={() => {
                      if (context.address)
                        if (context.user.role === "admin")
                          freeMintNFT()
                        else {
                          mintNFT()
                        }
                      else if (!context.wallet || !context.wallet.provider)
                        context.onBoard.walletSelect()
                      else if (context.wallet.provider)
                        context.onBoard.walletCheck()
                    }}>{context.address ? "buy now" : "Connect Wallet"}</PrimaryButton>
                  </div>
                </div>
                <img src={WhiteLogo} className='opacity-50' />
              </div>
              }
            </div>
          }
        </div>
        {!expand && <div className='w-16 h-screen fixed right-0 bg-opacity-50 bg-gray-900 flex flex-col items-center py-2 gap-4 select-none'>
          <button className='p-2 text-white rounded-full bg-white bg-opacity-10 w-12 h-12 hover:bg-app-primary-100 outline-none' onClick={() => setExpand(true)}>
            <FontAwesomeIcon icon={faAngleLeft} />
          </button>
          <CommonButton onClick={() => setExpand(true)}>
            <FontAwesomeIcon size='1x' icon={faSearch} />
          </CommonButton>
          <CommonButton onClick={() => setExpand(true)}>
            <FontAwesomeIcon size='1x' icon={faEye} />
          </CommonButton>
          <CommonButton onClick={() => handleCross()}>
            <FontAwesomeIcon size='1x' icon={faLocationCrosshairs} />
          </CommonButton>
          <div className='flex gap-20 flex-col'>
            <FontAwesomeIcon icon={faMicrochip} size='1x' className='text-white mt-8' />
            <p className='text-white font-bold transform rotate-90 uppercase whitespace-nowrap text-xl'>Tiles selected :</p>
          </div>
        </div>}
      </div>
    </Layout >
  )
}

export default HomePage