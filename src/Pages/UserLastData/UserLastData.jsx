import React, { useState } from "react";
import batteryFull from "../../assets/images/battery-100.svg";
import batteryNo from "../../assets/images/battery-0.svg";
import batteryPow from "../../assets/images/battery-70.svg";
import batteryLow from "../../assets/images/battery-40.svg";
import batteryRed from "../../assets/images/battery-30.svg";
import circleBlue from "../../assets/images/record.png";
import circleGreen from "../../assets/images/circle.png";
import circleGreenBlue from "../../assets/images/circle-green-blue.png";
import circleOrange from "../../assets/images/circle-orange.png";
import circleYellow from "../../assets/images/circle-yellow.png";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { api } from "../Api/Api";
import ReactPaginate from "react-paginate";
import * as XLSX from "xlsx";
import excel from "../../assets/images/excel.png";
import axios, { all } from "axios";
import "./UserLastData.css";

const UserLastData = (prop) => {
  const { balanceOrg } = prop;
  const [loader, setLoader] = useState(false);
  const [allStation, setAllStation] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();
  const name = window.localStorage.getItem("name");
  const role = window.localStorage.getItem("role");
  const [stationStatistic, settationStatistic] = useState([]);
  const [whichStation, setWhichStation] = useState("allStation");
  const [tableTitle, setTableTitle] = useState("Umumiy stansiyalar soni");
  const [colorCard, setColorCard] = useState(
    "user-last-data-list-item-href-blue"
  );
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

        console.log("Token " + access_token);
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
  }, []);

  useEffect(() => {
    if (whichStation == "allStation") {
      // ! LIMIT
      customFetch
        .get(`/last-data/getLastData?page=1&perPage=12`)
        .then((data) => {
          role == "USER"
            ? `${setAllStation(data.data.data)} ${setTotalPages(
                data.data.totalPages
              )}`
            : `${setAllStation(data.data.data)} ${setTotalPages(
                data.data.totalPages
              )}`;
        });
    } else if (whichStation == "todayStation") {
      // ! LIMIT
      customFetch
        .get(`/last-data/todayWorkStations?page=1&perPage=12`)
        .then((data) => {
          role == "USER"
            ? `${setAllStation(data.data.data)} ${setTotalPages(
                data.data.totalPages
              )}`
            : `${setAllStation(data.data.data)} ${setTotalPages(
                data.data.totalPages
              )}`;
        });
    } else if (whichStation == "withinThreeDayStation") {
      // ! LIMIT
      customFetch
        .get(`/last-data/treeDayWorkStations?page=1&perPage=12`)
        .then((data) => {
          role == "USER"
            ? `${setAllStation(data.data.data)} ${setTotalPages(
                data.data.totalPages
              )}`
            : `${setAllStation(data.data.data)} ${setTotalPages(
                data.data.totalPages
              )}`;
        });
    } else if (whichStation == "totalMonthWorkStation") {
      // ! LIMIT
      customFetch
        .get(`/last-data/lastMonthWorkStations?page=1&perPage=12`)
        .then((data) => {
          role == "USER"
            ? `${setAllStation(data.data.data)} ${setTotalPages(
                data.data.totalPages
              )}`
            : `${setAllStation(data.data.data)} ${setTotalPages(
                data.data.totalPages
              )}`;
        });
    } else if (whichStation == "totalMoreWorkStations") {
      // ! LIMIT
      customFetch
        .get(`/last-data/moreWorkStations?page=1&perPage=12`)
        .then((data) => {
          role == "USER"
            ? `${setAllStation(data.data.data)} ${setTotalPages(
                data.data.totalPages
              )}`
            : `${setAllStation(data.data.data)} ${setTotalPages(
                data.data.totalPages
              )}`;
        });
    } else if (whichStation == "notWorkStation") {
      // ! LIMIT
      customFetch
        .get(`${api}/last-data/getNotLastDataStations?page=1&perPage=12`)
        .then((res) => res.json())
        .then((data) => {
          role == "USER"
            ? `${setAllStation(data.data.data.docs)} ${setTotalPages(
                data.data.totalPages
              )}`
            : `${setAllStation(data.data.data.docs)} ${setTotalPages(
                data.data.dataz.totalPages
              )}`;
        });
    }
  }, [whichStation]);

  const handlePageChange = (selectedPage) => {
    if (whichStation == "allStation") {
      // ! LIMIT
      customFetch
        .get(
          `/last-data/getLastData?page=${selectedPage.selected + 1}&perPage=12`
        )
        .then((data) =>
          role == "USER"
            ? `${setAllStation(data.data.data)}`
            : `${setAllStation(data.data.data)}`
        );
    } else if (whichStation == "todayStation") {
      // ! LIMIT
      customFetch
        .get(
          `/last-data/todayWorkStations?page=${
            selectedPage.selected + 1
          }&perPage=12`
        )
        .then((data) => {
          setAllStation(data.data.data.docs);
        });
    } else if (whichStation == "withinThreeDayStation") {
      // ! LIMIT
      customFetch
        .get(
          `/last-data/treeDayWorkStations?page=${
            selectedPage.selected + 1
          }&perPage=12`
        )
        .then((data) => {
          setAllStation(data.data.data.docs);
        });
    } else if (whichStation == "totalMonthWorkStation") {
      // ! LIMIT
      customFetch
        .get(
          `/last-data/lastMonthWorkStations?page=${
            selectedPage.selected + 1
          }&perPage=12`
        )
        .then((data) => {
          setAllStation(data.data.data.docs);
        });
    } else if (whichStation == "totalMoreWorkStations") {
      // ! LIMIT
      customFetch
        .get(
          `/last-data/moreWorkStations?page=${
            selectedPage.selected + 1
          }&perPage=12`
        )
        .then((data) => {
          setAllStation(data.data.data.docs);
        });
    }
  };

  const returnFixdDate = (item) => {
    if (item == undefined) {
      return "Ma'lumot kelmagan";
    } else {
      const fixedDate = new Date(item);
      fixedDate.setHours(fixedDate.getHours() - 5);

      const date = `${fixedDate.getDate()}/${
        fixedDate.getMonth() + 1
      }/${fixedDate.getFullYear()} ${fixedDate.getHours()}:${
        String(fixedDate.getMinutes()).length == 1
          ? "0" + fixedDate.getMinutes()
          : fixedDate.getMinutes()
      }`;

      return date;
    }
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
    } else if (
      (startDate.getFullYear() == presentDate.getFullYear() &&
        presentDate.getMonth() == startDate.getMonth() &&
        presentDate.getDate() - startDate.getDate() > 3) ||
      (startDate.getFullYear() == presentDate.getFullYear() &&
        presentDate.getMonth() - startDate.getMonth() == 1 &&
        presentDate.getDate() - startDate.getDate() <= 0)
    ) {
      return "one month";
    } else if (
      startDate.getFullYear() == presentDate.getFullYear() &&
      presentDate.getMonth() - startDate.getMonth() == 1 &&
      presentDate.getDate() - startDate.getDate() >= 0
    ) {
      return "after one month";
    }
  };

  // ! SAVE DATA EXCEL
  const exportDataToExcel = () => {
    let sath = "sath (sm)";
    let shurlanish = "shurlanish (g/l)";
    let temperatura = "temperatura (°C)";
    const fixedDate = new Date();

    const resultDate = `${fixedDate.getDate()}/${
      fixedDate.getMonth() + 1
    }/${fixedDate.getFullYear()} ${fixedDate.getHours()}:${
      String(fixedDate.getMinutes()).length == 1
        ? "0" + fixedDate.getMinutes()
        : fixedDate.getMinutes()
    }`;

    if (whichStation == "allStation") {
      const userAllDataFunc = async () => {
        const request = await customFetch.get(
          `/last-data/getLastData?page=1&perPage=${stationStatistic.totalStationsCount}`
        );

        const resultExcelData = [];

        request.data.data.forEach((e) => {
          resultExcelData.push({
            nomi: e.name,
            imei: e.imel,
            battery: e.battery,
            lokatsiya: e.location,
            programma_versiyasi: e.programVersion,
            qurilma_telefon_raqami: e.devicePhoneNum,
            status: e.status == 1 ? "ishlayapti" : "ishlamayapti",
            integratsiya: e?.isIntegration == true ? "Qilingan" : "Qilinmagan",
            [sath]: Number(e.lastData?.level).toFixed(2),
            [shurlanish]: Number(e.lastData?.conductivity).toFixed(2),
            [temperatura]: Number(e.lastData?.temp).toFixed(2),
            sana: e.lastData?.date,
          });
        });

        const workBook = XLSX.utils.book_new();
        const workSheet = XLSX.utils.json_to_sheet(resultExcelData);

        XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

        if (request.data.data.length > 0) {
          XLSX.writeFile(
            workBook,
            `${
              role == "USER" ? name : balanceOrgName
            } ning umumiy stansiya ma'lumotlari ${resultDate}.xlsx`
          );
        }
      };

      userAllDataFunc();
    } else if (whichStation == "todayStation") {
      const userTodayDataFunc = async () => {
        const request = await customFetch.get(
          `/last-data/todayWorkStations?page=1&perPage=${stationStatistic.totalTodayWorkStationsCount}`
        );

        const resultExcelData = [];
        request.data.data.docs.forEach((e) => {
          resultExcelData.push({
            nomi: e.stations.name,
            imei: e.stations.imel,
            battery: e.stations.battery,
            lokatsiya: e.stations.location,
            programma_versiyasi: e.stations.programVersion,
            qurilma_telefon_raqami: e.stations.devicePhoneNum,
            status: e.stations.status == 1 ? "ishlayapti" : "ishlamayapti",
            integratsiya:
              e?.stations.isIntegration == true ? "Qilingan" : "Qilinmagan",
            [sath]: Number(e.level).toFixed(2),
            [shurlanish]: Number(e.conductivity).toFixed(2),
            [temperatura]: Number(e.temp).toFixed(2),
            sana: e.date,
          });
        });

        const workBook = XLSX.utils.book_new();
        const workSheet = XLSX.utils.json_to_sheet(resultExcelData);

        XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

        if (request.data.data.docs.length > 0) {
          XLSX.writeFile(
            workBook,
            `${
              role == "USER" ? name : balanceOrgName
            } ning bugun kelgan ma'lumotlari ${resultDate}.xlsx`
          );
        }
      };

      userTodayDataFunc();
    } else if (whichStation == "withinThreeDayStation") {
      const userThreeDayDataFunc = async () => {
        const request = await customFetch.get(
          `/last-data/treeDayWorkStations?page=1&perPage=${stationStatistic.totalThreeDayWorkStationsCount}`
        );

        const resultExcelData = [];
        request.data.data.docs.forEach((e) => {
          resultExcelData.push({
            nomi: e.stations.name,
            imei: e.stations.imel,
            battery: e.stations.battery,
            lokatsiya: e.stations.location,
            programma_versiyasi: e.stations.programVersion,
            qurilma_telefon_raqami: e.stations.devicePhoneNum,
            status: e.stations.status == 1 ? "ishlayapti" : "ishlamayapti",
            integratsiya:
              e?.stations.isIntegration == true ? "Qilingan" : "Qilinmagan",
            [sath]: Number(e.level).toFixed(2),
            [shurlanish]: Number(e.conductivity).toFixed(2),
            [temperatura]: Number(e.temp).toFixed(2),
            sana: e.date,
          });
        });

        const workBook = XLSX.utils.book_new();
        const workSheet = XLSX.utils.json_to_sheet(resultExcelData);

        XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

        if (request.data.data.docs.length > 0) {
          XLSX.writeFile(
            workBook,
            `${
              role == "USER" ? name : balanceOrgName
            } ning 3 ichida kelgan ma'lumotlari ${resultDate}.xlsx`
          );
        }
      };

      userThreeDayDataFunc();
    } else if (whichStation == "totalMonthWorkStation") {
      const userLastMonthDataFunc = async () => {
        const request = await customFetch.get(
          `/last-data/lastMonthWorkStations?page=1&perPage=${stationStatistic.totalMonthWorkStationsCount}`
        );

        const resultExcelData = [];
        request.data.data.docs.forEach((e) => {
          resultExcelData.push({
            nomi: e.stations.name,
            imei: e.stations.imel,
            battery: e.stations.battery,
            lokatsiya: e.stations.location,
            programma_versiyasi: e.stations.programVersion,
            qurilma_telefon_raqami: e.stations.devicePhoneNum,
            status: e.stations.status == 1 ? "ishlayapti" : "ishlamayapti",
            integratsiya:
              e?.stations.isIntegration == true ? "Qilingan" : "Qilinmagan",
            [sath]: Number(e.level).toFixed(2),
            [shurlanish]: Number(e.conductivity).toFixed(2),
            [temperatura]: Number(e.temp).toFixed(2),
            sana: e.date,
          });
        });

        const workBook = XLSX.utils.book_new();
        const workSheet = XLSX.utils.json_to_sheet(resultExcelData);

        XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

        if (request.data.data.docs.length > 0) {
          XLSX.writeFile(
            workBook,
            `${
              role == "USER" ? name : balanceOrgName
            } ning so'ngi oy kelgan ma'lumotlari ${resultDate}.xlsx`
          );
        }
      };

      userLastMonthDataFunc();
    } else if (whichStation == "totalMoreWorkStations") {
      const userMoreMonthDataFunc = async () => {
        const request = await customFetch.get(
          `/last-data/moreWorkStations?page=1&perPage=${stationStatistic.totalMoreWorkStationsCount}`
        );

        const resultExcelData = [];
        request.data.data.docs.forEach((e) => {
          resultExcelData.push({
            nomi: e.stations.name,
            imei: e.stations.imel,
            battery: e.stations.battery,
            lokatsiya: e.stations.location,
            programma_versiyasi: e.stations.programVersion,
            qurilma_telefon_raqami: e.stations.devicePhoneNum,
            status: e.stations.status == 1 ? "ishlayapti" : "ishlamayapti",
            integratsiya:
              e?.stations.isIntegration == true ? "Qilingan" : "Qilinmagan",
            [sath]: Number(e.level).toFixed(2),
            [shurlanish]: Number(e.conductivity).toFixed(2),
            [temperatura]: Number(e.temp).toFixed(2),
            sana: e.date,
          });
        });

        const workBook = XLSX.utils.book_new();
        const workSheet = XLSX.utils.json_to_sheet(resultExcelData);

        XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

        if (request.data.data.docs.length > 0) {
          XLSX.writeFile(
            workBook,
            `${
              role == "USER" ? name : balanceOrgName
            } ning uzoq ishlamagan stansiya ma'lumotlari ${resultDate}.xlsx`
          );
        }
      };

      userMoreMonthDataFunc();
    }
  };

  const searchStationByInput = (value) => {
    if (whichStation == "allStation") {
      customFetch
        .get(
          `/last-data/searchLastDataByStation?search=${value}&page=1&perPage=12`
        )
        .then((data) => {
          if (data.data.data.data.length > 0) {
            setAllStation(data.data.data.data);
            setTotalPages(data.data.data.totalPages);
          }
        });
    } else if (whichStation == "todayStation") {
      customFetch
        .get(
          `/last-data/searchTodayWorkingStations?search=${value}&page=1&perPage=12`
        )
        .then((data) => {
          if (data.data.data.docs.length > 0) {
            setAllStation(data.data.data.docs);
            setTotalPages(data.data.data.totalPages);
          }
        });
    } else if (whichStation == "withinThreeDayStation") {
      customFetch
        .get(
          `/last-data/searchThreeDaysWorkingStations?search=${value}&page=1&perPage=12`
        )
        .then((data) => {
          if (data.data.data.docs.length > 0) {
            setAllStation(data.data.data.docs);
            setTotalPages(data.data.data.totalPages);
          }
        });
    } else if (whichStation == "totalMonthWorkStation") {
      customFetch
        .get(
          `/last-data/searchLastMonthWorkingStations?search=${value}&page=1&perPage=12`
        )
        .then((data) => {
          if (data.data.data.docs.length > 0) {
            setAllStation(data.data.data.docs);
            setTotalPages(data.data.data.totalPages);
          }
        });
    } else if (whichStation == "totalMoreWorkStations") {
      customFetch
        .get(
          `/last-data/searchMoreWorkingStations?search=${value}&page=1&perPage=12`
        )
        .then((data) => {
          if (data.data.data.docs.length > 0) {
            setAllStation(data.data.data.docs);
            setTotalPages(data.data.data.totalPages);
          }
        });
    }
  };

  const loaderFunc = () => {
    setLoader(true);

    setTimeout(() => {
      setLoader(false);
    }, 700);
  };
  console.log(allStation);
  return (
    <section className="home-section py-3">
      <div className="container-fluid">
        <div className="card">
          {allStation?.length > 0 ? (
            <div className="card-body">
              <div className="tab-content">
                <div
                  className="tab-pane container-fluid fade show active profile-users user-last-data-table-wrapper"
                  id="profile-users"
                >
                  <div className="user-last-data-top-wrapper pt-3">
                    <h1 className="mb-3 user-lastdata-heading">
                      {balanceOrg.length == 0
                        ? `${name} ga biriktirilgan qurilmalar`
                        : `${balanceOrgName} ga biriktirilgan qurilmalar`}
                    </h1>

                    <ul className="dashboard-list list-unstyled m-0 d-flex flex-wrap align-items-center justify-content-between mt-4">
                      {stationStatistic?.totalStationsCount > 0 ? (
                        <li
                          className="dashboard-list-item mt-3 d-flex border-blue"
                          onClick={() => {
                            setWhichStation("allStation");
                            setTableTitle("Umumiy stansiyalar soni");
                            setColorCard("user-last-data-list-item-href-blue");
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
                              Umumiy stansiyalarning soni
                            </p>
                            <p className="dashboard-list-desc-percentage text-info m-0 text-end">
                              100%
                            </p>
                          </div>
                        </li>
                      ) : null}

                      {stationStatistic?.totalTodayWorkStationsCount > 0 ? (
                        <li
                          className="dashboard-list-item d-flex mt-3 border-green"
                          onClick={() => {
                            setWhichStation("todayStation");
                            setTableTitle("Bugun ishlayotganlar stansiyalar");
                            setColorCard("user-last-data-list-item-href-green");
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
                          className="dashboard-list-item mt-3 d-flex border-azeu"
                          onClick={() => {
                            setWhichStation("withinThreeDayStation");
                            setTableTitle("3 kun ichida ishlagan stansiyalar");
                            setColorCard(
                              "user-last-data-list-item-href-lime-green"
                            );
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
                              {stationStatistic?.totalThreeDayWorkStationsCount}{" "}
                              ta
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
                          className="dashboard-list-item mt-3 d-flex border-yellow"
                          onClick={() => {
                            setWhichStation("totalMonthWorkStation");
                            setTableTitle("Oxirgi oy ishlagan stansiyalar");
                            setColorCard(
                              "user-last-data-list-item-href-yellow"
                            );
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
                          className="dashboard-list-item mt-3 d-flex border-orange"
                          onClick={() => {
                            setWhichStation("totalMoreWorkStations");
                            setTableTitle("Uzoq vaqt ishlamagan qurilmalar");
                            setColorCard(
                              "user-last-data-list-item-href-orange"
                            );
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
                    </ul>
                  </div>

                  <h3 className="m-0 mt-5">{tableTitle} ning ma'lumotlari</h3>

                  <div className="d-flex align-items-center user-last-data-sort-wrapper justify-content-end">
                    <input
                      onChange={(e) => searchStationByInput(e.target.value)}
                      type="text"
                      className="form-control user-last-data-search-input"
                      placeholder="Search..."
                    />

                    <button
                      onClick={() => exportDataToExcel()}
                      className="ms-4 border border-0"
                    >
                      <img src={excel} alt="excel" width={26} height={30} />
                    </button>
                  </div>
                  {loader ? (
                    <div className="d-flex align-items-center justify-content-center hour-spinner-wrapper">
                      <span className="loader"></span>
                    </div>
                  ) : (
                    <ol className="user-last-data-list list-unstyled m-0 mt-4 mb-4 d-flex align-items-center justify-content-between flex-wrap">
                      {allStation?.map((e, i) => {
                        return (
                          <li className="user-last-data-list-item mt-4" key={i}>
                            <a
                              onClick={() => {
                                navigate(
                                  `/user/lastdata/${
                                    whichStation == "allStation"
                                      ? e._id
                                      : e.stationsId
                                  }`
                                );
                                localStorage.setItem(
                                  "stationName",
                                  whichStation == "allStation"
                                    ? e.name
                                    : e.station?.name
                                );
                                localStorage.setItem(
                                  "location",
                                  whichStation == "allStation"
                                    ? e.location
                                    : e.station?.location
                                );
                              }}
                            >
                              <div className="user-last-data-list-item-top d-flex align-items-center justify-content-between">
                                <h3 className="fs-5 m-0">
                                  {whichStation == "allStation"
                                    ? e.name
                                    : e.station?.name}
                                </h3>
                                <div className="d-flex align-items-center justify-content-between">
                                  <p
                                    className={
                                      "m-0 me-1 fw-semibold fs-5 " +
                                      ((whichStation == "allStation"
                                        ? e.battery
                                        : e.station?.battery) >= 70
                                        ? "text-success"
                                        : (whichStation == "allStation"
                                            ? e.battery
                                            : e.station?.battery) < 70 &&
                                          (whichStation == "allStation"
                                            ? e.battery
                                            : e.station?.battery) >= 30
                                        ? "text-warning"
                                        : (whichStation == "allStation"
                                            ? e.battery
                                            : e.station?.battery) < 30
                                        ? "text-danger"
                                        : " ")
                                    }
                                  >
                                    {whichStation == "allStation"
                                      ? e.battery
                                      : e.station?.battery}
                                    %
                                  </p>
                                  <img
                                    src={
                                      (whichStation == "allStation"
                                        ? e.battery
                                        : e.station?.battery) == 100
                                        ? batteryFull
                                        : (whichStation == "allStation"
                                            ? e.battery
                                            : e.station?.battery) == 0
                                        ? batteryNo
                                        : (whichStation == "allStation"
                                            ? e.battery
                                            : e.station?.battery) >= 70 &&
                                          (whichStation == "allStation"
                                            ? e.battery
                                            : e.station?.battery) < 100
                                        ? batteryPow
                                        : (whichStation == "allStation"
                                            ? e.battery
                                            : e.station?.battery) < 30
                                        ? batteryRed
                                        : (whichStation == "allStation"
                                            ? e.battery
                                            : e.station?.battery >= 30) &&
                                          (whichStation == "allStation"
                                            ? e.battery
                                            : e.station?.battery < 70)
                                        ? batteryLow
                                        : null
                                    }
                                    alt="battery"
                                    width={35}
                                    height={35}
                                  />
                                </div>
                              </div>
                              {whichStation == "allStation" ? (
                                <span
                                  className={
                                    checkStationWorkingOrNot(e.lastData) == 0
                                      ? "user-last-data-list-item-href-green"
                                      : checkStationWorkingOrNot(e.lastData) <=
                                        3
                                      ? "user-last-data-list-item-href-lime-green"
                                      : checkStationWorkingOrNot(e.lastData) ==
                                        "one month"
                                      ? "user-last-data-list-item-href-yellow"
                                      : checkStationWorkingOrNot(e.lastData) ==
                                        "after one month"
                                      ? "user-last-data-list-item-href-orange"
                                      : "user-last-data-list-item-href-orange"
                                  }
                                ></span>
                              ) : (
                                <span className={colorCard}></span>
                              )}

                              <span className="">
                                <div className="text-end mt-2">
                                  <div className="d-flex align-items-center">
                                    <p className="m-0 user-lastdata-level-desc">
                                      Sath:{" "}
                                    </p>
                                    <span className="fw-bold text-end w-100 user-lastdata-level-desc">
                                      {whichStation == "allStation" &&
                                      e.lastData != undefined
                                        ? Number(e.lastData?.level).toFixed()
                                        : e?.level != undefined
                                        ? Number(e?.level).toFixed()
                                        : ""}
                                      sm
                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <p className="m-0 user-lastdata-level-desc">
                                      Hajmi:
                                    </p>
                                    <span className="fw-bold text-end w-100 user-lastdata-level-desc">
                                      {whichStation == "allStation" &&
                                      e.lastData != undefined
                                        ? Number(e.lastData?.volume).toFixed()
                                        : e?.volume != undefined
                                        ? Number(e?.volume).toFixed()
                                        : ""}{" "}
                                      m³/s
                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <p className="m-0 user-lastdata-level-desc">
                                      Tuzatish:{" "}
                                    </p>
                                    <span className="fw-bold text-end w-100 user-lastdata-level-desc">
                                      {whichStation == "allStation" &&
                                      e.lastData != undefined
                                        ? Number(
                                            e.lastData?.correction
                                          ).toFixed()
                                        : e?.correction != undefined
                                        ? Number(e?.correction).toFixed()
                                        : ""}{" "}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-2">
                                  <p className="m-0">
                                    {returnFixdDate(
                                      whichStation == "allStation"
                                        ? e?.lastData?.date
                                        : e.date
                                    )}
                                  </p>
                                </div>
                              </span>
                            </a>
                          </li>
                        );
                      })}
                    </ol>
                  )}

                  <ReactPaginate
                    pageCount={totalPages}
                    onPageChange={handlePageChange}
                    forcePage={currentPage}
                    previousLabel={"<<"}
                    nextLabel={">>"}
                    activeClassName={"pagination__link--active"}
                  />
                </div>
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
    </section>
  );
};

export default UserLastData;
