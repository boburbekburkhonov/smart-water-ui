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
import allIcon from "../../assets/images/all.png";
import active from "../../assets/images/active.png";
import passive from "../../assets/images/passive.png";
import defective from "../../assets/images/defective.png";
import warning from "../../assets/images/warning.png";
import warningMessage from "../../assets/images/warning-message.png";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { api } from "../Api/Api";
import ReactPaginate from "react-paginate";
import * as XLSX from "xlsx";
import excel from "../../assets/images/excel.png";
import axios, { all } from "axios";
import "./UserLastData.css";
import AliceCarousel from "react-alice-carousel";

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
  const [stationsCountByRegion, setStationsCountByRegion] = useState();
  const [allBalansOrg, setAllBalansOrg] = useState([]);
  const balanceOrgName = localStorage.getItem("balanceOrgName");
  const [balansOrgId, setBalansOrgId] = useState();
  const [regionName, setRegionName] = useState();
  const [warningStation, setWarningStation] = useState();

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

  if(role == 'Region'){
    customFetch
      .get(`/regions/${name}`)
      .then((data) => setRegionName(data.data.region.name));
  }

  useEffect(() => {
    const userDashboardFunc = async () => {
      // ! STATION STATISTIC
      const requestStationStatistic = await customFetch.get(
        `/last-data/getStatisticStations`
      );

      settationStatistic(requestStationStatistic.data.data);
    };

    userDashboardFunc();

    // ! STATION BY REGION
    customFetch
      .get(`/stations/getStationsCountByRegion?regionNumber=${name}`)
      .then((data) => setStationsCountByRegion(data.data))

    // ! ALL BALANS ORG
    customFetch
    .get(`/balance-organizations/all-find`)
    .then((data) => setAllBalansOrg(data.data.balanceOrganizations))
  }, []);

  useEffect(() => {
    if(balansOrgId == undefined){
      if (whichStation == "allStation") {
        // ! LIMIT
        customFetch
          .get(`/last-data/getLastData?page=1&perPage=12`)
          .then((data) => {
            setAllStation(data.data.data)
            setTotalPages(
              data.data.totalPages
            )
          });
      } else if (whichStation == "todayStation") {
        // ! LIMIT
        customFetch
          .get(`/last-data/todayWorkStations?page=1&perPage=12`)
          .then((data) => {
            setAllStation(data.data.data)
            setTotalPages(
              data.data.totalPages
            )
          });
      } else if (whichStation == "withinThreeDayStation") {
        // ! LIMIT
        customFetch
          .get(`/last-data/treeDayWorkStations?page=1&perPage=12`)
          .then((data) => {
            setAllStation(data.data.data)
            setTotalPages(
              data.data.totalPages
            )
          });
      } else if (whichStation == "totalMonthWorkStation") {
        // ! LIMIT
        customFetch
          .get(`/last-data/lastMonthWorkStations?page=1&perPage=12`)
          .then((data) => {
            setAllStation(data.data.data)
            setTotalPages(
              data.data.totalPages
            )
          });
      } else if (whichStation == "totalMoreWorkStations") {
        // ! LIMIT
        customFetch
          .get(`/last-data/moreWorkStations?page=1&perPage=12`)
          .then((data) => {
            setAllStation(data.data.data)
            setTotalPages(
              data.data.totalPages
            )
          });
      } else if (whichStation == "notWorkStation") {
        // ! LIMIT
        customFetch
          .get(`${api}/last-data/getNotLastDataStations?page=1&perPage=12`)
          .then((res) => res.json())
          .then((data) => {
            setAllStation(data.data.data.docs)
            setTotalPages(
              data.data.totalPages
            )
          });
      }
    }else {
      if (whichStation == "allStation") {
        // ! LIMIT
        customFetch
          .get(`/last-data/getLastDataByOrganization?page=1&perPage=12&organization=${balansOrgId}`)
          .then((data) => {
            setAllStation(data.data.data)
            setTotalPages(
              data.data.totalPages
            )
          });
      } else if (whichStation == "todayStation") {
        // ! LIMIT
        customFetch
          .get(`/last-data/todayWorkStationsByOrganization?page=1&perPage=12&organization=${balansOrgId}`)
          .then((data) => {
            setAllStation(data.data.data)
            setTotalPages(
              data.data.totalPages
            )
          });
      } else if (whichStation == "withinThreeDayStation") {
        // ! LIMIT
        customFetch
          .get(`/last-data/treeDayWorkStationsByOrganization?page=1&perPage=12&organization=${balansOrgId}`)
          .then((data) => {
            setAllStation(data.data.data)
            setTotalPages(
              data.data.totalPages
            )
          });
      } else if (whichStation == "totalMonthWorkStation") {
        // ! LIMIT
        customFetch
          .get(`/last-data/lastMonthWorkStationsByOrganization?page=1&perPage=12&organization=${balansOrgId}`)
          .then((data) => {
            setAllStation(data.data.data)
            setTotalPages(
              data.data.totalPages
            )
          });
      } else if (whichStation == "totalMoreWorkStations") {
        // ! LIMIT
        customFetch
          .get(`/last-data/moreWorkStationsByOrganization?page=1&perPage=12&organization=${balansOrgId}`)
          .then((data) => {
            setAllStation(data.data.data)
            setTotalPages(
              data.data.totalPages
            )
          });
      }
    }
  }, [stationStatistic, whichStation]);

  const handlePageChange = (selectedPage) => {
    if(balansOrgId == undefined){
      if (whichStation == "allStation") {
        // ! LIMIT
        customFetch
          .get(
            `/last-data/getLastData?page=${selectedPage.selected + 1}&perPage=12`
          )
          .then((data) =>
          setAllStation(data.data.data)
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
            setAllStation(data.data.data);
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
            setAllStation(data.data.data);
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
            setAllStation(data.data.data);
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
            setAllStation(data.data.data);
          });
      }
    }else {
      if (whichStation == "allStation") {
        // ! LIMIT
        customFetch
          .get(
            `/last-data/getLastDataByOrganization?page=${selectedPage.selected + 1}&perPage=12&organization=${balansOrgId}`
          )
          .then((data) =>
          setAllStation(data.data.data)
          );
      } else if (whichStation == "todayStation") {
        // ! LIMIT
        customFetch
          .get(
            `/last-data/todayWorkStationsByOrganization?page=${
              selectedPage.selected + 1
            }&perPage=12&organization=${balansOrgId}`
          )
          .then((data) => {
            setAllStation(data.data.data);
          });
      } else if (whichStation == "withinThreeDayStation") {
        // ! LIMIT
        customFetch
          .get(
            `/last-data/treeDayWorkStationsByOrganization?page=${
              selectedPage.selected + 1
            }&perPage=12&organization=${balansOrgId}`
          )
          .then((data) => {
            setAllStation(data.data.data);
          });
      } else if (whichStation == "totalMonthWorkStation") {
        // ! LIMIT
        customFetch
          .get(
            `/last-data/lastMonthWorkStationsByOrganization?page=${
              selectedPage.selected + 1
            }&perPage=12&organization=${balansOrgId}`
          )
          .then((data) => {
            setAllStation(data.data.data);
          });
      } else if (whichStation == "totalMoreWorkStations") {
        // ! LIMIT
        customFetch
          .get(
            `/last-data/moreWorkStationsByOrganization?page=${
              selectedPage.selected + 1
            }&perPage=12&organization=${balansOrgId}`
          )
          .then((data) => {
            setAllStation(data.data.data);
          });
      }
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
            [hajm]: Number(e.lastData?.volume).toFixed(2),
            [tuzatish]: Number(e.lastData?.correction),
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
              role == "USER" ? name
              : role == 'Region' ? `${regionName} ${foundBalansOrgName(balansOrgId) != undefined ? foundBalansOrgName(balansOrgId) : ''}`
              :
              balanceOrgName
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
        request.data.data.forEach((e) => {
          resultExcelData.push({
            nomi: e.station.name,
            imei: e.station.imel,
            battery: e.station.battery,
            lokatsiya: e.station.location,
            programma_versiyasi: e.station.programVersion,
            qurilma_telefon_raqami: e.station.devicePhoneNum,
            status: e.station.status == 1 ? "ishlayapti" : "ishlamayapti",
            integratsiya:
              e?.station.isIntegration == true ? "Qilingan" : "Qilinmagan",
            [sath]: Number(e.level).toFixed(2),
            [hajm]: Number(e.volume).toFixed(2),
            [tuzatish]: Number(e.correction),
            sana: e.date,
          });
        });

        const workBook = XLSX.utils.book_new();
        const workSheet = XLSX.utils.json_to_sheet(resultExcelData);

        XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

        if (request.data.data.length > 0) {
          XLSX.writeFile(
            workBook,
            `${
              role == "USER" ? name
              : role == 'Region' ? `${regionName} ${foundBalansOrgName(balansOrgId) != undefined ? foundBalansOrgName(balansOrgId) : ''}`
              : balanceOrgName
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
        request.data.data.forEach((e) => {
          resultExcelData.push({
            nomi: e.station.name,
            imei: e.station.imel,
            battery: e.station.battery,
            lokatsiya: e.station.location,
            programma_versiyasi: e.station.programVersion,
            qurilma_telefon_raqami: e.station.devicePhoneNum,
            status: e.station.status == 1 ? "ishlayapti" : "ishlamayapti",
            integratsiya:
              e?.station.isIntegration == true ? "Qilingan" : "Qilinmagan",
            [sath]: Number(e.level).toFixed(2),
            [hajm]: Number(e.volume).toFixed(2),
            [tuzatish]: Number(e.correction),
            sana: e.date,
          });
        });

        const workBook = XLSX.utils.book_new();
        const workSheet = XLSX.utils.json_to_sheet(resultExcelData);

        XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

        if (request.data.data.length > 0) {
          XLSX.writeFile(
            workBook,
            `${
              role == "USER" ? name
              : role == 'Region' ? `${regionName} ${foundBalansOrgName(balansOrgId) != undefined ? foundBalansOrgName(balansOrgId) : ''}`
              : balanceOrgName
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
        request.data.data.forEach((e) => {
          resultExcelData.push({
            nomi: e.station.name,
            imei: e.station.imel,
            battery: e.station.battery,
            lokatsiya: e.station.location,
            programma_versiyasi: e.station.programVersion,
            qurilma_telefon_raqami: e.station.devicePhoneNum,
            status: e.station.status == 1 ? "ishlayapti" : "ishlamayapti",
            integratsiya:
              e?.station.isIntegration == true ? "Qilingan" : "Qilinmagan",
            [sath]: Number(e.level).toFixed(2),
            [hajm]: Number(e.volume).toFixed(2),
            [tuzatish]: Number(e.correction),
            sana: e.date,
          });
        });

        const workBook = XLSX.utils.book_new();
        const workSheet = XLSX.utils.json_to_sheet(resultExcelData);

        XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

        if (request.data.data.length > 0) {
          XLSX.writeFile(
            workBook,
            `${
              role == "USER" ? name
              : role == 'Region' ? `${regionName} ${foundBalansOrgName(balansOrgId) != undefined ? foundBalansOrgName(balansOrgId) : ''}`
              : balanceOrgName
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
        request.data.data.forEach((e) => {
          resultExcelData.push({
            nomi: e.station.name,
            imei: e.station.imel,
            battery: e.station.battery,
            lokatsiya: e.station.location,
            programma_versiyasi: e.station.programVersion,
            qurilma_telefon_raqami: e.station.devicePhoneNum,
            status: e.station.status == 1 ? "ishlayapti" : "ishlamayapti",
            integratsiya:
              e?.station.isIntegration == true ? "Qilingan" : "Qilinmagan",
            [sath]: Number(e.level).toFixed(2),
            [hajm]: Number(e.volume).toFixed(2),
            [tuzatish]: Number(e.correction),
            sana: e.date,
          });
        });

        const workBook = XLSX.utils.book_new();
        const workSheet = XLSX.utils.json_to_sheet(resultExcelData);

        XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

        if (request.data.data.length > 0) {
          XLSX.writeFile(
            workBook,
            `${
              role == "USER" ? name
              : role == 'Region' ? `${regionName} ${foundBalansOrgName(balansOrgId) != undefined ? foundBalansOrgName(balansOrgId) : ''}`
              : balanceOrgName
            } ning uzoq ishlamagan stansiya ma'lumotlari ${resultDate}.xlsx`
          );
        }
      };

      userMoreMonthDataFunc();
    }
  };

  const searchStationByInput = (value) => {
    if(balansOrgId == undefined){
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
    }else {
      if (whichStation == "allStation") {
        customFetch
          .get(
            `/last-data/searchLastDataByStationByOrganization?page=1&perPage=12&organization=${balansOrgId}&search=${value}`
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
            `/last-data/searchTodayWorkingStationsByOrganization?organization=${balansOrgId}&page=1&perPage=12&search=${value}`
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
            `/last-data/searchThreeDaysWorkingStationsByOrganization?organization=${balansOrgId}&page=1&perPage=12&search=${value}`
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
            `/last-data/searchLastMonthWorkingStationsByOrganization?organization=${balansOrgId}&page=1&perPage=12&search=${value}`
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
            `/last-data/searchMoreWorkingStations?organization=${balansOrgId}&page=1&perPage=12&search=${value}`
          )
          .then((data) => {
            if (data.data.data.docs.length > 0) {
              setAllStation(data.data.data.docs);
              setTotalPages(data.data.data.totalPages);
            }
          });
      }
    }
  };

  const loaderFunc = () => {
    setLoader(true);

    setTimeout(() => {
      setLoader(false);
    }, 1000);
  };

  const foundBalansOrgName = id => {
    const foundBalansOrg = allBalansOrg.find(i => i.id == id)

    return foundBalansOrg?.name
  }

  const responsive = {
    0: { items: 1 },
    820: { items: 2 },
    1100: { items: 3 },
    1400: { items: 5 },
    2000: { items: 5 },
  };

  const getStationStatisByBalansOrg = id => {
    // ! STATISTIC STATION BY BALANS ORG
    if(id == undefined){
      customFetch
      .get(`/last-data/getStatisticStations`)
      .then((data) => settationStatistic(data.data.data));
    }else {
      customFetch
      .get(`/last-data/getStatisticStationsByOrganization?organization=${id}`)
      .then((data) => settationStatistic(data.data.data));
    }

  }

  const items = stationsCountByRegion?.gruopOrganization.map((e, i) => {
    return  <div className="sort-dashboard-list-item ms-3" onClick={(s) => {
      setBalansOrgId(e.balance_organization_id)
      getStationStatisByBalansOrg(e.balance_organization_id)
      setWhichStation('allStation')
      setTableTitle("Umumiy stansiyalar soni");
      loaderFunc()
    }}>
       <div className="sort-dashboard-wrapper sort-dashboard-wrapper-last-data">
       <h6>
       {
         foundBalansOrgName(e.balance_organization_id)
       } {" "}
       </h6>
       <div className="d-flex flex-column justify-content-end">
         <div className="d-flex align-items-center m-0">
           <img src={allIcon} alt="active" width={35} height={35} /> <span className="fs-6 ms-1">Jami</span> :<span className="fs-6 ms-1 fw-semibold">{e.countStations} ta</span>
         </div>
         <div className="d-flex align-items-center m-0">
           <img src={active} alt="active" width={30} height={30} /> <span className="fs-6 ms-1">Active</span>: <span className="fs-6 ms-1 fw-semibold">{e.countWorkStations} ta</span>
         </div>
         <div className="d-flex align-items-center m-0">
           <img src={passive} alt="active" width={35} height={35} /> <span className="fs-6 ms-1">Passive</span>: <span className="fs-6 ms-1 fw-semibold">{e.countNotWorkStations} ta</span>
         </div>
         <div className="d-flex align-items-center m-0">
           <img src={defective} alt="active" width={35} height={35} /> <span className="fs-6 ms-1">No soz</span>: <span className="fs-6 ms-1 fw-semibold">{e.countWorkingStationsDefectiveRegion} ta</span>
         </div>
       </div>
     </div>
     </div>
  });

  // ! FIXED STATION NAME
  const fixedNameStation = name => {
    const fixedName = name?.split('_')
    if(fixedName?.length > 2){
      return `${fixedName[0]}_${fixedName[1]}`
    }else {
      return name
    }
  }

  const getWarningStation = item => {
    if(item?.station == undefined){
     if(item?.lastData?.volume == -1 && item?.lastData?.level == -1) {
       return {
         id: 0,
         name: item?.name,
         volume: -1,
         level: -1
       }
     }else if (item?.lastData?.volume == -1 && item?.lastData?.level != -1) {
       return {
         id: 1,
         volume: -1,
         name: item?.name,
       }
     } else if (item?.lastData?.volume != -1 && item?.lastData?.level == -1) {
       return {
         id: 2,
         level: -1,
         name: item?.name
       }
     }
   }else {
     if(item?.volume == -1 && item?.level == -1) {
       return {
         id: 0,
         name: item?.station.name,
         volume: -1,
         level: -1
       }
     }else if (item?.volume == -1 && item?.level != -1) {
       return {
         id: 1,
         volume: -1,
         name: item?.station.name,
       }
     } else if (item?.volume != -1 && item?.level == -1) {
       return {
         id: 2,
         level: -1,
         name: item?.station.name
       }
     }
   }
 }

  return (
    <section className="home-section py-3">
      {/* MODAL DEFECT */}
      <div className="modal fade" id="exampleModalToggle" aria-hidden="true" aria-labelledby="exampleModalToggleLabel" tabIndex="-1">
        <div className="modal-dialog modal-warning modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header modal-header-warning">
              <div className="m-auto">
                <img  src={warning} width={100} height={100} alt="warning" />
              </div>
            </div>
            <div className="modal-body b-0">
              <h4 className="heading-modal-warning text-center">
                Qurilmada nosozlik aniqlandi!
              </h4>
              {
                getWarningStation(warningStation)?.id == 0
                ?
                <ul className="m-0 p-0 ps-3">
                  <li className="d-flex align-items-start mt-4">
                      <img src={warningMessage} width={25} height={25} alt="warningMessage" />
                      <div className="m-0 ms-2 d-flex align-items-center flex-wrap">
                        <p className="m-0 ms-2 text-dark">
                          {getWarningStation(warningStation)?.name} nomli qurilmaning sensorida nosozlik mavjud bo'lishi mumkin
                        </p>
                        <p className="d-flex align-items-center text-dark m-0 mt-2 mb-1">
                          ● Nosozlik sathning qiymatlarida: <span className="fs-6 ms-1 text-danger">{getWarningStation(warningStation)?.level} sm</span>
                        </p>
                        <p className="d-flex align-items-center text-dark m-0">
                          ● Nosozlik koordinata jadvalining qiymatlarida: <span className="fs-6 ms-1 text-danger">{getWarningStation(warningStation)?.volume} m³/s</span>
                        </p>
                      </div>
                  </li>
                  <li className="d-flex align-items-start mt-3">
                    <p className="text-dark ms-2 fst-italic">
                      *Qurilmaning sensori ishlamayotgan bo'lishi mumkin!
                    </p>
                  </li>
                </ul>
                :
                <ul className="m-0 p-0 ps-3">
                  <li className="d-flex align-items-start mt-4">
                      <img src={warningMessage} width={25} height={25} alt="warningMessage" />
                      <div className="m-0 ms-2 d-flex align-items-center flex-wrap">
                        <p className="m-0 ms-2 text-dark">
                          {getWarningStation(warningStation)?.name} nomli qurilmaning sensorida nosozlik mavjud bo'lishi mumkin
                        </p>
                        <p className="d-flex align-items-center text-dark mt-3">
                          ● Nosozlik koordinata jadvalining qiymatlarida: <span className="fs-6 ms-1 text-danger">{getWarningStation(warningStation)?.volume} m³/s</span>
                        </p>
                      </div>
                  </li>
                  <li className="d-flex align-items-start mt-3">
                    <p className="text-dark ms-2 fst-italic">
                      *Qurilma xotirasiga kiritilgan koordinata jadvali noto'g'ri yoki umuman kiritilmagan bo'lishi mumkin!
                    </p>
                  </li>
                </ul>
              }
            </div>
            <div className="modal-footer modal-footer-warning pt-0">
              <button className="btn btn-warning text-light w-25" data-bs-target="#exampleModalToggle2" data-bs-toggle="modal">Ok</button>
            </div>
          </div>
        </div>
      </div>

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
                    {
                      role == 'Region'
                      ?
                      <div className="w-100 d-flex align-items-center justify-content-between mb-4">
                      <h1 className="dashboard-heading ms-2 dashboard-heading-role dashboard-heading-role-last-data">
                      {regionName}ga tegishli balans tashkilotlar
                      </h1>
                      <div className="region-heading-statis-wrapper region-heading-statis-wrapper-last-data d-flex cursor" onClick={() => {
                        setBalansOrgId(undefined)
                        getStationStatisByBalansOrg()
                        setWhichStation("allStation");
                        setTableTitle("Umumiy stansiyalar soni");
                        loaderFunc()
                      }}>
                        <div className="d-flex align-items-center m-0">
                          <img src={allIcon} alt="active" width={35} height={35} /> <span className="fs-6 ms-1">Jami</span> :<span className="fs-6 ms-1 fw-semibold">{stationsCountByRegion.countStationsByRegion} ta</span>
                        </div>
                        <div className="d-flex align-items-center m-0">
                          <img src={active} alt="active" className="ms-3" width={30} height={30} /> <span className="fs-6 ms-1">Active</span>: <span className="fs-6 ms-1 fw-semibold">{stationsCountByRegion.countWorkingStationsRegion} ta</span>
                        </div>
                        <div className="d-flex align-items-center m-0">
                          <img src={passive} className="ms-3" alt="active" width={35} height={35} /> <span className="fs-6 ms-1">Passive</span>: <span className="fs-6 ms-1 fw-semibold">{stationsCountByRegion.countNotWorkingStationsRegion} ta</span>
                        </div>
                        <div className="d-flex align-items-center m-0">
                          <img src={defective} className="ms-3" alt="active" width={35} height={35} /> <span className="fs-6 ms-1">No soz</span>: <span className="fs-6 ms-1 fw-semibold">{stationsCountByRegion.countWorkingStationsDefectiveRegion} ta</span>
                        </div>
                      </div>
                    </div>
                    :
                    <h1 className="mb-3 user-lastdata-heading">
                      {balanceOrg.length == 0
                        ? `${name} ga biriktirilgan qurilmalar`
                        : `${balanceOrgName} ga biriktirilgan qurilmalar`}
                    </h1>
                    }

                    {
                  role == 'Region'
                  ?
                  <ol className="list-unstyled sort-dashboard-list m-0 mb-4 d-flex align-items-center justify-content-center">
                    <AliceCarousel
                      autoPlay={true}
                      // infinite={true}
                      autoPlayStrategy="all"
                      responsive={responsive}
                      disableButtonsControls={true}
                      animationDuration="900"
                      autoPlayInterval={10000}
                      paddingLeft={40}
                      mouseTracking
                      items={items}
                      />
                  </ol>
                :
                null
                }
                    {
                      role == "Region"
                      ?
                      <h3>
                    {regionName} {foundBalansOrgName(balansOrgId) != undefined ? foundBalansOrgName(balansOrgId) + ' balans tashkiloti': null}  statistikasi
                    </h3>
                    : null
                    }
                    <ul className="dashboard-list dashboard-list-last-data list-unstyled m-0 d-flex flex-wrap align-items-center">
                      {stationStatistic?.totalStationsCount > 0 ? (
                        <li
                          className="dashboard-list-item dashboard-list-item-last-data  d-flex border-blue"
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
                          className="dashboard-list-item dashboard-list-item-last-data d-flex mt-3 border-green"
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
                          className="dashboard-list-item dashboard-list-item-last-data mt-3 d-flex border-azeu"
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
                          className="dashboard-list-item dashboard-list-item-last-data mt-3 d-flex border-yellow"
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
                          className="dashboard-list-item dashboard-list-item-last-data mt-3 d-flex border-orange"
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

                  <div className="mt-5 d-flex align-items-center justify-content-between">
                    <h3 className="m-0">{tableTitle} ning ma'lumotlari</h3>

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
                  </div>
                  {loader ? (
                    <div className="d-flex align-items-center justify-content-center hour-spinner-wrapper">
                      <span className="loader"></span>
                    </div>
                  ) : (
                    <ol className="user-last-data-list list-unstyled m-0 d-flex align-items-center flex-wrap">
                      {allStation?.map((e, i) => {
                        return (
                          <li className="user-last-data-list-item" key={i}>
                            <a>
                              <div className="user-last-data-list-item-top d-flex align-items-center justify-content-between">
                                <h3 className="fs-5 m-0">
                                  {whichStation == "allStation"
                                    ?
                                    <div className="d-flex align-items-center justify-content-center">
                                      <span>
                                        {fixedNameStation(e.name)}
                                      </span>
                                      {
                                        e.status == 1 && e.defective == true ?
                                        <img className="cursor-pointer" data-bs-target="#exampleModalToggle" data-bs-toggle="modal" src={warning} alt="warning" width={35} height={35} onClick={() => setWarningStation(e)} />
                                        : null
                                      }
                                    </div>
                                    :
                                    <div className="d-flex align-items-center justify-content-center">
                                      <span>
                                        {fixedNameStation(e.station?.name)}
                                      </span>
                                      {
                                        e.station?.status == 1 && e.station?.defective == true ?
                                        <img className="cursor-pointer" data-bs-target="#exampleModalToggle" data-bs-toggle="modal" src={warning} alt="warning" width={35} height={35} onClick={() => setWarningStation(e)} />
                                        : null
                                      }
                                    </div>
                                    }
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

                              <span onClick={() => {
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
                              }}>
                                <div className="text-end mt-2">
                                  <div className="d-flex align-items-center">
                                    <p className="m-0 user-lastdata-level-desc">
                                      Sath:{" "}
                                    </p>
                                    <span className="fw-bold text-end w-100 user-lastdata-level-desc">
                                      {whichStation == "allStation" &&
                                      e.lastData != undefined
                                        ? `${Number(e.lastData?.level).toFixed()} sm`
                                        : e?.level != undefined
                                        ? `${Number(e?.level).toFixed()} sm`
                                        : "-"}

                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <p className="m-0 user-lastdata-level-desc">
                                      Hajm:
                                    </p>
                                    <span className="fw-bold text-end w-100 user-lastdata-level-desc">
                                      {whichStation == "allStation" &&
                                      e.lastData != undefined
                                        ? `${Number(e.lastData?.volume).toFixed()} m³/s`
                                        : e?.volume != undefined
                                        ? `${Number(e?.volume).toFixed()} m³/s`
                                        : "-"}
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
                                        : "-"}
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
