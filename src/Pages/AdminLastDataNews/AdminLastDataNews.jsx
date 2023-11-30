import React, { useEffect, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import excel from "../../assets/images/excel.png";
import statistic from "../../assets/images/stats.png";
import pdf from "../../assets/images/pdf.jpg";
import location from "../../assets/images/location-google.png";
import "./AdminLastDataNews.css";
import {
  GoogleMap,
  InfoWindowF,
  MarkerF,
  useLoadScript,
} from "@react-google-maps/api";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { useParams } from "react-router-dom";
import { api } from "../Api/Api";
import * as XLSX from "xlsx";
import circleRed from "../../assets/images/circle-red.png";
import circleBlue from "../../assets/images/record.png";
import moment from "moment";
import "moment/dist/locale/uz-latn";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";

moment.locale("uz-latn");

const AdminLastDataNews = () => {
    const { news } = useParams();
    const [loader, setLoader] = useState(false);
    const [searchBetweenData, setSearchBetweenData] = useState([]);
    const [todayData, setTodayData] = useState([]);
    const [yesterdayData, setYesterdayData] = useState([]);
    const [dailyData, setDailyData] = useState([]);
    const [monthData, setMonthData] = useState([]);
    const [valueStatistic, setValueStatistic] = useState("level");
    const [activeMarker, setActiveMarker] = useState();
    const stationName = localStorage.getItem("stationName");
    const locationStation = localStorage.getItem("location");
    const [whichData, setWhichData] = useState("hour");
    const valueYear = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentyabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr",
    ];
    const dateSearch = new Date();
    dateSearch.setDate(new Date().getDate() - 4);

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
    const todayData = async () => {
      const request = await customFetch.get(
        `/mqttDataWrite/getTodayDataByStationId?stationId=${news}`
      );

      setTodayData(request.data.data);
    };

    todayData();

    const date = new Date();

    // ! MONTH DATA
    customFetch
      .get(
        `/monthlyData/getStationDataByYearAndStationId?year=${date.getFullYear()}&stationsId=${news}`
      )
      .then((data) => setMonthData(data.data.stations));

    // ! DAILY DATA
    customFetch
      .get(
        `/dailyData/getStationDailyDataById?stationId=${news}&month=${new Date()
          .toISOString()
          .substring(0, 7)}`
      )
      .then((data) => setDailyData(data.data.data));

    // ! YESTERDAY DATA
    customFetch
      .get(`/yesterdayData/getYesterdayDataByStationId?stationId=${news}`)
      .then((data) => setYesterdayData(data.data.data));

    // ! SEARCH DATA
    customFetch
      .get(
        `/allData/getStationIdAndTwoDayBetween?firstDay=${dateSearch
          .toISOString()
          .substring(0, 10)}&stationsId=${news}&secondDay=${new Date()
          .toISOString()
          .substring(0, 10)}`
      )
      .then((data) => {
        setSearchBetweenData(data.data.data);
      });
  }, []);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey:
      "AIzaSyC57hT2pRJZ4Gh85ai0sUjP72i7VYJxTHc&region=UZ&language=uz",
  });

  const handleActiveMarker = (marker) => {
    if (marker === activeMarker) {
      return;
    }
    setActiveMarker(marker);
  };

  if (!isLoaded) return <div>Loading...</div>;

  const labels =
    whichData == "hour"
      ? todayData.map((e) => e.date.split(" ")[1]).reverse()
      : whichData == "yesterday"
      ? yesterdayData.map((e) => e.date.split(" ")[1]).reverse()
      : whichData == "daily"
      ? dailyData.map((e) => e.date.split("-")[2].slice(0, 2)).reverse()
      : whichData == "search-between"
      ? searchBetweenData.map((e) => e.date.split("-")[2].slice(0, 2)).reverse()
      : whichData == "monthly"
      ? monthData?.map((e) => {
          const foundNameMonth = valueYear.find(
            (r, i) => i + 1 == e.monthNumber
          );

          return foundNameMonth;
        }).reverse()
      : null;

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Bugungi ma'lumotlar",
        data:
          whichData == "hour"
            ? todayData.map((e) => e[valueStatistic]).reverse()
            : whichData == "yesterday"
            ? yesterdayData.map((e) => e[valueStatistic]).reverse()
            : whichData == "daily"
            ? dailyData.map((e) => e[valueStatistic]).reverse()
            : whichData == "search-between"
            ? searchBetweenData.map((e) => e[valueStatistic]).reverse()
            : whichData == "monthly"
            ? monthData.map((e) => e[valueStatistic]).reverse()
            : null,
        fill: false,
        borderColor: "#0091D5",
        backgroundColor: "#7cc9ed",
        tension: 0.4,
      },
    ],
  };

  const scalesMinMaxLine = () => {
    if(whichData == 'hour'){
      if(todayData.length > 0){
        const resultData = []
        todayData.forEach(e => {
          resultData.push(e[valueStatistic]);
        })

        return {
          min: Math.min(...resultData),
          max: Math.max(...resultData)
        }
      }else {
        return {
          min: 0,
          max: 0
        }
      }
    } else if(whichData == 'yesterday'){
      if(yesterdayData.length > 0) {
        const resultData = []
        yesterdayData.forEach(e => {
          resultData.push(e[valueStatistic]);
        })

        return {
          min: Math.min(...resultData),
          max: Math.max(...resultData)
        }
      }else {
        return {
          min: 0,
          max: 0
        }
      }
    } else if(whichData == 'daily'){
      if(dailyData.length > 0) {
        const resultData = []
        dailyData.forEach(e => {
          resultData.push(e[valueStatistic]);
        })

        return {
          min: Math.min(...resultData),
          max: Math.max(...resultData)
        }
      }else {
        return {
          min: 0,
          max: 0
        }
      }
    } else if(whichData == 'monthly'){
      if(monthData.length > 0) {
        const resultData = []
        monthData.forEach(e => {
          resultData.push(e[valueStatistic]);
        })

        return {
          min: Math.min(...resultData),
          max: Math.max(...resultData)
        }
      }else {
        return {
          min: 0,
          max: 0
        }
      }
    } else if(whichData == 'search-between'){
      if(searchBetweenData.length > 0) {
        const resultData = []
        searchBetweenData.forEach(e => {
          resultData.push(e[valueStatistic]);
        })

        return {
          min: Math.min(...resultData),
          max: Math.max(...resultData)
        }
      }else {
        return {
          min: 0,
          max: 0
        }
      }
    }
  }

  const option = {
    scales: {
      y: {
        min: scalesMinMaxLine().min - 20,
        max: scalesMinMaxLine().max + 20
      }
    },
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        boxHeight: 25,
        boxWidth: 40,
        titleFont: {
          size: 16,
        },
        bodyFont: {
          size: 16,
        },
        callbacks: {
          label: function (context) {
            return `Ko'rsatgich: ${context.formattedValue}`;
          },
        },
      },
    },
  };

  // ! SAVE DATA PDF
  const exportNewsByPdf = () => {
    const doc = new jsPDF();
    const fixedDate = new Date();

    const resultDate = `${fixedDate.getDate()}/${
      fixedDate.getMonth() + 1
    }/${fixedDate.getFullYear()} ${fixedDate.getHours()}:${
      String(fixedDate.getMinutes()).length == 1
        ? "0" + fixedDate.getMinutes()
        : fixedDate.getMinutes()
    }`;

    if (whichData == "hour") {
      doc.text(`${stationName} qurilmaning bugungi ma'lumotlar`, 20, 10);

      doc.autoTable({
        theme: "striped",
        columns: [
          { header: "Sath (sm)", dataKey: "level" },
          { header: "Hajm (m³/s)", dataKey: "volume" },
          { header: "Tuzatish", dataKey: "correction" },
          { header: "Sana", dataKey: "date" },
        ],
        body: todayData,
        headStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
        bodyStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
      });

      if (todayData.length > 0) {
        doc.save(`${stationName} ning bugungi ma'lumotlari ${resultDate}.pdf`);
      }
    } else if (whichData == "daily") {
      doc.text(`${stationName} qurilmaning kunlik ma'lumotlar`, 20, 10);

      doc.autoTable({
        theme: "striped",
        columns: [
          { header: "Sath (sm)", dataKey: "level" },
          { header: "Hajm (m³/s)", dataKey: "volume" },
          { header: "Oy", dataKey: "date" },
        ],
        body: dailyData,
        headStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
        bodyStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
      });

      if (dailyData.length > 0) {
        doc.save(`${stationName} ning kunlik ma'lumotlari ${resultDate}.pdf`);
      }
    } else if (whichData == "monthly") {
      doc.text(`${stationName} qurilmaning oylik ma'lumotlar`, 20, 10);

      doc.autoTable({
        theme: "striped",
        columns: [
          { header: "Sath (sm)", dataKey: "level" },
          { header: "Hajm (m³/s)", dataKey: "volume" },
          { header: "Oy", dataKey: "monthNumber" },
        ],
        body: monthData,
        headStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
        bodyStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
      });

      if (monthData.length > 0) {
        doc.save(`${stationName} ning oylik ma'lumotlari ${resultDate}.pdf`);
      }
    } else if (whichData == "yesterday") {
      doc.text(`${stationName} qurilmaning kecha kelgan ma'lumotlar`, 20, 10);

      doc.autoTable({
        theme: "striped",
        columns: [
          { header: "Sath (sm)", dataKey: "level" },
          { header: "Hajm (m³/s)", dataKey: "volume" },
          { header: "Tuzatish", dataKey: "correction" },
          { header: "Sana", dataKey: "date" },
        ],
        body: yesterdayData,
        headStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
        bodyStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
      });

      if (yesterdayData.length > 0) {
        doc.save(`${stationName} ning kecha kelgan ma'lumotlari ${resultDate}.pdf`);
      }
    } else if (whichData == "search-between") {
      doc.text(`${stationName} ning ma'lumotlari`, 20, 10);

      doc.autoTable({
        theme: "striped",
        columns: [
          { header: "Sath (sm)", dataKey: "level" },
          { header: "Hajm (m³/s)", dataKey: "volume" },
          { header: "Tuzatish", dataKey: "correction" },
          { header: "Sana", dataKey: "date" },
        ],
        body: searchBetweenData,
        headStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
        bodyStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
      });

      if (searchBetweenData.length > 0) {
        doc.save(`${stationName} ning ma'lumotlari ${resultDate}.pdf`);
      }
    }
  };

  // ! SAVE DATA EXCEL
  const exportDataToExcel = () => {
    let sath = "sath (sm)";
    let hajm = "hajm (m³/s)";
    let tuzatish = "tuzatish";
    const fixedDate = new Date();

    const resultDate = `${fixedDate.getDate()}/${
      fixedDate.getMonth() + 1
    }/${fixedDate.getFullYear()} ${fixedDate.getHours()}:${
      String(fixedDate.getMinutes()).length == 1
        ? "0" + fixedDate.getMinutes()
        : fixedDate.getMinutes()
    }`;

    if (whichData == "hour") {
      const resultData = [];

      todayData.forEach((e) => {
        resultData.push({
          nomi: stationName,
          [sath]: Number(e.level).toFixed(2),
          [hajm]: Number(e.volume).toFixed(2),
          [tuzatish]: Number(e.correction),
          sana: e.date,
        });
      });

      const workBook = XLSX.utils.book_new();
      const workSheet = XLSX.utils.json_to_sheet(resultData);

      XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

      if (todayData.length > 0) {
        XLSX.writeFile(
          workBook,
          `${stationName} ning bugungi ma'lumotlari ${resultDate}.xlsx`
        );
      }
    } else if (whichData == "daily") {
      const resultData = [];

      dailyData.forEach((e) => {
        resultData.push({
          nomi: stationName,
          [sath]: Number(e.level).toFixed(2),
          [hajm]: Number(e.volume).toFixed(2),
          sana: e.date.split(" ")[0],
        });
      });

      const workBook = XLSX.utils.book_new();
      const workSheet = XLSX.utils.json_to_sheet(resultData);

      XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

      if (dailyData.length > 0) {
        XLSX.writeFile(
          workBook,
          `${stationName} ning kunlik ma'lumotlari ${resultDate}.xlsx`
        );
      }
    } else if (whichData == "monthly") {
      const resultData = [];

      monthData.forEach((e) => {
        resultData.push({
          nomi: stationName,
          [sath]: Number(e.level).toFixed(2),
          [hajm]: Number(e.volume).toFixed(2),
          oy: valueYear.find((r, i) => i + 1 == e.monthNumber),
        });
      });

      const workBook = XLSX.utils.book_new();
      const workSheet = XLSX.utils.json_to_sheet(resultData);

      XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

      if (monthData.length > 0) {
        XLSX.writeFile(
          workBook,
          `${stationName} ning oylik ma'lumotlari ${resultDate}.xlsx`
        );
      }
    } else if (whichData == "yesterday") {
      const resultData = [];

      yesterdayData.forEach((e) => {
        resultData.push({
          nomi: stationName,
          [sath]: Number(e.level).toFixed(2),
          [hajm]: Number(e.volume).toFixed(2),
          [tuzatish]: Number(e.correction),
          sana: e.date.split(" ")[1],
        });
      });

      const workBook = XLSX.utils.book_new();
      const workSheet = XLSX.utils.json_to_sheet(resultData);

      XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

      if (yesterdayData.length > 0) {
        XLSX.writeFile(
          workBook,
          `${stationName} ning kecha kelgan ma'lumotlari ${resultDate}.xlsx`
        );
      }
    } else if (whichData == "search-between") {
      const resultData = [];

      searchBetweenData.forEach((e) => {
        resultData.push({
          nomi: stationName,
          [sath]: Number(e.level).toFixed(2),
          [hajm]: Number(e.volume).toFixed(2),
          [tuzatish]: Number(e.correction),
          sana: e.date.split(" ")[0],
        });
      });

      const workBook = XLSX.utils.book_new();
      const workSheet = XLSX.utils.json_to_sheet(resultData);

      XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

      if (searchBetweenData.length > 0) {
        XLSX.writeFile(
          workBook,
          `${stationName} ning ma'lumotlari ${resultDate}.xlsx`
        );
      }
    }
  };

  const changeDailyData = (month) => {
    customFetch
      .get(
        `/dailyData/getStationDailyDataById?stationId=${news}&month=${month}`
      )
      .then((data) => setDailyData(data.data.data));
  };

  const searchBetweenForm = (e) => {
    setLoader(true);
    e.preventDefault();

    const { dateStart, dateEnd } = e.target;

    customFetch
      .get(
        `/allData/getStationIdAndTwoDayBetween?firstDay=${dateStart.value}&stationsId=${news}&secondDay=${dateEnd.value}`
      )
      .then((data) => {
        setSearchBetweenData(data.data.data);
        setLoader(false);
      });
  };

    return (
        <HelmetProvider>
      {/* MODAL CHAR */}
      <div
        className="modal fade"
        id="staticBackdrop"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
        tabIndex="-1"
        aria-labelledby="staticBackdropLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog table-location-width-user-last-data-news modal-dialog-centered">
          <div className="modal-content modal-content-user-last-data">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="staticBackdropLabel">
                {stationName}
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">

              {
                whichData == 'daily' || whichData == 'monthly'
                ?
              <select
                onChange={(e) => setValueStatistic(e.target.value)}
                className="form-select select-user-last-data"
              >
                <option value="level">Sathi (sm)</option>
                <option value="volume">Hajm (g/l)</option>
              </select>
              :
              <select
                onChange={(e) => setValueStatistic(e.target.value)}
                className="form-select select-user-last-data"
              >
                <option value="level">Sathi (sm)</option>
                <option value="volume">Hajm (g/l)</option>
                <option value="correction">Tuzatish</option>
              </select>
              }

              <div className="char-statistic-frame m-auto">
                <Line
                  className="char-statistic-wrapper"
                  width={100}
                  height={50}
                  data={data}
                  options={option}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL MAP */}
      <div
        className="modal fade"
        id="modalMapId"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
        tabIndex="-1"
        aria-labelledby="modalMap"
        aria-hidden="true"
      >
        <div className="modal-dialog table-location-width-map modal-dialog-centered">
          <div className="modal-content modal-content-user-last-data-map">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="modalMap">
                {stationName} qurilmaning manzili
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="user-last-data-map-wrapper h-100">
                <GoogleMap
                  zoom={15}
                  center={{
                    lat: locationStation.split("-")[0] * 1,
                    lng: locationStation.split("-")[1] * 1,
                  }}
                  mapContainerclassName="user-last-data-map"
                >
                  <MarkerF
                    position={{
                      lat: locationStation.split("-")[0] * 1,
                      lng: locationStation.split("-")[1] * 1,
                    }}
                    title={stationName}
                    onClick={() => handleActiveMarker(1)}
                  >
                    {activeMarker == 1 ? (
                      <InfoWindowF
                        className="w-100"
                        onCloseClick={() => {
                          setActiveMarker(null);
                        }}
                        options={{ maxWidth: "240" }}
                      >
                        {whichData == "hour" ? (
                          todayData.length > 0 ? (
                            <div>
                              <h3 className="fw-semibold text-success fs-6">
                                {stationName}
                              </h3>

                              <div className="d-flex align-items-center mb-1">
                                <img
                                  src={circleBlue}
                                  alt="circleBlue"
                                  width={12}
                                  height={12}
                                />
                                <p className="infowindow-desc m-0 ms-1 me-1">
                                  Sath:
                                </p>{" "}
                                <span className="infowindow-span">
                                  {Number(todayData[0].level).toFixed(2)} sm
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
                                  Hajm:
                                </p>{" "}
                                <span className="infowindow-span">
                                  {Number(todayData[0].volume).toFixed(2)}{" "}
                                  m³/s
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
                                  {Number(todayData[0].correction)}
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
                                  Soat:
                                </p>{" "}
                                <span className="infowindow-span">
                                  {todayData[0].date?.split(" ")[1]}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h3 className="fw-semibold text-success fs-6 text-center">
                                {stationName}
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
                          )
                        ) : whichData == "monthly" ? (
                          monthData.length > 0 ? (
                            <div>
                              <h3 className="fw-semibold text-success fs-6">
                                {stationName}
                              </h3>

                              <div className="d-flex align-items-center mb-1">
                                <img
                                  src={circleBlue}
                                  alt="circleBlue"
                                  width={12}
                                  height={12}
                                />
                                <p className="infowindow-desc m-0 ms-1 me-1">
                                  Sath:
                                </p>{" "}
                                <span className="infowindow-span">
                                  {Number(monthData[0].level).toFixed(2)} sm
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
                                Hajm:
                                </p>{" "}
                                <span className="infowindow-span">
                                  {Number(monthData[0].volume).toFixed(2)}{" "}
                                  m³/s
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
                                  Oy:
                                </p>{" "}
                                <span className="infowindow-span">
                                  {valueYear.find(
                                    (e, i) => i + 1 == monthData[0].monthNumber
                                  )}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h3 className="fw-semibold text-success fs-6 text-center">
                                {stationName}
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
                          )
                        ) : whichData == "daily" ? (
                          dailyData.length > 0 ? (
                            <div>
                              <h3 className="fw-semibold text-success fs-6">
                                {stationName}
                              </h3>

                              <div className="d-flex align-items-center mb-1">
                                <img
                                  src={circleBlue}
                                  alt="circleBlue"
                                  width={12}
                                  height={12}
                                />
                                <p className="infowindow-desc m-0 ms-1 me-1">
                                  Sath:
                                </p>{" "}
                                <span className="infowindow-span">
                                  {Number(dailyData[0].level).toFixed(2)} sm
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
                                  Hajm:
                                </p>{" "}
                                <span className="infowindow-span">
                                  {Number(dailyData[0].volume).toFixed(2)}{" "}
                                  m³/s
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
                                  {dailyData[0].date.split(" ")[0]}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h3 className="fw-semibold text-success fs-6 text-center">
                                {stationName}
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
                          )
                        ) : whichData == "search-between" ? (
                          searchBetweenData.length > 0 ? (
                            <div>
                              <h3 className="fw-semibold text-success fs-6">
                                {stationName}
                              </h3>

                              <div className="d-flex align-items-center mb-1">
                                <img
                                  src={circleBlue}
                                  alt="circleBlue"
                                  width={12}
                                  height={12}
                                />
                                <p className="infowindow-desc m-0 ms-1 me-1">
                                  Sath:
                                </p>{" "}
                                <span className="infowindow-span">
                                  {Number(searchBetweenData[0].level).toFixed(
                                    2
                                  )}{" "}
                                  sm
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
                                Hajm :
                                </p>{" "}
                                <span className="infowindow-span">
                                  {Number(
                                    searchBetweenData[0].volume
                                  ).toFixed(2)}{" "}
                                m³/s
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
                                  {Number(searchBetweenData[0].correction)}{" "}
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
                                  {searchBetweenData[0].date.split(" ")[0]}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h3 className="fw-semibold text-success fs-6 text-center">
                                {stationName}
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
                          )
                        ) : whichData == "yesterday" ? (
                          yesterdayData.length > 0 ? (
                            <div>
                              <h3 className="fw-semibold text-success fs-6">
                                {stationName}
                              </h3>

                              <div className="d-flex align-items-center mb-1">
                                <img
                                  src={circleBlue}
                                  alt="circleBlue"
                                  width={12}
                                  height={12}
                                />
                                <p className="infowindow-desc m-0 ms-1 me-1">
                                  Sath:
                                </p>{" "}
                                <span className="infowindow-span">
                                  {Number(yesterdayData[0].level).toFixed(2)} sm
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
                                  Hajm:
                                </p>{" "}
                                <span className="infowindow-span">
                                  {Number(
                                    yesterdayData[0].volume
                                  ).toFixed(2)}{" "}
                               m³/s
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
                                  {Number(yesterdayData[0].correction)}
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
                                  Soat:
                                </p>{" "}
                                <span className="infowindow-span">
                                  {yesterdayData[0].date.split(" ")[1]}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h3 className="fw-semibold text-success fs-6 text-center">
                                {stationName}
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
                          )
                        ) : null}
                      </InfoWindowF>
                    ) : null}
                  </MarkerF>
                </GoogleMap>
              </div>
            </div>
          </div>
        </div>
      </div>
      <section className="home-section py-3">
        <div className="container-fluid">
          <div className="card">
            <div className="card-body pt-3">
              <ul className="nav nav-tabs nav-tabs-bordered">
                <li className="nav-item">
                  <button
                    className="nav-link active"
                    data-bs-toggle="tab"
                    data-bs-target="#profile-hour"
                    onClick={() => {
                      setValueStatistic('level')
                      setWhichData("hour")}}
                  >
                    Soatlik
                  </button>
                </li>

                <li className="nav-item">
                  <button
                    className="nav-link"
                    data-bs-toggle="tab"
                    data-bs-target="#profile-users-ten"
                    onClick={() => {
                      setValueStatistic('level')
                      setWhichData("yesterday")}}
                  >
                    Kecha kelgan
                  </button>
                </li>

                <li className="nav-item">
                  <button
                    className="nav-link"
                    data-bs-toggle="tab"
                    data-bs-target="#profile-users"
                    onClick={() => {
                      setValueStatistic('level')
                      setWhichData("daily")}}
                  >
                    Kunlik
                  </button>
                </li>

                <li className="nav-item">
                  <button
                    className="nav-link"
                    data-bs-toggle="tab"
                    data-bs-target="#profile-overview"
                    onClick={() => {
                      setValueStatistic('level')
                      setWhichData("monthly")}}
                  >
                    Oylik
                  </button>
                </li>

                <li className="nav-item">
                  <button
                    className="nav-link"
                    data-bs-toggle="tab"
                    data-bs-target="#profile-search-between"
                    onClick={() => {
                      setValueStatistic('level')
                      setWhichData("search-between")}}
                  >
                    Kun bo'yicha qidirish
                  </button>
                </li>
              </ul>

              <div className="tab-content">
                {/* HOUR */}
                <div
                  className="tab-pane fade show active profile-hour"
                  id="profile-hour"
                >
                  <div className="dashboard-table dashboard-table-user-last-data-news mt-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <h2 className="m-0 mb-3">
                        {stationName} ning bugun kelgan soatlik ma'lumotlari
                      </h2>
                      <div className="d-flex align-items-center ms-auto">
                        <a
                          className="ms-4"
                          href="#"
                          data-bs-toggle="modal"
                          data-bs-target="#staticBackdrop"
                        >
                          <img
                            src={statistic}
                            alt="pdf"
                            width={25}
                            height={30}
                          />
                        </a>
                        <a
                          className="ms-4"
                          data-bs-toggle="modal"
                          data-bs-target="#modalMapId"
                          href="#"
                        >
                          <img
                            src={location}
                            alt="pdf"
                            width={30}
                            height={30}
                          />
                        </a>
                        <button
                          onClick={() => exportNewsByPdf()}
                          className="ms-4 border border-0"
                        >
                          <img src={pdf} alt="pdf" width={23} height={30} />
                        </button>
                        <button
                          onClick={() => exportDataToExcel()}
                          className="ms-4 border border-0"
                        >
                          <img src={excel} alt="excel" width={26} height={30} />
                        </button>
                      </div>
                    </div>
                    {todayData.length > 0 ? (
                      <table className="table mt-4">
                        <thead>
                          <tr>
                            <th scope="col">Vaqt</th>
                            <th scope="col">Sath (sm)</th>
                            <th scope="col">Hajm (m³/s)</th>
                            <th scope="col">Tuzatish</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todayData.map((e, i) => {
                            return (
                              <tr key={i}>
                                <td>{e.date?.split(" ")[1]}</td>
                                <td>{Number(e.level).toFixed(2)}</td>
                                <td>{Number(e.volume).toFixed(2)}</td>
                                <td>{Number(e.correction)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="user-last-data-alert-wrapper d-flex align-items-center justify-content-center">
                        <div
                          className="alert alert-primary text-center fw-bold fs-5 w-100 user-last-data-alert"
                          role="alert"
                        >
                          Ma'lumot hozircha kelmagan...
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* DAILY */}
                <div className="tab-pane fade profile-users" id="profile-users">
                  <div className="dashboard-table dashboard-table-user-last-data-news mt-2">
                    <h2 className="m-0 mb-3">
                      {stationName} ning kunlik ma'lumotlari
                    </h2>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center ms-auto">
                        <input
                          onChange={(e) => changeDailyData(e.target.value)}
                          type="month"
                          className="form-control"
                          id="dateMonth"
                          name="dateDaily"
                          required
                          defaultValue={new Date()
                            .toISOString()
                            .substring(0, 7)}
                        />
                        <a
                          className="ms-4"
                          href="#"
                          data-bs-toggle="modal"
                          data-bs-target="#staticBackdrop"
                        >
                          <img
                            src={statistic}
                            alt="pdf"
                            width={25}
                            height={30}
                          />
                        </a>
                        <a
                          className="ms-4"
                          data-bs-toggle="modal"
                          data-bs-target="#modalMapId"
                          href="#"
                        >
                          <img
                            src={location}
                            alt="pdf"
                            width={30}
                            height={30}
                          />
                        </a>
                        <button
                          className="ms-4 border border-0"
                          onClick={() => exportNewsByPdf()}
                        >
                          <img src={pdf} alt="pdf" width={23} height={30} />
                        </button>
                        <button
                          className="ms-4 border border-0"
                          onClick={() => exportDataToExcel()}
                        >
                          <img src={excel} alt="excel" width={26} height={30} />
                        </button>
                      </div>
                    </div>
                    {dailyData.length > 0 ? (
                      <table className="table mt-4">
                        <thead>
                          <tr>
                            <th scope="col">Sana</th>
                            <th scope="col">Sath (sm)</th>
                            <th scope="col">Hajm (m³/s)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyData.map((e, i) => {
                            return (
                              <tr key={i}>
                                <td>{e.date.split(" ")[0]}</td>
                                <td>{Number(e.level).toFixed(2)}</td>
                                <td>{Number(e.volume).toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="user-last-data-alert-wrapper d-flex align-items-center justify-content-center">
                        <div
                          className="alert alert-primary text-center fw-bold fs-5 w-100 user-last-data-alert"
                          role="alert"
                        >
                          Ma'lumot hozircha kelmagan...
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* YESTERDAY */}
                <div
                  className="tab-pane fade profile-users-ten"
                  id="profile-users-ten"
                >
                  <div className="dashboard-table dashboard-table-user-last-data-news mt-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <h2 className="m-0 mb-3">
                        {stationName} ning kecha kelgan ma'lumotlari
                      </h2>
                      <div className="d-flex align-items-center ms-auto">
                        <a
                          className="ms-4"
                          href="#"
                          data-bs-toggle="modal"
                          data-bs-target="#staticBackdrop"
                        >
                          <img
                            src={statistic}
                            alt="pdf"
                            width={25}
                            height={30}
                          />
                        </a>
                        <a
                          className="ms-4"
                          data-bs-toggle="modal"
                          data-bs-target="#modalMapId"
                          href="#"
                        >
                          <img
                            src={location}
                            alt="pdf"
                            width={30}
                            height={30}
                          />
                        </a>
                        <button
                          className="ms-4 border border-0"
                          onClick={() => exportNewsByPdf()}
                        >
                          <img src={pdf} alt="pdf" width={23} height={30} />
                        </button>
                        <button
                          className="ms-4 border border-0"
                          onClick={() => exportDataToExcel()}
                        >
                          <img src={excel} alt="excel" width={26} height={30} />
                        </button>
                      </div>
                    </div>
                    {yesterdayData.length > 0 ? (
                      <table className="table mt-4">
                        <thead>
                          <tr>
                            <th scope="col">Vaqt</th>
                            <th scope="col">Sath (sm)</th>
                            <th scope="col">Hajm (m³/s)</th>
                            <th scope="col">Tuzatish</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yesterdayData.map((e, i) => {
                            return (
                              <tr key={i}>
                                <td>{e.date.split(" ")[1]}</td>
                                <td>{Number(e.level).toFixed(2)}</td>
                                <td>{Number(e.volume).toFixed(2)}</td>
                                <td>{Number(e.correction)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="user-last-data-alert-wrapper d-flex align-items-center justify-content-center">
                        <div
                          className="alert alert-primary text-center fw-bold fs-5 w-100 user-last-data-alert"
                          role="alert"
                        >
                          Ma'lumot hozircha kelmagan...
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* MONTHLY */}
                <div
                  className="tab-pane fade profile-overview"
                  id="profile-overview"
                >
                  <div className="dashboard-table dashboard-table-user-last-data-news mt-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <h2 className="m-0 mb-3">
                        {stationName} ning oylik ma'lumotlari
                      </h2>
                      <div className="d-flex align-items-center ms-auto">
                        <a
                          className="ms-4"
                          href="#"
                          data-bs-toggle="modal"
                          data-bs-target="#staticBackdrop"
                        >
                          <img
                            src={statistic}
                            alt="pdf"
                            width={25}
                            height={30}
                          />
                        </a>
                        <a
                          className="ms-4"
                          data-bs-toggle="modal"
                          data-bs-target="#modalMapId"
                          href="#"
                        >
                          <img
                            src={location}
                            alt="pdf"
                            width={30}
                            height={30}
                          />
                        </a>
                        <button
                          onClick={() => exportNewsByPdf()}
                          className="ms-4 border border-0"
                        >
                          <img src={pdf} alt="pdf" width={23} height={30} />
                        </button>
                        <button
                          onClick={() => exportDataToExcel()}
                          className="ms-4 border border-0"
                        >
                          <img src={excel} alt="excel" width={26} height={30} />
                        </button>
                      </div>
                    </div>
                    {monthData.length > 0 ? (
                      <table className="table mt-4">
                        <thead>
                          <tr>
                            <th scope="col">Oy</th>
                            <th scope="col">Sath (sm)</th>
                            <th scope="col">Hajm (m³/s)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthData.map((e, i) => {
                            return (
                              <tr key={i}>
                                <td>
                                  {valueYear.find(
                                    (r, i) => i + 1 == e.monthNumber
                                  )}
                                </td>
                                <td>{Number(e.level).toFixed(2)}</td>
                                <td>{Number(e.volume).toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="user-last-data-alert-wrapper d-flex align-items-center justify-content-center">
                        <div
                          className="alert alert-primary text-center fw-bold fs-5 w-100 user-last-data-alert"
                          role="alert"
                        >
                          Ma'lumot hozircha kelmagan...
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SEARCH */}
                <div
                  className="tab-pane fade profile-overview"
                  id="profile-search-between"
                >
                  <div className="dashboard-table dashboard-table-user-last-data-news mt-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <h2 className="m-0 mb-3">
                        {stationName} ning oylik ma'lumotlari
                      </h2>
                      <div className="d-flex align-items-center ms-auto">
                        <form
                          onSubmit={searchBetweenForm}
                          className="search-daily-between-form d-flex align-items-end"
                        >
                          <div className="me-3">
                            <label
                              htmlFor="dateDaily"
                              className="color-seach--daily-label"
                            >
                              Boshlanish sanasi:
                            </label>
                            <input
                              type="date"
                              className="form-control"
                              id="dateMonth"
                              name="dateStart"
                              required
                              defaultValue={dateSearch
                                .toISOString()
                                .substring(0, 10)}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="dateDaily"
                              className="color-seach--daily-label"
                            >
                              Tugash sanasi:
                            </label>
                            <input
                              type="date"
                              className="form-control"
                              id="dateMonth"
                              name="dateEnd"
                              required
                              defaultValue={new Date()
                                .toISOString()
                                .substring(0, 10)}
                            />
                          </div>

                          <button className="search-between-btn ms-3">
                            Qidirish
                          </button>
                        </form>

                        <a
                          className="ms-4"
                          href="#"
                          data-bs-toggle="modal"
                          data-bs-target="#staticBackdrop"
                        >
                          <img
                            src={statistic}
                            alt="pdf"
                            width={25}
                            height={30}
                          />
                        </a>
                        <a
                          className="ms-4"
                          data-bs-toggle="modal"
                          data-bs-target="#modalMapId"
                          href="#"
                        >
                          <img
                            src={location}
                            alt="pdf"
                            width={30}
                            height={30}
                          />
                        </a>
                        <button
                          onClick={() => exportNewsByPdf()}
                          className="ms-4 border border-0"
                        >
                          <img src={pdf} alt="pdf" width={23} height={30} />
                        </button>
                        <button
                          onClick={() => exportDataToExcel()}
                          className="ms-4 border border-0"
                        >
                          <img src={excel} alt="excel" width={26} height={30} />
                        </button>
                      </div>
                    </div>
                    {loader ? (
                      <div className="d-flex align-items-center justify-content-center hour-spinner-wrapper">
                        <span className="loader"></span>
                      </div>
                    ) : searchBetweenData.length > 0 ? (
                      <table className="table mt-4">
                        <thead>
                          <tr>
                            <th scope="col">Sana</th>
                            <th scope="col">Sath (sm)</th>
                            <th scope="col">Hajm (m³/s)</th>
                            <th scope="col">Tuzatish</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchBetweenData.map((e, i) => {
                            return (
                              <tr key={i}>
                                <td>{e.date}</td>
                                <td>{Number(e.level).toFixed(2)}</td>
                                <td>{Number(e.volume).toFixed(2)}</td>
                                <td>{Number(e.correction)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="user-last-data-alert-wrapper d-flex align-items-center justify-content-center">
                        <div
                          className="alert alert-primary text-center fw-bold fs-5 w-100 user-last-data-alert"
                          role="alert"
                        >
                          Ma'lumot hozircha kelmagan...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Helmet>
              <script src="../../src/assets/js/Admin.js"></script>
            </Helmet>
          </div>
        </div>
      </section>
    </HelmetProvider>
    );
};

export default AdminLastDataNews;