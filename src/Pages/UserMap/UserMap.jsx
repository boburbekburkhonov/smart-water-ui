import React, { useEffect, useState } from "react";
import { useMemo } from "react";
import {
  GoogleMap,
  useLoadScript,
  MarkerF,
  InfoWindowF,
  MarkerClusterer,
} from "@react-google-maps/api";
import circleBlue from "../../assets/images/record.png";
import circleRed from "../../assets/images/circle-red.png";
import locationRed from "../../assets/images/location-red.png";
import locationGreen from "../../assets/images/location-green.png";
import locationYellow from "../../assets/images/location-yellow.png";
import locationOrange from "../../assets/images/location-orange.png";
import { api } from "../Api/Api";
import axios from "axios";
import "./UserMap.css";

const UserMap = () => {
  const [lastData, setLastData] = useState([]);
  const [lastDataLength, setLastDataLength] = useState(0);
  const [lastDataForList, setLastDataForList] = useState([]);
  const [oneLastData, setOneLastData] = useState([]);
  const [count, setCount] = useState(1);
  const [zoom, setZoom] = useState(6);
  const [active, setActive] = useState(-1);
  const [location, setLocation] = useState({
    lat: 42.00000000048624,
    lng: 63.999999999999986,
  });
  const [activeMarker, setActiveMarker] = useState();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey:
      "AIzaSyC57hT2pRJZ4Gh85ai0sUjP72i7VYJxTHc&region=UZ&language=uz",
  });
  const center = useMemo(() => location, [count]);
  const role = window.localStorage.getItem("role");

  // ! CUSTOM FETCH
  const customFetch = axios.create({
    baseURL: api,
    headers: {
      "Content-type": "application/json",
    },
  });

  // ! ADD HEADER TOKEN
  customFetch.interceptors.request.use(
    async (config) => {
      const token = window.localStorage.getItem("accessToken");
      if (token) {
        config.headers["Authorization"] = ` bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // ! REFRESH TOKEN
  const refreshToken = async () => {
    try {
      const requestToken = await fetch(`${api}/auth/signin`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          username: window.localStorage.getItem("username"),
          password: window.localStorage.getItem("password"),
        }),
      });

      const responToken = await requestToken.json();
      return responToken.data.accessToken;
    } catch (e) {
      console.log("refreshToken", "Error", e);
    }
  };

  // ! GET ACCESS TOKEN
  customFetch.interceptors.response.use(
    (response) => {
      return response;
    },
    async function (error) {
      const originalRequest = error.config;
      if (
        (error.response?.status === 403 && !originalRequest._retry) ||
        (error.response?.status === 401 && !originalRequest._retry)
      ) {
        originalRequest._retry = true;

        const resp = await refreshToken();

        const access_token = resp;

        window.localStorage.setItem("accessToken", access_token);

        customFetch.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${access_token}`;
        return customFetch(originalRequest);
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const getLastData = async () => {
      let end = true;
      let page = 1;

      while (end) {
        // ! LAST DATA
        const requestLastData = await customFetch.get(
          `/last-data/getLastData?page=${page}&perPage=${20}`
        );

        if (requestLastData.data.data.length > 0) {
          requestLastData.data.data.forEach((e) => {
            lastData.push(e);
            lastDataForList.push(e);
          });
          setLastDataLength(lastData.length);
          page++;
        } else if (requestLastData.data.data.length == 0) {
          end = false;
        }
      }
    };

    getLastData();
  }, []);

  const handleActiveMarker = (marker) => {
    if (marker === activeMarker) {
      return;
    }
    setActiveMarker(marker);
  };

  const checkStationWorkingOrNot = (value) => {
    const presentDate = new Date();
    let startDate = new Date(value?.date);
    startDate.setHours(startDate.getHours() - 5);

    if (value?.level == undefined) {
      return 404;
    } else if (
      startDate.getFullYear() == presentDate.getFullYear() &&
      startDate.getMonth() == presentDate.getMonth()
    ) {
      return presentDate.getDate() - startDate.getDate();
    } else if (
      (startDate.getFullYear() == presentDate.getFullYear() &&
        presentDate.getMonth() - startDate.getMonth() == 1 &&
        presentDate.getDate() == 2 &&
        30 <= startDate.getDate() &&
        startDate.getDate() <= 31) ||
      (startDate.getFullYear() == presentDate.getFullYear() &&
        presentDate.getMonth() - startDate.getMonth() == 1 &&
        presentDate.getDate() == 1 &&
        29 <= startDate.getDate() &&
        startDate.getDate() <= 31)
    ) {
      return 1;
    }
  };

  const changeDataWithInput = (inputValue) => {
    const search = lastData.filter((e) =>
      e.name.toLowerCase().includes(inputValue)
    );
    if (search.length > 0) {
      setLastDataForList(search);
      setActive(null);
    }
  };

  const zoomLocation = (station) => {
    setOneLastData([station]);
    setCount(count + 1);
    const lat = Number(station.location.split("-")[0]);
    const lng = Number(station.location.split("-")[1]);
    setLocation({ lat: lat, lng: lng });
    setZoom(14);
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <section className="home-section py-3">
      <div className="container-fluid">
        <div>
          <div className="card">
            {lastData.length > 0 ? (
              <div className="d-flex justify-content-between">
                <GoogleMap id="map-container" zoom={zoom} center={center}>
                  {lastData?.length > 0 && (
                    <MarkerClusterer>
                      {(clusterer) =>
                        lastData?.map((e, i) => {
                          return (
                            <MarkerF
                              clusterer={clusterer}
                              key={i}
                              position={{
                                lat: Number(e.location?.split("-")[0]),
                                lng: Number(e.location?.split("-")[1]),
                              }}
                              title={e.name}
                              onClick={() => handleActiveMarker(e._id)}
                            >
                              {activeMarker == e._id ? (
                                <InfoWindowF
                                  className="w-100"
                                  onCloseClick={() => {
                                    setActiveMarker(null);
                                  }}
                                  options={{ maxWidth: "240" }}
                                >
                                  {e.lastData != undefined ? (
                                    <div>
                                      <h3 className="fw-semibold text-success fs-6">
                                        {e.name}
                                      </h3>

                                      <div className="d-flex align-items-center mb-1">
                                        <img
                                          src={circleBlue}
                                          alt="circleBlue"
                                          width={12}
                                          height={12}
                                        />
                                        <p className="m-0 infowindow-desc ms-1 me-1 ">
                                        Sath:
                                        </p>{" "}
                                        <span className="infowindow-span">
                                          {Number(e.lastData.level).toFixed(2)} sm
                                        </span>
                                      </div>

                                      <div className="d-flex align-items-center mb-1">
                                        <img
                                          src={circleBlue}
                                          alt="circleBlue"
                                          width={12}
                                          height={12}
                                        />
                                        <p className="infowindow-desc m-0 ms-1 me-1">
                                        Hajm:
                                        </p>{" "}
                                        <span className="infowindow-span">
                                          {Number(
                                            e.lastData.volume
                                          ).toFixed(2)} m³/s
                                        </span>
                                      </div>

                                      <div className="d-flex align-items-center mb-1">
                                        <img
                                          src={circleBlue}
                                          alt="circleBlue"
                                          width={12}
                                          height={12}
                                        />
                                        <p className="m-0 infowindow-desc ms-1 me-1 ">
                                        Tuzatish:
                                        </p>{" "}
                                        <span className="infowindow-span">
                                          {Number(e.lastData.correction).toFixed(2)}{" "}
                                        </span>
                                      </div>

                                      <div className="d-flex align-items-center">
                                        <img
                                          src={circleBlue}
                                          alt="circleBlue"
                                          width={12}
                                          height={12}
                                        />
                                        <p className="m-0 infowindow-desc ms-1 me-1">
                                          Sana:
                                        </p>{" "}
                                        <span className="infowindow-span">
                                          {e.lastData.date.split("-")[0]}/
                                          {e.lastData.date.split("-")[1]}/
                                          {e.lastData.date
                                            .split("-")[2]
                                            .slice(0, 2)}{" "}
                                          {
                                            e.lastData.date
                                              .split("T")[1]
                                              .split(":")[0]
                                          }
                                          :
                                          {
                                            e.lastData.date
                                              .split("T")[1]
                                              .split(":")[1]
                                          }
                                          :
                                          {e.lastData.date
                                            .split("T")[1]
                                            .split(":")[2]
                                            .slice(0, 2)}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <h3 className="fw-semibold text-success fs-6 text-center">
                                        {e.name}
                                      </h3>
                                      <div className="d-flex align-items-center justify-content-center">
                                        <img
                                          src={circleRed}
                                          alt="circleBlue"
                                          width={18}
                                          height={18}
                                        />
                                        <p className="m-0 infowindow-desc-not-last-data fs-6 ms-1 me-1 ">
                                          Ma'lumot kelmagan...
                                        </p>
                                      </div>{" "}
                                    </div>
                                  )}
                                </InfoWindowF>
                              ) : null}
                            </MarkerF>
                          );
                        })
                      }
                    </MarkerClusterer>
                  )}

                  {oneLastData?.map((e, i) => {
                    return (
                      <MarkerF
                        key={i}
                        position={{
                          lat: Number(e.location?.split("-")[0]),
                          lng: Number(e.location?.split("-")[1]),
                        }}
                        title={e.name}
                        onClick={() => handleActiveMarker(e._id)}
                      >
                        {activeMarker == e._id ? (
                          <InfoWindowF
                            className="w-100"
                            onCloseClick={() => {
                              setActiveMarker(null);
                            }}
                            options={{ maxWidth: "240" }}
                          >
                            {e.lastData != undefined ? (
                              <div>
                                <h3 className="fw-semibold text-success fs-6">
                                  {e.name}
                                </h3>

                                <div className="d-flex align-items-center mb-1">
                                  <img
                                    src={circleBlue}
                                    alt="circleBlue"
                                    width={12}
                                    height={12}
                                  />
                                  <p className="m-0 infowindow-desc ms-1 me-1">
                                  Sath:
                                  </p>{" "}
                                  <span className="infowindow-span">
                                    {Number(e.lastData.level).toFixed(2)} sm
                                  </span>
                                </div>

                                <div className="d-flex align-items-center mb-1">
                                  <img
                                    src={circleBlue}
                                    alt="circleBlue"
                                    width={12}
                                    height={12}
                                  />
                                  <p className="infowindow-desc m-0 ms-1 me-1">
                                  Hajm:
                                  </p>{" "}
                                  <span className="infowindow-span">
                                    {Number(e.lastData.volume).toFixed(2)} m³/s
                                  </span>
                                </div>

                                <div className="d-flex align-items-center mb-1">
                                  <img
                                    src={circleBlue}
                                    alt="circleBlue"
                                    width={12}
                                    height={12}
                                  />
                                  <p className="m-0 infowindow-desc ms-1 me-1 ">
                                  Tuzatish:
                                  </p>{" "}
                                  <span className="infowindow-span">
                                    {Number(e.lastData.correction).toFixed(2)}
                                  </span>
                                </div>

                                <div className="d-flex align-items-center">
                                  <img
                                    src={circleBlue}
                                    alt="circleBlue"
                                    width={12}
                                    height={12}
                                  />
                                  <p className="m-0 infowindow-desc ms-1 me-1">
                                    Sana:
                                  </p>{" "}
                                  <span className="infowindow-span">
                                    {e.lastData.date.split("-")[0]}/
                                    {e.lastData.date.split("-")[1]}/
                                    {e.lastData.date.split("-")[2].slice(0, 2)}{" "}
                                    {
                                      e.lastData.date
                                        .split("T")[1]
                                        .split(":")[0]
                                    }
                                    :
                                    {
                                      e.lastData.date
                                        .split("T")[1]
                                        .split(":")[1]
                                    }
                                    :
                                    {e.lastData.date
                                      .split("T")[1]
                                      .split(":")[2]
                                      .slice(0, 2)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <h3 className="fw-semibold text-success fs-6 text-center">
                                  {e.name}
                                </h3>
                                <div className="d-flex align-items-center justify-content-center">
                                  <img
                                    src={circleRed}
                                    alt="circleBlue"
                                    width={18}
                                    height={18}
                                  />
                                  <p className="m-0 infowindow-desc-not-last-data fs-6 ms-1 me-1 ">
                                    Ma'lumot kelmagan...
                                  </p>
                                </div>{" "}
                              </div>
                            )}
                          </InfoWindowF>
                        ) : null}
                      </MarkerF>
                    );
                  })}
                </GoogleMap>
                <div className="map-station-wrapper-list">
                  <h5 className="m-0 text-center py-3 text-primary main-color d-flex justify-content-evenly">
                    Umumiy stansiyalar{" "}
                    <span className="text-danger fw-semibold">
                      {lastData?.length}
                    </span>{" "}
                    ta
                  </h5>
                  <div className="admin-map-search">
                    <h5 className="text-primary main-color">Qidiruv</h5>
                    <input
                      onChange={(e) =>
                        changeDataWithInput(e.target.value.toLowerCase())
                      }
                      type="text"
                      className="form-control"
                      placeholder="search..."
                    />
                  </div>
                  <ul className="list-group list-unstyled m-0">
                    {lastDataForList?.map((e, i) => {
                      return (
                        <li
                          className={`list-group-item list-group-item-action d-flex align-items-center ${
                            active == i ? "active-user-map" : ""
                          }`}
                          key={i}
                          onClick={() => {
                            setActive(i);
                            zoomLocation(e);
                          }}
                        >
                          <img
                            src={
                              checkStationWorkingOrNot(e.lastData) == 0
                                ? locationGreen
                                : checkStationWorkingOrNot(e.lastData) <= 3
                                ? locationYellow
                                : checkStationWorkingOrNot(e.lastData) == 404
                                ? locationRed
                                : locationOrange
                            }
                            alt="circleBlue"
                            width={25}
                            height={25}
                          />
                          <p className="m-0 ms-2">{e.name}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="user-map-animation-wrapper">
                <div id="box">
                  <div id="tile01">
                    <div id="mask">Smart Solutions System</div>
                  </div>
                </div>

                <div className="wrap">
                  <div className="drop-outer">
                    <svg
                      className="drop"
                      viewBox="0 0 40 40"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="20" cy="20" r="20" />
                    </svg>
                  </div>
                  <div className="ripple ripple-1">
                    <svg
                      className="ripple-svg"
                      viewBox="0 0 60 60"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="30" cy="30" r="24" />
                    </svg>
                  </div>
                  <div className="ripple ripple-2">
                    <svg
                      className="ripple-svg"
                      viewBox="0 0 60 60"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="30" cy="30" r="24" />
                    </svg>
                  </div>
                  <div className="ripple ripple-3">
                    <svg
                      className="ripple-svg"
                      viewBox="0 0 60 60"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="30" cy="30" r="24" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserMap;