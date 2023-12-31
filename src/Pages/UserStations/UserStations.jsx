import React, { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import circle from "../../assets/images/circle.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import moment from "moment";
import { api } from "../Api/Api";
import excel from "../../assets/images/excel.png";
import * as XLSX from "xlsx";
import axios from "axios";
import "./UserStations.css";
import AliceCarousel from "react-alice-carousel";
import all from "../../assets/images/all.png";
import active from "../../assets/images/active.png";
import passive from "../../assets/images/passive.png";
import defective from "../../assets/images/defective.png";
import warning from "../../assets/images/warning.png";
import warningMessage from "../../assets/images/warning-message.png";

const UserStations = (prop) => {
  const { balanceOrg } = prop;
  const [count, setCount] = useState(0);
  const [allStation, setAllStation] = useState([]);
  const [allStationForBattery, setAllStationForBattery] = useState([]);
  const [notWorkingStation, setNotWorkingStation] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalPagesForBattery, setTotalPagesForBattery] = useState(0);
  const [totalPagesForStatus, setTotalPagesForStatus] = useState(0);
  const [stationOne, setStationOne] = useState({});
  const [stationRegionName, setStationRegionName] = useState();
  const [stationDistrictName, setStationDistrictName] = useState([]);
  const [stationBalansOrgName, setStationBalansOrgName] = useState([]);
  const [sensorType, setSensorType] = useState([]);
  const [whichData, setWhichData] = useState("allStation");
  const [minimumValue, setMinimumValue] = useState("");
  const [maximumValue, setMaximumValue] = useState("");
  const [stationsCountByRegion, setStationsCountByRegion] = useState();
  const [allBalansOrg, setAllBalansOrg] = useState([]);
  const [balansOrgId, setBalansOrgId] = useState();
  const [balansOrgIdForBattery, setBalansOrgIdForBattery] = useState();
  const [balansOrgIdForStatus, setBalansOrgIdForStatus] = useState();
  const [tableTitle, setTableTitle] = useState();
  const [tableTitleForBattery, setTableTitleForBattery] = useState();
  const [tableTitleForStatus, setTableTitleForStatus] = useState();
  const [regionName, setRegionName] = useState();
  const [warningStation, setWarningStation] = useState();
  const [foundStationForDefect, setFoundStationForDefect] = useState();
  const name = window.localStorage.getItem("name");
  const role = window.localStorage.getItem("role");

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
    const fetchData = async () => {
      if(role == 'Organization' || role == 'USER'){
        const request = await customFetch.get(`/stations/all?page=1&perPage=10`);

        setAllStation(request.data.data.data);
        setTotalPages(request.data.data.metadata.lastPage);

        setAllStationForBattery(request.data.data.data);
        setTotalPagesForBattery(request.data.data.metadata.lastPage);

        // ! LAST DATA
        const requestLastData = await customFetch
        .get(`/last-data/getLastDataByOrganization?page=1&perPage=${request.data.data.metadata.total}&organization=${role == 'Organization' ? localStorage.getItem('balanceOrgId') : request.data.data.data[0]?.balance_organization_id}`)
        setFoundStationForDefect(requestLastData.data.data);
      }else {
        // ! ALL STATIONS
        const request = await customFetch.get(`/stations/all?page=1&perPage=10`);

        setAllStationForBattery(request.data.data.data);
        setTotalPagesForBattery(request.data.data.metadata.lastPage);

        // ! STATION BY REGION
        const requestCountRegion = await customFetch
        .get(`/stations/getStationsCountByRegion?regionNumber=${name}`)
        setStationsCountByRegion(requestCountRegion.data)
        let balansId = requestCountRegion.data?.gruopOrganization[0].balance_organization_id
        setBalansOrgId(balansId)

        const requestStation = await customFetch.get(`/stations/all/balanceOrganization?balanceOrganizationNumber=${balansId}&page=1&perPage=10`);

        setAllStation(requestStation.data.data.data);
        setTotalPages(requestStation.data.data.metadata.lastPage);
        // ! LAST DATA
        const requestLastData = await customFetch
        .get(`/last-data/getLastDataByOrganization?page=1&perPage=${requestCountRegion.data.countStationsByRegion}&organization=${balansId}`)
        setFoundStationForDefect(requestLastData.data.data);
      }
    };

    fetchData();
  }, [count]);

  useEffect(() => {
    customFetch.get(`/sensorType/getAll`).then((data) => {
      if (data.data.statusCode == 200) {
        setSensorType(data.data.data);
      }
    });
    // ! NOT WORKING STATIONS
    customFetch
      .get(`/stations/all/statusOff?&page=1&perPage=10`)
      .then((data) => {
        setNotWorkingStation(data.data.data.data);
        setTotalPagesForStatus(data.data.data.metadata.lastPage);
      });

    // ! ALL BALANS ORG
    customFetch
    .get(`/balance-organizations/all-find`)
    .then((data) => setAllBalansOrg(data.data.balanceOrganizations))
  }, []);

  const handlePageChange = (selectedPage) => {
    if(balansOrgId == undefined){
      customFetch
        .get(`/stations/all?page=${selectedPage.selected + 1}&perPage=10`)
        .then((data) => {
          setAllStation(data.data.data.data);
        });
    } else {
      customFetch
      .get(`/stations/all/balanceOrganization?balanceOrganizationNumber=${balansOrgId}&page=${selectedPage.selected + 1}&perPage=10`)
      .then((data) => {
        setAllStation(data.data.data.data);
      });
    }
  };

  const handlePageChangeForBattery = (selectedPage) => {
    if (
      minimumValue.length == 0 ||
      maximumValue.length == 0
    ) {
      if(balansOrgIdForBattery == undefined){
        customFetch
          .get(`/stations/all?page=${selectedPage.selected + 1}&perPage=10`)
          .then((data) => setAllStationForBattery(data.data.data.data));
      }else {
        customFetch
        .get(`/stations/all/balanceOrganization?balanceOrganizationNumber=${balansOrgIdForBattery}&page=${selectedPage.selected + 1}&perPage=10`)
        .then((data) => {
          setAllStationForBattery(data.data.data.data);
        });
      }
    } else {
      if(balansOrgIdForBattery == undefined){
        customFetch
          .get(
            `/last-data/getGreaterAndLessByStations?great=${
              minimumValue - 1
            }&page=${selectedPage.selected + 1}&perPage=10&less=${maximumValue}`
          )
          .then((data) => {
            setAllStationForBattery(data.data.data.data);
          });
      }else {
        customFetch.get(
          `/last-data/getGreaterAndLessByStationsByOrganization?page=${selectedPage.selected + 1}&perPage=10&organization=${balansOrgIdForBattery}&great=${minimumValue - 1}&less=${maximumValue}`
        )
        .then((data) => {
          setAllStationForBattery(data.data.data.data);
        });
      }
    }
  };

  const handlePageChangeForStatus = (selectedPage) => {
    if(balansOrgIdForStatus == undefined){
      customFetch
        .get(
          `/stations/all/statusOff?&page=${selectedPage.selected + 1}&perPage=10`
        )
        .then((data) => {
          setNotWorkingStation(data.data.data.data);
        });
    }else {
      customFetch
        .get(
          `/stations/searchStatusFalseByBalance?balanceOrganizationNumber=${balansOrgIdForStatus}&page=${selectedPage.selected + 1}&perPage=10`
        )
        .then((data) => {
          setNotWorkingStation(data.data.data.data);
        });
    }
  };

  const getStationWithImei = async (imei) => {
    const requestStationOne = await customFetch.get(
      `/stations/searchImel?imel=${imei}`
    );

    setStationOne(requestStationOne.data?.data.data[0]);

    // * REGION NAME
    const requestRegionName = await customFetch.get(
      `/regions/${requestStationOne.data?.data.data[0]?.region_id}`
    );

    setStationRegionName(requestRegionName.data.region.name);

    //* DISTRICT NAME
    const requestDistrictName = await customFetch.get(
      `/districts/${requestStationOne.data?.data.data[0].region_id}`
    );

    setStationDistrictName(requestDistrictName.data.district);

    //* BALANS ORGANIZATION NAME
    const requestBalansOrgName = await customFetch.get(
      `/balance-organizations/${requestStationOne.data?.data.data[0].region_id}`
    );

    setStationBalansOrgName(requestBalansOrgName.data.balanceOrganization);
  };

  const searchNameOrImei = (e) => {
    e.preventDefault();
    const { nameOrImeiInput, nameOrImeiSelect } = e.target;
    if (nameOrImeiSelect.value == "name") {
      if(balansOrgId == undefined){
        customFetch
          .get(`/stations/searchByName?name=${nameOrImeiInput.value}`)
          .then((data) => {
            if (data.data.data.data.length > 0) {
              setTotalPages(0);
              setAllStation(data.data.data.data);
              nameOrImeiInput.value = null
            }
          });
      }else {
        customFetch
          .get(`/stations/searchByNameAndOrganization?name=${nameOrImeiInput.value}&organization=${balansOrgId}`)
          .then((data) => {
            if (data.data.data.data.length > 0) {
              setTotalPages(0);
              setAllStation(data.data.data.data);
              nameOrImeiInput.value = null
            }
          });
      }
    } else if (nameOrImeiSelect.value == "imei") {
      if(balansOrgId == undefined){
        customFetch
          .get(`/stations/searchImel?imel=${nameOrImeiInput.value}`)
          .then((data) => {
            if (data.data.data.data.length > 0) {
              setTotalPages(0);
              setAllStation(data.data.data.data);
              nameOrImeiInput.value = null
            }
          });
      }else {
        customFetch
          .get(`/stations/searchImelByOrganization?imel=${nameOrImeiInput.value}&organization=${balansOrgId}`)
          .then((data) => {
            if (data.data.data.data.length > 0) {
              setTotalPages(0);
              setAllStation(data.data.data.data);
              nameOrImeiInput.value = null
            }
          });
      }
    } else if (nameOrImeiSelect.value == "all") {
      if(balansOrgId == undefined){
        customFetch.get(`/stations/all?page=1&perPage=10`).then((data) => {
          setTotalPages(data.data.data.metadata.lastPage);
          setAllStation(data.data.data.data);
          nameOrImeiInput.value = null
        });
      }else {
        customFetch
        .get(`/stations/all/balanceOrganization?balanceOrganizationNumber=${balansOrgId}&page=1&perPage=10`)
        .then((data) => {
          setAllStation(data.data.data.data);
          setTotalPages(data.data.data.metadata.lastPage);
          nameOrImeiInput.value = null
        });
      }
    }
  };

  const searchByBattery = (e) => {
    e.preventDefault();

    const { nameOrImeiInputMin, nameOrImeiInputMax } = e.target;

    if(balansOrgIdForBattery == undefined){
      customFetch
        .get(
          `/last-data/getGreaterAndLessByStations?great=${nameOrImeiInputMin.value - 1}&page=1&perPage=10&less=${nameOrImeiInputMax.value}`
        )
        .then((data) => {
          setAllStationForBattery(data.data.data.data);
          setTotalPagesForBattery(data.data.data.metadata.lastPage);

          nameOrImeiInputMin.value = null
          nameOrImeiInputMax.value = null
        });
    }else {
      customFetch.get(
        `/last-data/getGreaterAndLessByStationsByOrganization?page=1&perPage=10&organization=${balansOrgIdForBattery}&great=${nameOrImeiInputMin.value - 1}&less=${nameOrImeiInputMax.value}`
      )
      .then((data) => {
        setAllStationForBattery(data.data.data.data);
        setTotalPagesForBattery(data.data.data.metadata.lastPage);
        nameOrImeiInputMin.value = null
        nameOrImeiInputMax.value = null
      });
    }
  };

  const foundBalansOrgName = id => {
    const foundBalansOrg = allBalansOrg.find(i => i.id == id)

    return foundBalansOrg?.name
  }

  // ! SAVE DATA EXCEL
  const exportDataToExcel = async () => {
    const fixedDate = new Date();
    const resultDate = `${fixedDate.getDate()}/${
      fixedDate.getMonth() + 1
    }/${fixedDate.getFullYear()} ${fixedDate.getHours()}:${
      String(fixedDate.getMinutes()).length == 1
        ? "0" + fixedDate.getMinutes()
        : fixedDate.getMinutes()
    }`;

    if (whichData == "allStation") {
      const resultExcelData = [];

      if(balansOrgId == undefined){
        const requestAllStation = await customFetch.get(
          `/stations/all?page=1&perPage=${totalPages * 10}`
        );

        requestAllStation.data.data.data.forEach((e) => {
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
            Sana: e.date,
          });
        });
      }else {
        const requestAllStation = await customFetch.get(
          `/stations/all/balanceOrganization?balanceOrganizationNumber=${balansOrgId}&page=1&perPage=${totalPages * 10}`
        );

        requestAllStation.data.data.data.forEach((e) => {
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
            Sana: e.date,
          });
        });
      }


      const workBook = XLSX.utils.book_new();
      const workSheet = XLSX.utils.json_to_sheet(resultExcelData);

      XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

      if (allStation.length > 0) {
        XLSX.writeFile(
          workBook,
          `${role == 'USER' ? name : role == 'Region' ? `${regionName} ${foundBalansOrgName(balansOrgId) != undefined ? foundBalansOrgName(balansOrgId) : ''}` : balanceOrgName} ning umumiy stansiyalari ${resultDate}.xlsx`
        );
      }
    } else if (whichData == "StationForBattery") {
      const resultExcelData = [];

      if(balansOrgIdForBattery == undefined){
        const requestAllStationForBattery = await customFetch.get(
          `/last-data/getGreaterAndLessByStations?great=${
            minimumValue.length > 0 ? minimumValue - 1 : -1
          }&page=1&perPage=${totalPagesForBattery * 10}&less=${
            maximumValue.length > 0 ? maximumValue : 101
          }`
        );

        requestAllStationForBattery.data.data.data.forEach((e) => {
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
            Sana: e.date,
          });
        });
      }else {
        const requestAllStationForBattery = await customFetch.get(
          `/last-data/getGreaterAndLessByStationsByOrganization?page=1&perPage=${totalPagesForBattery * 10}&organization=${balansOrgIdForBattery}&great=${
            minimumValue.length > 0 ? minimumValue - 1 : -1
          }&less=${
            maximumValue.length > 0 ? maximumValue : 101
          }`
        );

        requestAllStationForBattery.data.data.data.forEach((e) => {
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
            Sana: e.date,
          });
        });
      }

      const workBook = XLSX.utils.book_new();
      const workSheet = XLSX.utils.json_to_sheet(resultExcelData);

      XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

      if (allStationForBattery.length > 0) {
        XLSX.writeFile(
          workBook,
          `${role == 'USER' ? name : role == 'Region' ? `${regionName} ${foundBalansOrgName(balansOrgIdForBattery) != undefined ? foundBalansOrgName(balansOrgIdForBattery) : ''}` : balanceOrgName} ning stansiyalari ${resultDate}.xlsx`
        );
      }
    } else if (whichData == "StationForStatus") {
      const resultExcelData = [];

      if(balansOrgIdForStatus == undefined){
        const requestAllStationForStatus = await customFetch.get(
          `/stations/all/statusOff?&page=1&perPage=${totalPagesForStatus * 10}`
        );

        requestAllStationForStatus.data.data.data.forEach((e) => {
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
            Sana: e.date,
          });
        });
      }else {
        const requestAllStationForStatus = await customFetch.get(
          `/stations/searchStatusFalseByBalance?balanceOrganizationNumber=${balansOrgIdForStatus}&page=1&perPage=${totalPagesForStatus * 10}`
        );

        requestAllStationForStatus.data.data.data.forEach((e) => {
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
            Sana: e.date,
          });
        });
      }

      const workBook = XLSX.utils.book_new();
      const workSheet = XLSX.utils.json_to_sheet(resultExcelData);

      XLSX.utils.book_append_sheet(workBook, workSheet, "MySheet1");

      if (notWorkingStation.length > 0) {
        XLSX.writeFile(
          workBook,
          `${role == 'USER' ? name : role == 'Region' ? `${regionName} ${foundBalansOrgName(balansOrgIdForStatus) != undefined ? foundBalansOrgName(balansOrgIdForStatus) : ''}` : balanceOrgName} ning ishlamagan stansiyalari ${resultDate}.xlsx`
        );
      }
    }
  };

  const responsive = {
    0: { items: 1 },
    820: { items: 2 },
    1100: { items: 3 },
    1400: { items: 5 },
    2000: { items: 5 },
  };

  // ! STATION LIST
  const getStationStatisByBalansOrgForList = id => {
    // !  STATIONS BY BALANS ORGANISATION
      setTableTitle(`${foundBalansOrgName(id)}ga tegishli stansiyalar`)

      customFetch
      .get(`/stations/all/balanceOrganization?balanceOrganizationNumber=${id}&page=1&perPage=10`)
      .then((data) => {
        setAllStation(data.data.data.data);
        setTotalPages(data.data.data.metadata.lastPage);
      });

      // ! LAST DATA
      customFetch
      .get(`/last-data/getLastDataByOrganization?page=1&perPage=${stationsCountByRegion?.countStationsByRegion}&organization=${id}`)
      .then((data) => {
        setFoundStationForDefect(data.data.data);
      });
  }

  // ! STATION BATTERY
  const getStationStatisByBalansOrgForBattery = id => {
    // !  STATIONS BY BALANS ORGANISATION
    if(id == undefined){
      customFetch
      .get(`/stations/all?page=1&perPage=10`)
      .then((data) => {
        setAllStationForBattery(data.data.data.data);
        setTotalPagesForBattery(data.data.data.metadata.lastPage);
      });
    }else {
      setTableTitleForBattery(`${foundBalansOrgName(id)}ga tegishli stansiyalar`)

      customFetch
      .get(`/stations/all/balanceOrganization?balanceOrganizationNumber=${id}&page=1&perPage=10`)
      .then((data) => {
        setAllStationForBattery(data.data.data.data);
        setTotalPagesForBattery(data.data.data.metadata.lastPage);
      });
    }
  }

  // ! STATION STATUS
  const getStationStatisByBalansOrgForStatus = id => {
    // ! NOT WORKING STATIONS
    if(id == undefined){
      customFetch
      .get(`/stations/all/statusOff?&page=1&perPage=10`)
      .then((data) => {
        setNotWorkingStation(data.data.data.data);
        setTotalPagesForStatus(data.data.data.metadata.lastPage);
      });
    }else {
      setTableTitleForStatus(`${foundBalansOrgName(id)}ga tegishli ishlamayotganlar stansiyalar ro'yhati`)

      customFetch
      .get(`/stations/searchStatusFalseByBalance?balanceOrganizationNumber=${id}&page=1&perPage=10`)
      .then((data) => {
        setNotWorkingStation(data.data.data.data);
        setTotalPagesForStatus(data.data.data.metadata.lastPage);
      });
    }
  }

  // ! ITEMS FOR STATION LIST
  const itemsStationList = stationsCountByRegion?.gruopOrganization.map((e, i) => {
    return  <div className="sort-dashboard-list-item ms-3" onClick={(s) => {
      setBalansOrgId(e.balance_organization_id)
      getStationStatisByBalansOrgForList(e.balance_organization_id)
    }}>
       <div className="sort-dashboard-wrapper sort-dashboard-wrapper-last-data">
       <h6>
       {
         foundBalansOrgName(e.balance_organization_id)
       } {" "}
       </h6>
       <div className="d-flex flex-column justify-content-end">
         <div className="d-flex align-items-center m-0">
           <img src={all} alt="active" width={35} height={35} /> <span className="fs-6 ms-1">Jami</span> :<span className="fs-6 ms-1 fw-semibold">{e.countStations} ta</span>
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

  // ! ITEMS FOR STATION BATTERY
  const itemsStationByBattery = stationsCountByRegion?.gruopOrganization.map((e, i) => {
    return  <div className="sort-dashboard-list-item ms-3" onClick={(s) => {
      setBalansOrgIdForBattery(e.balance_organization_id)
      getStationStatisByBalansOrgForBattery(e.balance_organization_id)
      setMinimumValue('')
      setMaximumValue('')
    }}>
       <div className="sort-dashboard-wrapper sort-dashboard-wrapper-last-data">
       <h6>
       {
         foundBalansOrgName(e.balance_organization_id)
       } {" "}
       </h6>
       <div className="d-flex flex-column justify-content-end">
         <div className="d-flex align-items-center m-0">
           <img src={all} alt="active" width={35} height={35} /> <span className="fs-6 ms-1">Jami</span> :<span className="fs-6 ms-1 fw-semibold">{e.countStations} ta</span>
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

  // ! ITEMS FOR STATION STATUS
  const itemsStationByStatus = stationsCountByRegion?.gruopOrganization.map((e, i) => {
    return  <div className="sort-dashboard-list-item ms-3" onClick={(s) => {
      setBalansOrgIdForStatus(e.balance_organization_id)
      getStationStatisByBalansOrgForStatus(e.balance_organization_id)
    }}>
       <div className="sort-dashboard-wrapper sort-dashboard-wrapper-last-data">
       <h6>
       {
         foundBalansOrgName(e.balance_organization_id)
       } {" "}
       </h6>
       <div className="d-flex flex-column justify-content-end">
         <div className="d-flex align-items-center m-0">
           <img src={passive} alt="active" width={35} height={35} /> <span className="fs-6 ms-1">Passive</span>: <span className="fs-6 ms-1 fw-semibold">{e.countNotWorkStations} ta</span>
         </div>
       </div>
     </div>
     </div>
  });

  const getWarningStation = item => {
    const station = foundStationForDefect?.find(e => e._id == item?._id)

    if(station?.lastData != undefined){
        if(station?.lastData?.volume == -1 && station?.lastData?.level == -1) {
          return {
            id: 0,
            name: item?.name,
            volume: -1,
            level: -1
          }
        }else if (station?.lastData?.volume == -1 && station?.lastData?.level != -1) {
          return {
            id: 1,
            volume: -1,
            name: item?.name,
          }
        } else if (station?.lastData?.volume != -1 && station?.lastData?.level == -1) {
          return {
            id: 2,
            level: -1,
            name: item?.name
          }
        }
      }
  }

  return (
    <HelmetProvider>
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

      <section className="home-section py-3">
        {allStation.length > 0 ? (
          <div className="container-fluid">
            <div>
              {/* ToastContainer */}
              <ToastContainer
                position="top-center"
                autoClose={1000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />

              {/* Modal LIST ONE  */}
              <div
                className="modal fade"
                id="exampleModal"
                data-bs-backdrop="static"
                tabIndex="-1"
                aria-labelledby="exampleModalLabel"
                aria-hidden="true"
              >
                <div className="modal-dialog table-location-width modal-dialog-centered">
                  <div className="modal-content table-location-scrol">
                    <div className="modal-header lastdata-close pb-3 pb-0">
                      <h3 className="m-0 text-primary fs-3 cite-main-color">
                        {stationOne?.name}
                      </h3>

                      <button
                        type="button"
                        className="btn-close btn-close-location"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                      ></button>
                    </div>
                    <div className="modal-body pt-0 pt-2 pb-4">
                      <div className="modal-body-item m-auto d-flex align-items-center justify-content-between flex-wrap">
                        <div className="modal-item-wrapper d-flex align-items-center  mt-3">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">Nomi:</p>
                          <p className="m-0 ms-2 fw-semibold">
                            {stationOne?.name}
                          </p>
                        </div>

                        <div className="modal-item-wrapper d-flex align-items-center ">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">Imei:</p>
                          <p className="m-0 ms-2 fw-semibold">
                            {stationOne?.imel}
                          </p>
                        </div>

                        <div className="modal-item-wrapper d-flex align-items-center ">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">Viloyat:</p>
                          <p className="m-0 ms-2 fw-semibold">
                            {stationRegionName}
                          </p>
                        </div>

                        <div className="modal-item-wrapper d-flex align-items-center ">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">Tuman:</p>
                          <p className="m-0 ms-2 fw-semibold">
                            {
                              stationDistrictName.find((e) => {
                                if (e.id == stationOne?.district_id) {
                                  return e.name;
                                }
                              })?.name
                            }
                          </p>
                        </div>

                        <div className="modal-item-wrapper d-flex align-items-center ">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">Balans tashkiloti:</p>
                          <p className="m-0 ms-2 fw-semibold">
                            {
                              stationBalansOrgName.find((e) => {
                                if (
                                  e.id == stationOne?.balance_organization_id
                                ) {
                                  return e.name;
                                }
                              })?.name
                            }
                          </p>
                        </div>

                        <div className="modal-item-wrapper d-flex align-items-center ">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">User telefon raqami:</p>
                          <p className="m-0 ms-2 fw-semibold">
                            {stationOne?.userPhoneNum}
                          </p>
                        </div>

                        <div className="modal-item-wrapper d-flex align-items-center ">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">Qurilma telefon raqami:</p>
                          <p className="m-0 ms-2 fw-semibold">
                            {stationOne?.devicePhoneNum}
                          </p>
                        </div>

                        <div className="modal-item-wrapper d-flex align-items-center ">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">Lokatsiya:</p>
                          <p className="m-0 ms-2 fw-semibold">
                            {stationOne?.location}
                          </p>
                        </div>

                        <div className="modal-item-wrapper d-flex align-items-center ">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">Datani yuborish vaqti:</p>
                          <p className="m-0 ms-2 fw-semibold">
                            {stationOne?.sendDataTime}
                          </p>
                        </div>

                        <div className="modal-item-wrapper d-flex align-items-center ">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">Infoni yuborish vaqti:</p>
                          <p className="m-0 ms-2 fw-semibold">
                            {stationOne?.sendInfoTime}
                          </p>
                        </div>

                        <div className="modal-item-wrapper d-flex align-items-center ">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">Programma versiyasi:</p>
                          <p className="m-0 ms-2 fw-semibold">
                            {stationOne?.programVersion}
                          </p>
                        </div>

                        <div className="modal-item-wrapper d-flex align-items-center ">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">Temperatura:</p>
                          <p className="m-0 ms-2 fw-semibold">
                            {stationOne?.temperture}
                          </p>
                        </div>

                        <div className="modal-item-wrapper d-flex align-items-center ">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">Batareya:</p>
                          <p
                            className={
                              "m-0 ms-2 fw-semibold " +
                              (stationOne.battery > 77
                                ? "text-success"
                                : stationOne.battery <= 77 &&
                                  stationOne.battery >= 50
                                ? "text-warning"
                                : stationOne.battery < 50
                                ? "text-danger"
                                : "")
                            }
                          >
                            {stationOne?.battery}%
                          </p>
                        </div>

                        <div className="modal-item-wrapper d-flex align-items-center ">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">Signal:</p>
                          <p className="m-0 ms-2 fw-semibold">
                            {stationOne?.signal}
                          </p>
                        </div>

                        <div className="modal-item-wrapper d-flex align-items-center ">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">Status:</p>
                          <p className="m-0 ms-2 fw-semibold">
                            {stationOne?.status == 1 ? "ishlayapti" : "ishlamayapti"}
                          </p>
                        </div>

                        <div className="modal-item-wrapper d-flex align-items-center ">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">Sensor type:</p>
                          <p className="m-0 ms-2 fw-semibold">
                            {
                              sensorType.find((e) => {
                                if (e._id == stationOne.sensorTypeId) {
                                  return e.name;
                                }
                              })?.name
                            }
                          </p>
                        </div>

                        <div className="modal-item-wrapper d-flex align-items-center ">
                          <img src={circle} alt="name" width={20} height={20} />
                          <p className="m-0 ms-4">Sana:</p>
                          <p className="m-0 ms-2 fw-semibold">
                            {moment(stationOne.date).format("L")}{" "}
                            {stationOne.date?.split("T")[1]?.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body pt-3">
                  <ul className="nav nav-tabs nav-tabs-bordered">
                    <li className="nav-item">
                      <button
                        className="nav-link active"
                        data-bs-toggle="tab"
                        data-bs-target="#profile-users"
                        onClick={() => setWhichData("allStation")}
                      >
                        Stansiyalar ro'yhati
                      </button>
                    </li>

                    <li className="nav-item">
                      <button
                        className="nav-link"
                        data-bs-toggle="tab"
                        data-bs-target="#profile-search"
                        onClick={() => setWhichData("StationForStatus")}
                      >
                        Ishlamayotganlar stansiyalar
                      </button>
                    </li>

                    <li className="nav-item">
                      <button
                        className="nav-link"
                        data-bs-toggle="tab"
                        data-bs-target="#profile-overview"
                        onClick={() => setWhichData("StationForBattery")}
                      >
                        Batareya bo'yicha qidirish
                      </button>
                    </li>
                  </ul>
                  <div className="tab-content pt-4">
                    {/* ALL STATION */}
                    <div
                      className="tab-pane fade show active profile-users table-scroll"
                      id="profile-users"
                    >
                      <div className="w-100 d-flex align-items-center justify-content-between flex-wrap">
                        {
                          role == 'Region'
                          ?
                          <div className="d-flex align-items-center justify-content-between w-100 mb-4">
                            <h1 className="dashboard-heading ms-2 dashboard-heading-role dashboard-heading-role-last-data">
                              {regionName}ga tegishli balans tashkilotlar
                            </h1>
                            <div className="region-heading-statis-wrapper region-heading-statis-wrapper-last-data d-flex cursor" onClick={() => {
                              setCount(count + 1)
                              getStationStatisByBalansOrgForList()
                            }}>
                              <div className="d-flex align-items-center m-0">
                                <img src={all} alt="active" width={35} height={35} /> <span className="fs-6 ms-1">Jami</span> :<span className="fs-6 ms-1 fw-semibold">{stationsCountByRegion?.countStationsByRegion} ta</span>
                              </div>
                              <div className="d-flex align-items-center m-0">
                                <img src={active} alt="active" className="ms-3" width={30} height={30} /> <span className="fs-6 ms-1">Active</span>: <span className="fs-6 ms-1 fw-semibold">{stationsCountByRegion?.countWorkingStationsRegion} ta</span>
                              </div>
                              <div className="d-flex align-items-center m-0">
                                <img src={passive} className="ms-3" alt="active" width={35} height={35} /> <span className="fs-6 ms-1">Passive</span>: <span className="fs-6 ms-1 fw-semibold">{stationsCountByRegion?.countNotWorkingStationsRegion} ta</span>
                              </div>
                              <div className="d-flex align-items-center m-0">
                                <img src={defective} className="ms-3" alt="active" width={35} height={35} /> <span className="fs-6 ms-1">No soz</span>: <span className="fs-6 ms-1 fw-semibold">{stationsCountByRegion?.countWorkingStationsDefectiveRegion} ta</span>
                              </div>
                            </div>
                          </div>
                          :
                          <h1 className="dashboard-heading ms-2">
                            {balanceOrg.length > 0
                            ? `${balanceOrgName} ga biriktirilgan qurilmalar`
                            : `${name} ga biriktirilgan qurilmalar`}
                          </h1>
                        }
                    </div>

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
                        items={itemsStationList}
                      />
                      <h3 className="stations-search-heading">Qidirish</h3>
                      <form
                        onSubmit={searchNameOrImei}
                        className="search-name-wrapper d-flex align-items-center justify-content-between"
                      >
                        <input
                          name="nameOrImeiInput"
                          type="text"
                          className="form-control w-50"
                          placeholder="Qidiruv..."
                        />

                        <select
                          className="form-select w-25"
                          name="nameOrImeiSelect"
                          required
                        >
                          <option value="name">Nomi</option>
                          <option value="imei">Imei</option>
                          <option value="all">All</option>
                        </select>

                        <button className="btn btn-primary bg-btn main-background-color">
                          Qidirish
                        </button>
                      </form>

                      <div
                        className="d-flex align-items-center justify-content-end cursor-pointer ms-auto user-station-save"
                        onClick={() => exportDataToExcel()}
                      >
                        <p className="m-0 p-0 user-station-save-data-desc">
                          Ma'lumotni saqlash
                        </p>
                        <button
                          onClick={() => exportDataToExcel()}
                          className="ms-3 border border-0"
                        >
                          <img src={excel} alt="excel" width={26} height={30} />
                        </button>
                      </div>

                      {
                        role == 'Region'
                        ?
                        <h3>{`${foundBalansOrgName(balansOrgId)} ga tegishli stansiyalar`}</h3>
                        :
                        null
                      }

                      {allStation?.length == 0 ? (
                        <h3 className="alert alert-info text-center mt-5">
                          Hozircha bunday stansiya yo'q...
                        </h3>
                      ) : (
                        <table className="c-table mt-4 w-100 table table-striped table-hover">
                          <thead className="c-table__header main-background-color">
                            <tr>
                              <th className="c-table__col-label text-center text-light">
                                Nomi
                              </th>
                              <th className="c-table__col-label text-center text-light">
                                Imei
                              </th>
                              <th className="c-table__col-label text-center text-light">
                                Status
                              </th>
                              <th className="c-table__col-label text-center text-light">
                                Temperatura
                              </th>
                              <th className="c-table__col-label text-center text-light">
                                Batareya
                              </th>
                              <th className="c-table__col-label text-center text-light">
                                Signal
                              </th>
                            </tr>
                          </thead>
                          <tbody className="c-table__body">
                            {allStation?.map((e, i) => {
                              return (
                                <tr
                                  className="fs-6 column-admin-station"
                                  key={i}
                                  data-bs-toggle="modal"
                                  data-bs-target="#exampleModal"
                                  onClick={() => {
                                    getStationWithImei(e.imel);
                                  }}
                                >
                                  <td className="c-table__cell text-center">
                                    <div className="d-flex align-items-center justify-content-center">
                                      <span className="fs-6 fw-normal">
                                        {e.name}
                                      </span>
                                      {
                                        e.status == 1 && e.defective == true ?
                                        <img className="cursor-pointer" data-bs-target="#exampleModalToggle" data-bs-toggle="modal" src={warning} alt="warning" width={30} height={30} onClick={() => setWarningStation(e)} />
                                        : null
                                      }
                                    </div>
                                  </td>
                                  <td className="c-table__cell text-center">
                                    {e.imel}
                                  </td>
                                  <td className="c-table__cell text-center">
                                    {e.status == '1' ? "ishlayapti" : "ishlamayapti"}
                                  </td>
                                  <td className="c-table__cell text-center">
                                    {e.temperture}
                                  </td>
                                  <td
                                    className={
                                      "c-table__cell text-center " +
                                      (e.battery > 77
                                        ? "text-success"
                                        : e.battery <= 77 && e.battery >= 50
                                        ? "text-warning"
                                        : e.battery < 50
                                        ? "text-danger"
                                        : "")
                                    }
                                  >
                                    {e.battery}%
                                  </td>
                                  <td className="c-table__cell text-center">
                                    {e.signal}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
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

                    {/* STATUS */}
                    <div
                      className="tab-pane fade profile-search table-scroll"
                      id="profile-search"
                    >
                      <div className="station-status-wrapper w-100 d-flex align-items-center justify-content-between flex-wrap">
                      {
                          role == 'Region'
                          ?
                          <div className="d-flex align-items-center justify-content-between w-100 mb-4">
                            <h1 className="dashboard-heading ms-2 dashboard-heading-role dashboard-heading-role-last-data">
                              {regionName}ga tegishli balans tashkilotlar
                            </h1>
                            <div className="region-heading-statis-wrapper region-heading-statis-wrapper-last-data d-flex cursor" onClick={() => {
                              setBalansOrgIdForStatus(undefined)
                              getStationStatisByBalansOrgForStatus()
                              setTableTitleForStatus(`${regionName}ga tegishli stansiyalar`)
                            }}>
                              <div className="d-flex align-items-center m-0">
                                <img src={passive} className="ms-3" alt="active" width={35} height={35} /> <span className="fs-6 ms-1">Passive</span>: <span className="fs-6 ms-1 fw-semibold">{stationsCountByRegion?.countNotWorkingStationsRegion} ta</span>
                              </div>
                              <div className="d-flex align-items-center m-0">
                                <img src={defective} className="ms-3" alt="active" width={35} height={35} /> <span className="fs-6 ms-1">No soz</span>: <span className="fs-6 ms-1 fw-semibold">{stationsCountByRegion?.countWorkingStationsDefectiveRegion} ta</span>
                              </div>
                            </div>
                          </div>
                          :
                          <h1 className="dashboard-heading ms-2">
                            {balanceOrg.length > 0
                            ? `${balanceOrgName} ga biriktirilgan qurilmalar`
                            : `${name} ga biriktirilgan qurilmalar`}
                          </h1>
                        }
                    </div>

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
                        items={itemsStationByStatus}
                      />

                    {
                      role == 'Region'
                      ?
                      <h3>{tableTitleForStatus == undefined ? `${regionName} ga tegishli stansiyalar` : tableTitleForStatus}</h3>
                      :
                      null
                    }

                      <div
                        className="text-end d-flex align-items-center justify-content-end cursor-pointer ms-auto user-station-save"
                        onClick={() => exportDataToExcel()}
                      >
                        <p className="m-0 p-0 user-station-save-data-desc">
                          Ma'lumotni saqlash
                        </p>
                        <button className="ms-4 border border-0">
                          <img src={excel} alt="excel" width={26} height={30} />
                        </button>
                      </div>
                      {notWorkingStation?.length == 0 ? (
                        <h3 className="alert alert-info text-center mt-5">
                          {tableTitleForStatus?.split('ga')[0]} da ishlamayotgan stansiya yo'q...
                        </h3>
                      ) : (
                        <table className="c-table mt-4  w-10 0 table table-striped table-hover">
                          <thead className="c-table__header main-background-color">
                            <tr>
                              <th className="c-table__col-label text-center text-light">
                                Nomi
                              </th>
                              <th className="c-table__col-label text-center text-light">
                                Imei
                              </th>
                              <th className="c-table__col-label text-center text-light">
                                Status
                              </th>
                              <th className="c-table__col-label text-center text-light">
                                Temperatura
                              </th>
                              <th className="c-table__col-label text-center text-light">
                                Batareya
                              </th>
                              <th className="c-table__col-label text-center text-light">
                                Signal
                              </th>
                            </tr>
                          </thead>
                          <tbody className="c-table__body">
                            {notWorkingStation?.map((e, i) => {
                              return (
                                <tr
                                  className="fs-6 column-admin-station"
                                  key={i}
                                  data-bs-toggle="modal"
                                  data-bs-target="#exampleModal"
                                  onClick={() => {
                                    getStationWithImei(e.imel);
                                  }}
                                >
                                  <td className="c-table__cell text-center">
                                    <div className="d-flex align-items-center justify-content-center">
                                      <span className="fs-6 fw-normal">
                                        {e.name}
                                      </span>
                                      {
                                        e.status == 1 && e.defective == true ?
                                        <img className="cursor-pointer" data-bs-target="#exampleModalToggle" data-bs-toggle="modal" src={warning} alt="warning" width={30} height={30} />
                                        : null
                                      }
                                    </div>
                                  </td>
                                  <td className="c-table__cell text-center">
                                    {e.imel}
                                  </td>
                                  <td className="c-table__cell text-center">
                                    {e.status  == '1' ? "ishlayapti" : "ishlamayapti"}
                                  </td>
                                  <td className="c-table__cell text-center">
                                    {e.temperture}
                                  </td>
                                  <td
                                    className={
                                      "c-table__cell text-center " +
                                      (e.battery > 77
                                        ? "text-success"
                                        : e.battery <= 77 && e.battery >= 50
                                        ? "text-warning"
                                        : e.battery < 50
                                        ? "text-danger"
                                        : "")
                                    }
                                  >
                                    {e.battery}%
                                  </td>
                                  <td className="c-table__cell text-center">
                                    {e.signal}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}

                      <ReactPaginate
                        pageCount={totalPagesForStatus}
                        onPageChange={handlePageChangeForStatus}
                        forcePage={currentPage}
                        previousLabel={"<<"}
                        nextLabel={">>"}
                        activeClassName={"pagination__link--active"}
                      />
                    </div>

                    {/* BATTERY */}
                    <div
                      className="tab-pane fade profile-overview table-scroll"
                      id="profile-overview"
                    >
                      <div className="w-100 d-flex align-items-center justify-content-between flex-wrap">
                      {
                          role == 'Region'
                          ?
                          <div className="d-flex align-items-center justify-content-between w-100 mb-4">
                            <h1 className="dashboard-heading ms-2 dashboard-heading-role dashboard-heading-role-last-data">
                              {regionName}ga tegishli balans tashkilotlar
                            </h1>
                            <div className="region-heading-statis-wrapper region-heading-statis-wrapper-last-data d-flex cursor" onClick={() => {
                              setBalansOrgIdForBattery(undefined)
                              getStationStatisByBalansOrgForBattery()
                              setTableTitleForBattery(`${regionName}ga tegishli stansiyalar`)
                            }}>
                              <div className="d-flex align-items-center m-0">
                                <img src={all} alt="active" width={35} height={35} /> <span className="fs-6 ms-1">Jami</span> :<span className="fs-6 ms-1 fw-semibold">{stationsCountByRegion?.countStationsByRegion} ta</span>
                              </div>
                              <div className="d-flex align-items-center m-0">
                                <img src={active} alt="active" className="ms-3" width={30} height={30} /> <span className="fs-6 ms-1">Active</span>: <span className="fs-6 ms-1 fw-semibold">{stationsCountByRegion?.countWorkingStationsRegion} ta</span>
                              </div>
                              <div className="d-flex align-items-center m-0">
                                <img src={passive} className="ms-3" alt="active" width={35} height={35} /> <span className="fs-6 ms-1">Passive</span>: <span className="fs-6 ms-1 fw-semibold">{stationsCountByRegion?.countNotWorkingStationsRegion} ta</span>
                              </div>
                              <div className="d-flex align-items-center m-0">
                                <img src={defective} className="ms-3" alt="active" width={35} height={35} /> <span className="fs-6 ms-1">No soz</span>: <span className="fs-6 ms-1 fw-semibold">{stationsCountByRegion?.countWorkingStationsDefectiveRegion} ta</span>
                              </div>
                            </div>
                          </div>
                          :
                          <h1 className="dashboard-heading ms-2">
                            {balanceOrg.length > 0
                            ? `${balanceOrgName} ga biriktirilgan qurilmalar`
                            : `${name} ga biriktirilgan qurilmalar`}
                          </h1>
                        }
                    </div>

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
                        items={itemsStationByBattery}
                      />
                      <h3 className="stations-search-heading">
                        Batareya quvvati oralig'ini kiriting
                      </h3>
                      <form
                        onSubmit={searchByBattery}
                        className="search-name-wrapper d-flex align-items-center justify-content-between"
                      >
                        <div className="w-25">
                          <label
                            className="user-station-search-battery-label"
                            htmlFor="nameOrImeiInputMin"
                          >
                            Minimum
                          </label>
                          <input
                            id="nameOrImeiInputMin"
                            name="nameOrImeiInputMin"
                            type="text"
                            className="form-control"
                            placeholder="0"
                            required
                            onChange={(e) => setMinimumValue(e.target.value)}
                          />
                        </div>

                        <div className="w-25">
                          <label
                            className="user-station-search-battery-label"
                            htmlFor="nameOrImeiInputMax"
                          >
                            Maximum
                          </label>
                          <input
                            id="nameOrImeiInputMax"
                            name="nameOrImeiInputMax"
                            type="text"
                            className="form-control"
                            placeholder="100"
                            required
                            onChange={(e) => setMaximumValue(e.target.value)}
                          />
                        </div>
                        <button className="btn btn-primary bg-btn main-background-color">
                          Qidirish
                        </button>
                      </form>

                      <div
                        className="text-end d-flex align-items-center justify-content-end cursor-pointer ms-auto user-station-save"
                        onClick={() => exportDataToExcel()}
                      >
                        <p className="m-0 p-0 user-station-save-data-desc">
                          Ma'lumotni saqlash
                        </p>

                        <button className="ms-3 border border-0">
                          <img src={excel} alt="excel" width={26} height={30} />
                        </button>
                      </div>

                      {
                        role == 'Region'
                        ?
                        <h3>{tableTitleForBattery == undefined ? `${regionName} ga tegishli stansiyalar` : tableTitleForBattery}</h3>
                        :
                        null
                      }

                      {allStationForBattery?.length == 0 ? (
                        <h3 className="alert alert-info text-center mt-5">
                          Hozircha bunday stansiya yo'q...
                        </h3>
                      ) : (
                        <table className="c-table mt-4 w-10 0 table table-striped table-hover">
                          <thead className="c-table__header main-background-color">
                            <tr>
                              <th className="c-table__col-label text-center text-light">
                                Nomi
                              </th>
                              <th className="c-table__col-label text-center text-light">
                                Imei
                              </th>
                              <th className="c-table__col-label text-center text-light">
                                Status
                              </th>
                              <th className="c-table__col-label text-center text-light">
                                Temperatura
                              </th>
                              <th className="c-table__col-label text-center text-light">
                                Batareya
                              </th>
                              <th className="c-table__col-label text-center text-light">
                                Signal
                              </th>
                            </tr>
                          </thead>
                          <tbody className="c-table__body">
                            {allStationForBattery?.map((e, i) => {
                              return (
                                <tr
                                  className="fs-6 column-admin-station"
                                  key={i}
                                  data-bs-toggle="modal"
                                  data-bs-target="#exampleModal"
                                  onClick={() => {
                                    getStationWithImei(e.imel);
                                  }}
                                >
                                  <td className="c-table__cell text-center">
                                    <div className="d-flex align-items-center justify-content-center">
                                      <span className="fs-6 fw-normal">
                                        {e.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="c-table__cell text-center">
                                    {e.imel}
                                  </td>
                                  <td className="c-table__cell text-center">
                                    {e.status == '1' ? "ishlayapti" : "ishlamayapti"}
                                  </td>
                                  <td className="c-table__cell text-center">
                                    {e.temperture}
                                  </td>
                                  <td
                                    className={
                                      "c-table__cell text-center " +
                                      (e.battery > 77
                                        ? "text-success"
                                        : e.battery <= 77 && e.battery >= 50
                                        ? "text-warning"
                                        : e.battery < 50
                                        ? "text-danger"
                                        : "")
                                    }
                                  >
                                    {e.battery}%
                                  </td>
                                  <td className="c-table__cell text-center">
                                    {e.signal}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                      <ReactPaginate
                        pageCount={totalPagesForBattery}
                        onPageChange={handlePageChangeForBattery}
                        forcePage={currentPage}
                        previousLabel={"<<"}
                        nextLabel={">>"}
                        activeClassName={"pagination__link--active"}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Helmet>
                <script src="../src/assets/js/table.js"></script>
              </Helmet>
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
      </section>
    </HelmetProvider>
  );
};

export default UserStations;