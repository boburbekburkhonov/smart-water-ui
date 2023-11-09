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

  useEffect(() => {
    if (whichStation == "allStation") {
      customFetch
        .get(
          `last-data/getLastData?page=1&perPage=${stationStatistic?.totalStationsCount}`
        )
        .then((data) => {
          role == "USER"
            ? setViewStation(data.data.data)
            : setViewStation(data.data.data);
        });

      // ! LIMIT
      customFetch
        .get(`/last-data/getLastData?page=1&perPage=8`)
        .then((data) => {
          role == "USER"
            ? setViewStationLimit(data.data.data)
            : setViewStationLimit(data.data.data);
        });
    } else if (whichStation == "todayStation") {
      customFetch
        .get(
          `/last-data/todayWorkStations?page=1&perPage=${stationStatistic?.totalTodayWorkStationsCount}`
        )
        .then((data) => setViewStation(data.data.data));

      // ! LIMIT
      customFetch
        .get(`/last-data/todayWorkStations?page=1&perPage=8`)
        .then((data) => setViewStationLimit(data.data.data));
    } else if (whichStation == "withinThreeDayStation") {
      customFetch
        .get(
          `/last-data/treeDayWorkStations?page=1&perPage=${stationStatistic?.totalThreeDayWorkStationsCount}`
        )
        .then((data) => {
          setViewStation(data.data.data)
        });

      // ! LIMIT

      customFetch
        .get(`${api}/last-data/treeDayWorkStations?page=1&perPage=8`)
        .then((data) => setViewStationLimit(data.data.data));
    } else if (whichStation == "totalMonthWorkStation") {
      customFetch
        .get(
          `/last-data/lastMonthWorkStations?page=1&perPage=${stationStatistic?.totalMonthWorkStationsCount}`
        )
        .then((data) => setViewStation(data.data.data));

      // ! LIMIT
      customFetch
        .get(`/last-data/lastMonthWorkStations?page=1&perPage=8`)
        .then((data) => setViewStationLimit(data.data.data));
    } else if (whichStation == "totalMoreWorkStations") {
      customFetch
        .get(
          `/last-data/moreWorkStations?page=1&perPage=${stationStatistic?.totalMoreWorkStationsCount}`
        )
        .then((data) => setViewStation(data.data.data));

      // ! LIMIT
      customFetch
        .get(`/last-data/moreWorkStations?page=1&perPage=8`)
        .then((data) => setViewStationLimit(data.data.data));
    } else if (whichStation == "notWorkStation") {
      customFetch
        .get(
          `/last-data/notWorkStations?page=1&perPage=${stationStatistic?.totalNotDataStationsCount}`
        )
        .then((data) => setViewStation(data.data.data));

      // ! LIMIT
      customFetch
        .get(`${api}/last-data/notWorkStations?page=1&perPage=8`)
        .then((data) => setViewStationLimit(data.data.data));
    }
  }, [stationStatistic, whichStation]);

  const data = {
    labels: ["90%", "75%", "50%", "25%", "25% dan pastlari"],
    datasets: [
      {
        label: "Batery",
        data: [
          stationBattery.totalStationsByBatteryLevel90,
          stationBattery.totalStationsByBatteryLevel75,
          stationBattery.totalStationsByBatteryLevel50,
          stationBattery.totalStationsByBatteryLevel25,
          stationBattery.totalStationsByBatteryLevel25Low,
        ],
        backgroundColor: ["#00B4E5", "#32D232", "#FCD401", "#FF8000", "red"],
      },
    ],
  };

  const options = {};

  const filteredStationDate = (item) => {
    if (item == undefined) {
      return "-";
    } else {
      const time = item?.split("T")[1].split(".")[0];
      const date = item?.split("T")[0].split("-");
      if (whichStation == "todayStation") {
        return time;
      } else if (time != undefined) {
        return `${date[1]}/${date[2]}/${date[0]} ${time}`;
      }
    }
  };

  const filteredStationDateByChar = (item) => {
    const time = item?.split("T")[1].split(".")[0];
    const date = item?.split("T")[0].split("-");

    return `${date[1]}/${date[2]}/${date[0]} ${time}`;
  };

  const onClick = (event) => {
    setDataOrStation("station");
    const index = getElementsAtEvent(chartRef.current, event)[0]?.index;

    if (index == 0) {
      setTableTitle("Batareya quvvati 90% dan ko'p bo'lgan stansiyalar");
      // ! LIMIT
      customFetch.get(
        `/last-data/getGreaterAndLessByStations?great=90&page=1&perPage=10&less=100`)
        .then((data) => {
          setViewStationByCharLimit(data.data.data.data)
        });

      // !----------------------------------------------------------------

      customFetch.get(`/last-data/getGreaterAndLessByStations?great=90&less=100`)
        .then((data) => setViewStationByChar(data.data.data.data));
    } else if (index == 1) {
      setTableTitle("Batareya quvvati 75% dan ko'p bo'lgan stansiyalar");

      // ! LIMIT
      customFetch.get(
        `/last-data/getGreaterAndLessByStations?great=75&page=1&perPage=10&less=90`)
        .then((data) => setViewStationByCharLimit(data.data.data.data));

      // !----------------------------------------------------------------

      customFetch.get(`/last-data/getGreaterAndLessByStations?great=75&less=90`)
        .then((data) => setViewStationByChar(data.data.data.data));
    } else if (index == 2) {
      setTableTitle("Batareya quvvati 50% dan ko'p bo'lgan stansiyalar");

      // ! LIMIT
      customFetch.get(
        `/last-data/getGreaterAndLessByStations?great=50&page=1&perPage=10&less=75`)
        .then((data) => setViewStationByCharLimit(data.data.data.data));

      // !----------------------------------------------------------------

      customFetch.get(`/last-data/getGreaterAndLessByStations?great=50&less=75`)
        .then((data) => setViewStationByChar(data.data.data.data));
    } else if (index == 3) {
      setTableTitle("Batareya quvvati 25% dan ko'p bo'lgan stansiyalar");

      // ! LIMIT
      customFetch.get(
        `/last-data/getGreaterAndLessByStations?great=25&page=1&perPage=10&less=50`)
        .then((data) => setViewStationByCharLimit(data.data.data.data));

      // !----------------------------------------------------------------

      customFetch.get(`${api}/last-data/getGreaterAndLessByStations?great=25&less=50`)
        .then((data) => setViewStationByChar(data.data.data.data));
    } else if (index == 4) {
      setTableTitle("Batareya quvvati 25% dan kam bo'lgan stansiyalar");

      // ! LIMIT
      customFetch.get(
        `/last-data/getGreaterAndLessByStations?great=0&page=1&perPage=10&less=25`)
        .then((data) => {
          setViewStationByCharLimit(data.data.data.data)
        });

      // !----------------------------------------------------------------

      customFetch.get(`${api}/last-data/getGreaterAndLessByStations?great=0&less=25`)
        .then((data) => setViewStationByChar(data.data.data.data));
    }
  };

  //! SAVE DATA EXCEL
  const exportDataToExcel = () => {
    let sath = "sath (sm)";
    let hajm  = "Hajm (m³/s)";
    let tuzatish = "Tuzatish";

    const fixedDate = new Date();

    const resultDate = `${fixedDate.getDate()}/${
      fixedDate.getMonth() + 1
    }/${fixedDate.getFullYear()} ${fixedDate.getHours()}:${
      String(fixedDate.getMinutes()).length == 1
        ? "0" + fixedDate.getMinutes()
        : fixedDate.getMinutes()
    }`;

    if (dataOrStation == "data") {
      const resultExcelData = [];

      viewStation.forEach((e) => {
        resultExcelData.push({
          nomi:
            whichStation == "allStation" || whichStation == "notWorkStation"
              ? e.name
              : e.station.name,
          imei:
            whichStation == "allStation" || whichStation == "notWorkStation"
              ? e.imel
              : e.station.imel,
          battery:
            whichStation == "allStation" || whichStation == "notWorkStation"
              ? e.battery
              : e.station.battery,
          lokatsiya:
            whichStation == "allStation" || whichStation == "notWorkStation"
              ? e.location
              : e.station.location,
          programma_versiyasi:
            whichStation == "allStation" || whichStation == "notWorkStation"
              ? e.programVersion
              : e.station.programVersion,
          qurilma_telefon_raqami:
            whichStation == "allStation" || whichStation == "notWorkStation"
              ? e.devicePhoneNum
              : e.station.devicePhoneNum,
          status:
            whichStation == "allStation" || whichStation == "notWorkStation"
              ? e.status == 1
                ? "ishlayapti"
                : "ishlamayapti"
              : e.station.status == 1
              ? "ishlayapti"
              : "ishlamayapti",
          integratsiya:
            whichStation == "allStation" || whichStation == "notWorkStation"
              ? e?.isIntegration == true
                ? "Qilingan"
                : "Qilinmagan"
              : e.station.isIntegration == true
              ? "Qilingan"
              : "Qilinmagan",
          [sath]:
            whichStation == "allStation" || whichStation == "notWorkStation"
              ? e.lastData?.level == undefined
                ? "-"
                : Number(e.lastData?.level).toFixed(2)
              : Number(e.level).toFixed(2),
          [hajm]:
            whichStation == "allStation" || whichStation == "notWorkStation"
              ? e.lastData?.volume == undefined
                ? "-"
                : Number(e.lastData?.volume).toFixed(2)
              : Number(e.volume).toFixed(2),
          [tuzatish]:
            whichStation == "allStation" || whichStation == "notWorkStation"
              ? e.lastData?.correction == undefined
                ? "-"
                : Number(e.lastData?.correction).toFixed(2)
              : Number(e.correction).toFixed(2),
          sana:
            whichStation == "allStation" || whichStation == "notWorkStation"
              ? e.lastData?.date == undefined
                ? "-"
                : e.lastData?.date
              : e.date,
        });
      });

      const workBook = XLSX.utils.book_new();
      const workSheet = XLSX.utils.json_to_sheet(resultExcelData);

      XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

      if (viewStation.length > 0) {
        XLSX.writeFile(
          workBook,
          `${role == 'USER' ? name : balanceOrgName} ning ${tableTitle} ${resultDate}.xlsx`
        );
      }
    } else if (dataOrStation == "station") {
      const resultExcelData = [];

      viewStationByChar.forEach((e) => {
        resultExcelData.push({
          Nomi: e.name,
          Imei: e.imel,
          Lokatsiya: e.location,
          Qurilma_Telefon_Raqami: e.devicePhoneNum,
          User_Telefon_Raqami: e.userPhoneNum,
          Programma_Versiyasi: e.programVersion,
          Status: e.status == 1 ? "ishlayapti" : "ishlamayapti",
          Integratsiya: e?.isIntegration == true ? "Qilingan" : "Qilinmagan",
          Signal: e.signal,
          Temperture: e.temperture,
          Battereya: `${e.battery}%`,
          Datani_yuborish_vaqti: e.sendDataTime,
          Infoni_yuborish_vaqti: e.sendInfoTime,
          date: e.date,
        });
      });

      const workBook = XLSX.utils.book_new();
      const workSheet = XLSX.utils.json_to_sheet(resultExcelData);

      XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

      if (viewStationByChar.length > 0) {
        XLSX.writeFile(
          workBook,
          `${role == 'USER' ? name : balanceOrgName} ning ${tableTitle} ${resultDate}.xlsx`
        );
      }
    }
  };

  const checkStationWorkingOrNot = (value) => {
    const presentDate = new Date();
    let startDate = new Date(value);
    startDate.setHours(startDate.getHours() - 5);

    if (value == undefined) {
      return "undefined";
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
    } else if (
      startDate.getFullYear() == presentDate.getFullYear() &&
      presentDate.getMonth() - startDate.getMonth() == 1 &&
      presentDate.getDate() - startDate.getDate() <= 0
    ) {
      return 5;
    } else if (
      (startDate.getFullYear() == presentDate.getFullYear() &&
        presentDate.getMonth() - startDate.getMonth() >= 1 &&
        presentDate.getDate() - startDate.getDate() >= 0) ||
      startDate.getFullYear() <= presentDate.getFullYear()
    ) {
      return "after one month";
    }
  };

  const loaderFunc = () => {
    setLoader(true);

    setTimeout(() => {
      setLoader(false);
    }, 500);
  };

  return (
    <section className="home-section p-0">
      {/* MODAL */}
      <div
        className="modal fade"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
        tabIndex="-1"
        id="exampleModal"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog table-dashboard-width modal-dialog-centered  modal-dialog-scrollable">
          <div className="modal-content table-location-scroll">
            <div className="modal-header d-flex flex-column">
              <div className="d-flex align-items-center justify-content-between w-100">
                <h1 className="modal-title fs-4" id="exampleModalLabel">
                  {tableTitle}
                </h1>

                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div
                className="ms-auto d-flex align-items-center justify-content-end cursor-pointer mt-2"
                onClick={() => exportDataToExcel()}
              >
                <p className="m-0 p-0 user-station-save-data-desc">
                  Ma'lumotni saqlash
                </p>
                <button className="ms-3 border border-0">
                  <img src={excel} alt="excel" width={26} height={30} />
                </button>
              </div>
            </div>
            <div className="modal-body mb-5">
              {dataOrStation == "data" ? (
                <table className="table mt-4">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="text-center user-dashboard-table-thead fw-bold"
                      >
                        Nomi
                      </th>
                      <th
                        scope="col"
                        className="text-center user-dashboard-table-thead fw-bold"
                      >
                        Batareya (%)
                      </th>
                      <th
                        scope="col"
                        className="text-center user-dashboard-table-thead fw-bold"
                      >
                        Sath (sm)
                      </th>
                      <th
                        scope="col"
                        className="text-center user-dashboard-table-thead fw-bold"
                      >
                        Hajm (m³/s)
                      </th>
                      <th
                        scope="col"
                        className="text-center user-dashboard-table-thead fw-bold"
                      >
                        Tuzatish
                      </th>
                      <th
                        scope="col"
                        className="text-center user-dashboard-table-thead fw-bold"
                      >
                        {whichStation == "todayStation" ? "Vaqt" : "Sana"}
                      </th>
                      <th
                        scope="col"
                        className="text-center user-dashboard-table-thead fw-bold"
                      >
                        Vazirlik bilan integratsiya
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewStation?.map((e, i) => {
                      return whichStation == "allStation" ||
                        whichStation == "notWorkStation" ? (
                        <tr key={i}>
                          <td className={`text-center fw-bold`}>{e?.name}</td>
                          <td className={`text-center fw-bold`}>
                            {e?.battery}
                          </td>
                          <td className={`text-center fw-bold`}>
                            {e.lastData?.level != undefined
                              ? Number(e.lastData?.level).toFixed(2)
                              : "-"}
                          </td>
                          <td className={`text-center fw-bold`}>
                            {e.lastData?.volume != undefined
                              ? Number(e.lastData?.volume).toFixed(2)
                              : "-"}
                          </td>
                          <td className={`text-center fw-bold`}>
                            {e.lastData?.correction != undefined
                              ? Number(e.lastData?.correction).toFixed(2)
                              : "-"}
                          </td>
                          <td
                            className={`text-center fw-bold ${
                              checkStationWorkingOrNot(e.lastData?.date) == 0
                                ? "color-green"
                                : checkStationWorkingOrNot(e.lastData?.date) <=
                                  3
                                ? "color-azeu"
                                : checkStationWorkingOrNot(e.lastData?.date) > 3
                                ? "color-yellow"
                                : checkStationWorkingOrNot(e.lastData?.date) ==
                                  "after one month"
                                ? "text-danger"
                                : checkStationWorkingOrNot(e.lastData?.date) ==
                                  "undefined"
                                ? "text-danger"
                                : "text-danger"
                            }`}
                          >
                            {filteredStationDate(e.lastData?.date)}
                          </td>
                          <td
                            className={`text-center fw-bold ${
                              e?.isIntegration == false ? "text-danger" : null
                            }`}
                          >
                            {e?.isIntegration == true ? "Ha" : "Yo'q"}
                          </td>
                        </tr>
                      ) : (
                        <tr key={i}>
                          <td className={`text-center fw-bold`}>
                            {e?.station?.name}
                          </td>
                          <td className={`text-center fw-bold`}>
                            {e?.stations?.battery}
                          </td>
                          <td className={`text-center fw-bold`}>
                            {e?.level != undefined
                              ? Number(e?.level).toFixed(2)
                              : "-"}
                          </td>
                          <td className={`text-center fw-bold`}>
                            {e?.volume != undefined
                              ? Number(e?.volume).toFixed(2)
                              : "-"}
                          </td>
                          <td className={`text-center fw-bold`}>
                            {e?.correction != undefined
                              ? Number(e?.correction).toFixed(2)
                              : "-"}
                          </td>
                          <td
                            className={`text-center fw-bold ${
                              whichStation == "todayStation"
                                ? "text-success"
                                : whichStation == "withinThreeDayStation"
                                ? "color-azeu"
                                : whichStation == "totalMonthWorkStation"
                                ? "color-yellow"
                                : whichStation == "totalMoreWorkStations"
                                ? "color-orange"
                                : null
                            }`}
                          >
                            {filteredStationDate(e?.date)}
                          </td>
                          <td
                            className={`text-center fw-bold ${
                              e?.stations?.isIntegration == false
                                ? "text-danger"
                                : null
                            }`}
                          >
                            {e?.stations?.isIntegration == true ? "Ha" : "Yo'q"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="table mt-4">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="text-center user-dashboard-table-thead fw-bold"
                      >
                        Nomi
                      </th>
                      <th
                        scope="col"
                        className="text-center user-dashboard-table-thead fw-bold"
                      >
                        Imei
                      </th>
                      <th
                        scope="col"
                        className="text-center user-dashboard-table-thead fw-bold"
                      >
                        Batareya (%)
                      </th>
                      <th
                        scope="col"
                        className="text-center user-dashboard-table-thead fw-bold"
                      >
                        Signal
                      </th>
                      <th
                        scope="col"
                        className="text-center user-dashboard-table-thead fw-bold"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="text-center user-dashboard-table-thead fw-bold"
                      >
                        {whichStation == "todayStation" ? "Vaqt" : "Sana"}
                      </th>
                      <th
                        scope="col"
                        className="text-center user-dashboard-table-thead fw-bold"
                      >
                        Vazirlik bilan integratsiya
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewStationByChar?.map((e, i) => {
                      return (
                        <tr key={i}>
                          <td className="text-center fw-bold">{e?.name}</td>
                          <td className="text-center fw-bold">{e.imel}</td>
                          <td className="text-center fw-bold">{e.battery}</td>
                          <td className="text-center fw-bold">{e.signal}</td>
                          <td className="text-center fw-bold">{e.status}</td>
                          <td className="text-center fw-bold">
                            {filteredStationDateByChar(e?.date)}
                          </td>
                          <td
                            className={`text-center fw-bold ${
                              e.isIntegration == false ? "text-danger" : null
                            }`}
                          >
                            {e.isIntegration == true ? "Ha" : "Yo'q"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="container-fluid p-0">
        <section className="section-dashboard">
          {viewStation?.length > 0 ? (
            <div className="container-fluid p-0">
              <div className="user-dashboard-top-wrapper">
                <div className="d-flex align-items-center mb-3 pt-3">
                  <h1 className="dashboard-heading ms-2">
                    {balanceOrg.length == 0
                      ? `${name} ga biriktirilgan qurilmalar`
                      : `${balanceOrgName} ga biriktirilgan qurilmalar`}
                  </h1>
                </div>

                <ul className="dashboard-list list-unstyled m-0 d-flex flex-wrap align-items-center justify-content-between">
                  {stationStatistic?.totalStationsCount > 0 ? (
                    <li
                      className="dashboard-list-item mt-3 d-flex"
                      onClick={() => {
                        setWhichStation("allStation");
                        setTableTitle("Umumiy stansiyalar soni");
                        setDataOrStation("data");
                        loaderFunc();
                      }}
                    >
                      <img
                        src={circleBlue}
                        alt="circleBlue"
                        width={30}
                        height={30}
                      />
                      <div className="ms-2">
                        <p className="dashboard-list-number m-0">
                          {stationStatistic?.totalStationsCount} ta
                        </p>
                        <p className="dashboard-list-desc m-0">
                          Umumiy stansiyalar soni
                        </p>
                        <p className="dashboard-list-desc-percentage text-info m-0 text-end">
                          100%
                        </p>
                      </div>
                    </li>
                  ) : null}

                  {stationStatistic?.totalTodayWorkStationsCount > 0 ? (
                    <li
                      className="dashboard-list-item d-flex mt-3"
                      onClick={() => {
                        setWhichStation("todayStation");
                        setTableTitle("Bugun ishlayotganlar stansiyalar");
                        setDataOrStation("data");
                        loaderFunc();
                      }}
                    >
                      <img
                        src={circleGreen}
                        alt="circleGreen"
                        width={30}
                        height={30}
                      />
                      <div className="ms-2">
                        <p className="dashboard-list-number m-0">
                          {stationStatistic?.totalTodayWorkStationsCount} ta
                        </p>
                        <p className="dashboard-list-desc m-0">
                          Bugun ishlayotganlar stansiyalar
                        </p>
                        <p className="dashboard-list-desc-percentage text-info m-0 text-end">
                          {(
                            (stationStatistic?.totalTodayWorkStationsCount *
                              100) /
                            stationStatistic?.totalStationsCount
                          ).toFixed()}
                          %
                        </p>
                      </div>
                    </li>
                  ) : null}

                  {stationStatistic?.totalThreeDayWorkStationsCount > 0 ? (
                    <li
                      className="dashboard-list-item mt-3 d-flex"
                      onClick={() => {
                        setWhichStation("withinThreeDayStation");
                        setTableTitle("3 kun ichida ishlagan stansiyalar");
                        setDataOrStation("data");
                        loaderFunc();
                      }}
                    >
                      <img
                        src={circleGreenBlue}
                        alt="circleGreen"
                        width={30}
                        height={30}
                      />
                      <div className="ms-2">
                        <p className="dashboard-list-number m-0">
                          {stationStatistic?.totalThreeDayWorkStationsCount} ta
                        </p>
                        <p className="dashboard-list-desc m-0">
                          3 kun ichida ishlagan stansiyalar
                        </p>
                        <p className="dashboard-list-desc-percentage text-info m-0 text-end">
                          {(
                            (stationStatistic?.totalThreeDayWorkStationsCount *
                              100) /
                            stationStatistic?.totalStationsCount
                          ).toFixed()}
                          %
                        </p>
                      </div>
                    </li>
                  ) : null}

                  {stationStatistic?.totalMonthWorkStationsCount > 0 ? (
                    <li
                      className="dashboard-list-item mt-3 d-flex"
                      onClick={() => {
                        setWhichStation("totalMonthWorkStation");
                        setTableTitle("Oxirgi oy ishlagan stansiyalar");
                        setDataOrStation("data");
                        loaderFunc();
                      }}
                    >
                      <img
                        src={circleYellow}
                        alt="circleGreen"
                        width={30}
                        height={30}
                      />
                      <div className="ms-2">
                        <p className="dashboard-list-number m-0">
                          {stationStatistic?.totalMonthWorkStationsCount}
                          ta
                        </p>
                        <p className="dashboard-list-desc m-0">
                          Oxirgi oy ishlagan stansiyalar
                        </p>
                        <p className="dashboard-list-desc-percentage text-info m-0 text-end">
                          {(
                            (stationStatistic?.totalMonthWorkStationsCount *
                              100) /
                            stationStatistic?.totalStationsCount
                          ).toFixed()}
                          %
                        </p>
                      </div>
                    </li>
                  ) : null}

                  {stationStatistic?.totalMoreWorkStationsCount > 0 ? (
                    <li
                      className="dashboard-list-item mt-3 d-flex"
                      onClick={() => {
                        setWhichStation("totalMoreWorkStations");
                        setTableTitle("Uzoq vaqt ishlamagan qurilmalar");
                        setDataOrStation("data");
                        loaderFunc();
                      }}
                    >
                      <img
                        src={circleOrange}
                        alt="circleGreen"
                        width={30}
                        height={30}
                      />
                      <div className="ms-2">
                        <p className="dashboard-list-number m-0">
                          {stationStatistic?.totalMoreWorkStationsCount}
                          ta
                        </p>
                        <p className="dashboard-list-desc m-0">
                          Uzoq vaqt ishlamagan qurilmalar
                        </p>
                        <p className="dashboard-list-desc-percentage text-info m-0 text-end">
                          {(
                            (stationStatistic?.totalMoreWorkStationsCount *
                              100) /
                            stationStatistic?.totalStationsCount
                          ).toFixed()}
                          %
                        </p>
                      </div>
                    </li>
                  ) : null}

                  {stationStatistic?.totalNotDataStationsCount > 0 ? (
                    <li
                      className="dashboard-list-item mt-3 d-flex"
                      onClick={() => {
                        setWhichStation("notWorkStation");
                        setTableTitle("Umuman ishlamagan stansiyalar");
                        setDataOrStation("data");
                        loaderFunc();
                      }}
                    >
                      <img
                        src={circleRed}
                        alt="circleGreen"
                        width={30}
                        height={30}
                      />
                      <div className="ms-2">
                        <p className="dashboard-list-number m-0">
                          {stationStatistic?.totalNotDataStationsCount} ta
                        </p>
                        <p className="dashboard-list-desc m-0">
                          Umuman ishlamagan stansiyalar
                        </p>
                        <p className="dashboard-list-desc-percentage text-info m-0 text-end">
                          {(
                            (stationStatistic?.totalNotDataStationsCount *
                              100) /
                            stationStatistic?.totalStationsCount
                          ).toFixed()}
                          %
                        </p>
                      </div>
                    </li>
                  ) : null}
                </ul>
              </div>

              {loader ? (
                <div className="d-flex align-items-center justify-content-center hour-spinner-wrapper">
                  <span className="loader"></span>
                </div>
              ) : (
                <div className="table-char-wrapperlist d-flex flex-wrap justify-content-between">
                  <div className="dashboard-table mt-5">
                    <div className="d-flex justify-content-between align-items-center">
                      <h2>{tableTitle}</h2>
                      <span
                        data-bs-toggle="modal"
                        data-bs-target="#exampleModal"
                        className="dashboard-fullscreen-wrapper"
                      >
                        <img
                          src={fullScreen}
                          alt="fullScreen"
                          width={20}
                          height={20}
                        />
                      </span>
                    </div>
                    {dataOrStation == "data" ? (
                      <table className="table mt-4">
                        <thead>
                          <tr>
                            <th
                              scope="col"
                              className="text-center user-dashboard-table-thead"
                            >
                              Nomi
                            </th>
                            <th
                              scope="col"
                              className="text-center user-dashboard-table-thead"
                            >
                              Sath (sm)
                            </th>
                            <th
                              scope="col"
                              className="text-center user-dashboard-table-thead"
                            >
                              Hajm (m³/s)
                            </th>
                            <th
                              scope="col"
                              className="text-center user-dashboard-table-thead"
                            >
                              Tuzatish
                            </th>
                            <th
                              scope="col"
                              className="text-center user-dashboard-table-thead"
                            >
                              {whichStation == "todayStation" ? "Vaqt" : "Sana"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewStationLimit?.map((e, i) => {
                            return (
                              <tr key={i}>
                                <td className="text-center fw-bold">
                                  {whichStation == "allStation" ||
                                  whichStation == "notWorkStation"
                                    ? e?.name
                                    : e.station?.name}
                                </td>
                                <td className="text-center fw-bold">
                                  {whichStation == "allStation" &&
                                  e.lastData?.level != undefined
                                    ? Number(e.lastData?.level).toFixed(2)
                                    : e.level != undefined
                                    ? Number(e.level).toFixed(2)
                                    : "-"}
                                </td>
                                <td className="text-center fw-bold">
                                  {whichStation == "allStation" &&
                                  e.lastData?.volume != undefined
                                    ? Number(e.lastData?.volume).toFixed(
                                        2
                                      )
                                    : e.volume != undefined
                                    ? Number(e.volume).toFixed(2)
                                    : "-"}
                                </td>
                                <td className="text-center fw-bold">
                                  {whichStation == "allStation" &&
                                  e.lastData?.correction != undefined
                                    ? Number(e.lastData?.correction).toFixed(2)
                                    : e.correction != undefined
                                    ? Number(e.correction).toFixed(2)
                                    : "-"}
                                </td>
                                {whichStation == "allStation" ||
                                whichStation == "notWorkStation" ? (
                                  <td
                                    className={`text-center fw-bold ${
                                      checkStationWorkingOrNot(
                                        e.lastData?.date
                                      ) == 0
                                        ? "color-green"
                                        : checkStationWorkingOrNot(
                                            e.lastData?.date
                                          ) <= 3
                                        ? "color-azeu"
                                        : checkStationWorkingOrNot(
                                            e.lastData?.date
                                          ) > 3
                                        ? "color-yellow"
                                        : checkStationWorkingOrNot(
                                            e.lastData?.date
                                          ) == "after one month"
                                        ? "text-danger"
                                        : checkStationWorkingOrNot(
                                            e.lastData?.date
                                          ) == "undefined"
                                        ? "text-danger"
                                        : "text-danger"
                                    }`}
                                  >
                                    {filteredStationDate(e.lastData?.date)}
                                  </td>
                                ) : (
                                  <td
                                    className={`text-center fw-bold ${
                                      whichStation == "todayStation"
                                        ? "text-success"
                                        : whichStation ==
                                          "withinThreeDayStation"
                                        ? "color-azeu"
                                        : whichStation ==
                                          "totalMonthWorkStation"
                                        ? "color-yellow"
                                        : whichStation ==
                                          "totalMoreWorkStations"
                                        ? "color-orange"
                                        : whichStation == "notWorkStation"
                                        ? "text-danger"
                                        : null
                                    }`}
                                  >
                                    {filteredStationDate(e?.date)}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <table className="table mt-4">
                        <thead>
                          <tr>
                            <th
                              scope="col"
                              className="text-center user-dashboard-table-thead"
                            >
                              Nomi
                            </th>
                            <th
                              scope="col"
                              className="text-center user-dashboard-table-thead"
                            >
                              Batareya (%)
                            </th>
                            <th
                              scope="col"
                              className="text-center user-dashboard-table-thead"
                            >
                              Signal
                            </th>
                            <th
                              scope="col"
                              className="text-center user-dashboard-table-thead"
                            >
                              Status
                            </th>
                            <th
                              scope="col"
                              className="text-center user-dashboard-table-thead"
                            >
                              {whichStation == "todayStation" ? "Vaqt" : "Sana"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewStationByCharLimit?.map((e, i) => {
                            return (
                              <tr key={i}>
                                <td className="text-center fw-bold">
                                  {e?.name}
                                </td>
                                <td className="text-center fw-bold">
                                  {e.battery}
                                </td>
                                <td className="text-center fw-bold">
                                  {e.signal}
                                </td>
                                <td className="text-center fw-bold">
                                  {e.status}
                                </td>
                                <td className="text-center fw-bold">
                                  {filteredStationDateByChar(e?.date)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="dashboard-dought-wrapper mt-5">
                    <h3 className="dashboard-dought-wrapper-heading m-0">
                      Qurilmalarning batareya quvvatlari
                    </h3>
                    <Doughnut
                      className="mx-3"
                      data={data}
                      options={options}
                      onClick={onClick}
                      ref={chartRef}
                    ></Doughnut>
                  </div>
                </div>
              )}
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
        </section>
      </div>
    </section>
  );
};

export default UserDashboard;
