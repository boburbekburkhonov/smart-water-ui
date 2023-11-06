import React, { useRef } from "react";
import { Chart as Chartjs, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut, getElementsAtEvent } from "react-chartjs-2";
import circleBlue from "../../assets/images/record.png";
import circleGreen from "../../assets/images/circle.png";
import circleGreenBlue from "../../assets/images/circle-green-blue.png";
import circleOrange from "../../assets/images/circle-orange.png";
import circleRed from "../../assets/images/circle-red.png";
import circleYellow from "../../assets/images/circle-yellow.png";
import fullScreen from "../../assets/images/fullscreen.png";
import { useEffect } from "react";
import { api } from "../Api/Api";
import { useState } from "react";
import excel from "../../assets/images/excel.png";
import * as XLSX from "xlsx";
import axios from "axios";
import { Helmet, HelmetProvider } from "react-helmet-async";
import "./UserDashboard.css";

Chartjs.register(ArcElement, Tooltip, Legend);

const UserDashboard = (prop) => {
  const { balanceOrg } = prop;
  const name = window.localStorage.getItem("name");
  const role = window.localStorage.getItem("role");
  const [loader, setLoader] = useState(false);
  const [dataOrStation, setDataOrStation] = useState("data");
  const [stationBattery, setStationBattery] = useState([]);
  const [stationStatistic, settationStatistic] = useState([]);
  const [viewStation, setViewStation] = useState([]);
  const [viewStationLimit, setViewStationLimit] = useState([]);
  const [viewStationByChar, setViewStationByChar] = useState([]);
  const [viewStationByCharLimit, setViewStationByCharLimit] = useState([]);
  const [whichStation, setWhichStation] = useState("allStation");
  const [tableTitle, setTableTitle] = useState("Umumiy stansiyalar soni");
  const chartRef = useRef();

  balanceOrg.find((e) => {
    if (e.id == name) {
      window.localStorage.setItem("balanceOrgName", e.name);
    }
  });
  const balanceOrgName = localStorage.getItem("balanceOrgName");

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
      return responToken.data?.accessToken;
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
    const userDashboardFunc = async () => {
      // ! STATION STATISTIC
      const requestStationStatistic = await customFetch.get(
        `/last-data/getStatisticStations`
      );
      settationStatistic(requestStationStatistic.data.data);
    };

    userDashboardFunc();

    customFetch
      .get(`/stations/getStatisticStationsByBattery`)
      .then((data) => setStationBattery(data.data.data));
  }, []);

  return (
    <HelmetProvider>
      Dashboard
      <Helmet>
        <script src="../src/assets/js/menuBar.js"></script>
      </Helmet>
    </HelmetProvider>
  );
};

export default UserDashboard;
