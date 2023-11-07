import React, { useEffect } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import excel from "../../assets/images/excel.png";
import pdf from "../../assets/images/pdf.jpg";
import {
  GoogleMap,
  MarkerF,
  useLoadScript,
  InfoWindowF,
} from "@react-google-maps/api";
import { Line } from "react-chartjs-2";
import { api } from "../Api/Api";
import { useState } from "react";
import * as XLSX from "xlsx";
import circleRed from "../../assets/images/circle-red.png";
import circleBlue from "../../assets/images/record.png";
import locationRed from "../../assets/images/location-red.png";
import locationGreen from "../../assets/images/location-green.png";
import locationYellow from "../../assets/images/location-yellow.png";
import locationOrange from "../../assets/images/location-orange.png";
import moment from "moment";
import "moment/dist/locale/uz-latn";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ReactPaginate from "react-paginate";
import axios from "axios";
import "./UserData.css";

const UserData = () => {
  const dateSearch = new Date();
  dateSearch.setDate(new Date().getDate() - 4);
  const [hourSearchBoolean, setHourSearchBoolean] = useState(false);
  const [searchBetweenStartDate, setSearchBetweenStartDate] = useState(
    dateSearch.toISOString().substring(0, 10)
  );
  const [searchBetweenEndDate, setSearchBetweenEndDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [searchBetweenBoolean, setSearchBetweenBoolean] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPagesSearchBetween, setTotalPagesSearchBetween] = useState(0);
  const [totalPagesHour, setTotalPagesHour] = useState(0);
  const [totalPagesYesterday, setTotalPagesYesterday] = useState(0);
  const [totalPagesDaily, setTotalPagesDaily] = useState(0);
  const [totalPagesMonthly, setTotalPagesMonthly] = useState(0);
  const [activeMarker, setActiveMarker] = useState();
  const [searchDate, setSearchDate] = useState(false);
  const [statisticsStation, setStatisticsStation] = useState([]);
  const [searchBetweenDataMain, setSearchBetweenDataMain] = useState([]);
  const [searchBetweenData, setSearchBetweenData] = useState([]);
  const [lastDataMain, setLastDataMain] = useState([]);
  const [lastData, setLastData] = useState([]);
  const [lastDataLength, setLastDataLength] = useState(0);
  const [todayDataMain, setTodayDataMain] = useState([]);
  const [todayData, setTodayData] = useState([]);
  const [todayDataStatistic, setTodayDataStatistic] = useState([]);
  const [yesterdayDataMain, setYesterdayDataMain] = useState([]);
  const [yesterdayData, setYesterdayData] = useState([]);
  const [yesterdayDataStatistic, setYesterdayDataStatistic] = useState([]);
  const [dailydayDataMain, setDailyDataMain] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [dailyDataStatistic, setDailyDataStatistic] = useState([]);
  const [searchBetweenDataStatistic, setSearchBetweenDataStatistic] = useState(
    []
  );
  const [monthlydayDataMain, setMonthlyDataMain] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [monthlyDataStatistic, setMonthlyDataStatistic] = useState([]);
  const [valueStatistic, setValueStatistic] = useState("level");
  const [valueTodayData, setValueTodayData] = useState("level");
  const [valueDailyDataTable, setValueDailyDataTable] = useState(
    new Date().toISOString().substring(0, 7)
  );
  const role = window.localStorage.getItem("role");
  const name = window.localStorage.getItem("name");
  const [whichData, setWhichData] = useState("hour");
  const [searchWithDaily, setSearchWithDaily] = useState(false);
  const [hourInputValue, setHourInputValue] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const balanceOrgName = localStorage.getItem("balanceOrgName");
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
  const valueTodayTable = [
    "00",
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
  ];
  const lastDateOfMonth = moment()
    .endOf("month")
    .format("YYYY-MM-DD")
    .split("-")[2];

  const valueMonth = [];

  for (let item = 1; item <= lastDateOfMonth; item++) {
    valueMonth.push(String(item).length == 1 ? `0${item}` : item);
  }

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
    const getStationFunc = async () => {
      // ! STATISTICS
      const requestStationStatistics = await customFetch.get(
        `/last-data/getStatisticStations`
      );

      setStatisticsStation(requestStationStatistics.data.data);

      // ! TODAY DATA
      const requestTodayData = await customFetch.get(
        `/mqttDataWrite/getAllTodayData?page=1&perPage=10`
      );

      setTodayDataMain(requestTodayData.data.data);
      setTodayData(requestTodayData.data.data);
      setTotalPagesHour(requestTodayData.data.totalPages);

      // ! YESTERDAY DATA
      const requestYesterdayData = await customFetch.get(
        `/yesterdayData/getAllYesterdayData?page=1&perPage=10`
      );

      setYesterdayDataMain(requestYesterdayData.data.data);
      setYesterdayData(requestYesterdayData.data.data);
      setTotalPagesYesterday(requestYesterdayData.data.totalPages);

      // ! DAILY DATA
      const requestDailyData = await customFetch.get(
        `/dailyData/getAllStationsDataByMonth?page=1&perPage=10&month=${valueDailyDataTable}`
      );

      setDailyDataMain(requestDailyData.data.data);
      setDailyData(requestDailyData.data.data);
      setTotalPagesDaily(requestDailyData.data.totalPages);

      // ! MONTHLY DATA
      const requestMonthlyData = await customFetch.get(
        `/monthlyData/getAllStationDataByYear?page=1&perPage=10&year=${new Date()
          .toISOString()
          .substring(0, 4)}`
      );

      setMonthlyDataMain(requestMonthlyData.data.stations.data);
      setMonthlyData(requestMonthlyData.data.stations.data);
      setTotalPagesMonthly(requestMonthlyData.data.stations.totalPages);

      // ! SEARCH BETWEEN
      setSearchBetweenBoolean(true);
      const requestSearchBetween = await customFetch.get(
        `/yesterdayData/getAllDataByTwoDayBetween?page=1&perPage=10&startDay=${searchBetweenStartDate}&endDay=${searchBetweenEndDate}`
      );

      setSearchBetweenDataMain(requestSearchBetween.data.data);
      setSearchBetweenData(requestSearchBetween.data.data);
      setTotalPagesSearchBetween(requestSearchBetween.data.totalPages);
      setSearchBetweenBoolean(false);
    };

    getStationFunc();
  }, [searchDate]);

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
            lastDataMain.push(e);
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
    whichData == "hour" && !searchWithDaily
      ? todayDataStatistic.todayData?.map((e) => e.date.split(" ")[1]).reverse()
      : whichData == "hour" && searchWithDaily
      ? todayDataStatistic.allData?.map((e) => e.date.split(" ")[1]).reverse()
      : whichData == "yesterday"
      ? yesterdayDataStatistic.yesterdayData?.map((e) => e.date.split(" ")[1]).reverse()
      : whichData == "daily"
      ? dailyDataStatistic.dailyData?.map((e) => e.date.split("-")[2]).reverse()
      : whichData == "monthly"
      ? monthlyDataStatistic.monthlyData?.map((e) => {
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
          whichData == "hour" && !searchWithDaily
            ? todayDataStatistic.todayData?.map((e) =>
                Number(e[valueStatistic]).toFixed()
              ).reverse()
            : whichData == "hour" && searchWithDaily
            ? todayDataStatistic.allData?.map((e) =>
                Number(e[valueStatistic]).toFixed()
              ).reverse()
            : whichData == "yesterday"
            ? yesterdayDataStatistic.yesterdayData?.map((e) =>
                Number(e[valueStatistic]).toFixed()
              ).reverse()
            : whichData == "daily"
            ? dailyDataStatistic.dailyData?.map((e) =>
                Number(e[valueStatistic]).toFixed()
              ).reverse()
            : whichData == "search-between"
            ? searchBetweenDataStatistic.allData?.map((e) =>
                Number(e[valueStatistic]).toFixed()
              ).reverse()
            : whichData == "monthly"
            ? monthlyDataStatistic.monthlyData?.map((e) =>
                Number(e[valueStatistic]).toFixed()
              ).reverse()
            : null,
        fill: false,
        borderColor: "#EE8A9D",
        backgroundColor: "#F3E5E7",
        tension: 0.4,
      },
    ],
  };

  const scalesMinMaxLine = () => {
    if(whichData == "hour" && !searchWithDaily){
      if(todayDataStatistic.todayData?.length > 0){
        const resultData = []
        todayDataStatistic.todayData.forEach(e => {
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
    } else if(whichData == "hour" && searchWithDaily){
      if(todayDataStatistic.allData?.length > 0) {
        const resultData = []
        todayDataStatistic.allData.forEach(e => {
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
      if(yesterdayDataStatistic.yesterdayData?.length > 0) {
        const resultData = []
        yesterdayDataStatistic.yesterdayData.forEach(e => {
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
      if(dailyDataStatistic.dailyData?.length > 0) {
        const resultData = []
        dailyDataStatistic.dailyData.forEach(e => {
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
      if(monthlyDataStatistic.monthlyData?.length > 0) {
        const resultData = []
        monthlyDataStatistic.monthlyData.forEach(e => {
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
        min: scalesMinMaxLine().min - 40,
        max: scalesMinMaxLine().max + 40
      }
    },
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

  const searchTodayDataWithInput = (inputValue) => {
    if (whichData == "hour") {
      const search = todayDataMain.filter((e) =>
        e.name.toLowerCase().includes(inputValue)
      );
      setTodayData(search);
    } else if (whichData == "yesterday") {
      const search = yesterdayDataMain.filter((e) =>
        e.name.toLowerCase().includes(inputValue)
      );
      setYesterdayData(search);
    } else if (whichData == "daily") {
      const search = dailydayDataMain.filter((e) =>
        e.name.toLowerCase().includes(inputValue)
      );
      setDailyData(search);
    } else if (whichData == "monthly") {
      const search = monthlydayDataMain.filter((e) =>
        e.name.toLowerCase().includes(inputValue)
      );
      setMonthlyData(search);
    } else if (whichData == "search-between") {
      const search = searchBetweenDataMain.filter((e) =>
        e.name.toLowerCase().includes(inputValue)
      );
      setSearchBetweenData(search);
    }
  };

  const searchTodayDataWithDate = (date) => {
    setHourSearchBoolean(true);
    customFetch
      .get(`/yesterdayData/getAllDataByDay?page=1&perPage=10&day=${date}`)
      .then((data) => {
        setSearchWithDaily(true);
        setTodayDataMain(data.data.data);
        setTodayData(data.data.data);
        setTotalPagesHour(data.data.totalPages);
        setHourSearchBoolean(false);
      });
  };

  const searchDailyDataWithDate = (date) => {
    setHourSearchBoolean(true);
    customFetch
      .get(
        `/dailyData/getAllStationsDataByMonth?page=1&perPage=10&month=${date}`
      )
      .then((res) => res.json())
      .then((data) => {
        setDailyDataMain(data.data.data);
        setDailyData(data.data.data);
        setTotalPagesDaily(data.data.totalPages);
        setHourSearchBoolean(false);
      });
  };

  // ! SAVE DATA PDF
  const exportNewsByPdf = () => {
    const fixedDate = new Date();

    const resultDate = `${fixedDate.getDate()}/${
      fixedDate.getMonth() + 1
    }/${fixedDate.getFullYear()} ${fixedDate.getHours()}:${
      String(fixedDate.getMinutes()).length == 1
        ? "0" + fixedDate.getMinutes()
        : fixedDate.getMinutes()
    }`;

    if (whichData == "hour") {
      const doc = new jsPDF("l", "mm", [397, 210]);

      doc.text(
        `${role == 'USER' ? name : balanceOrgName} ga tegishli bugungi ${
          valueTodayData == "level"
            ? "sath"
            : valueTodayData == "volume"
            ? "hajm"
            : valueTodayData == "correction"
            ? "tuzatish"
            : null
        } ma'lumotlari`,
        20,
        10
      );

      doc.autoTable({
        html: "#table-style-hour-id",
        margin: { right: 5, left: 5 },
        styles: { halign: "center" },
        theme: "striped",
        headStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
        bodyStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
      });

      if (todayData.length > 0) {
        doc.save(
          `${role == 'USER' ? name : balanceOrgName} ga tegishli bugungi ${
            valueTodayData == "level"
              ? "sath"
              : valueTodayData == "volume"
              ? "hajm"
              : valueTodayData == "correction"
              ? "tuzatish"
              : null
          } ma'lumotlari ${resultDate}.pdf`
        );
      }
    } else if (whichData == "daily") {
      const doc = new jsPDF("l", "mm", [397, 210]);

      doc.text(
        `${role == 'USER' ? name : balanceOrgName} ning kunlik ${
          valueTodayData == "level"
            ? "sath"
            : valueTodayData == "conductivity"
            ? "sho'rlanish"
            : valueTodayData == "temp"
            ? "temperatura"
            : null
        } ma'lumotlari`,
        20,
        10
      );

      doc.autoTable({
        html: "#table-style-daily-id",
        margin: { right: 5, left: 5 },
        styles: { halign: "center" },
        theme: "striped",
        headStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
        bodyStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
      });

      if (dailyData.length > 0) {
        doc.save(
          `${role == 'USER' ? name : balanceOrgName} ning kunlik ${
            valueTodayData == "level"
              ? "sath"
              : valueTodayData == "conductivity"
              ? "sho'rlanish"
              : valueTodayData == "temp"
              ? "temperatura"
              : null
          } ma'lumotlari ${resultDate}.pdf`
        );
      }
    } else if (whichData == "monthly") {
      const doc = new jsPDF("l", "mm", [307, 210]);

      doc.text(
        `${role == 'USER' ? name : balanceOrgName} ning oylik ${
          valueTodayData == "level"
            ? "sath"
            : valueTodayData == "conductivity"
            ? "sho'rlanish"
            : valueTodayData == "temp"
            ? "temperatura"
            : null
        } ma'lumotlari`,
        20,
        10
      );

      doc.autoTable({
        html: "#table-style-monthly-id",
        margin: { right: 5, left: 5 },
        styles: { halign: "center" },
        theme: "striped",
        headStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
        bodyStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
      });

      if (monthlyData.length > 0) {
        doc.save(
          `${role == 'USER' ? name : balanceOrgName} ning oylik ${
            valueTodayData == "level"
              ? "sath"
              : valueTodayData == "conductivity"
              ? "sho'rlanish"
              : valueTodayData == "temp"
              ? "temperatura"
              : null
          } ma'lumotlari ${resultDate}.pdf`
        );
      }
    } else if (whichData == "yesterday") {
      const doc = new jsPDF("l", "mm", [397, 210]);

      doc.text(
        `${role == 'USER' ? name : balanceOrgName} ning kecha kelgan ${
          valueTodayData == "level"
            ? "sath"
            : valueTodayData == "conductivity"
            ? "sho'rlanish"
            : valueTodayData == "temp"
            ? "temperatura"
            : null
        } ma'lumotlari`,
        20,
        10
      );

      doc.autoTable({
        html: "#table-style-yesterday-id",
        margin: { right: 5, left: 5 },
        styles: { halign: "center" },
        theme: "striped",
        headStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
        bodyStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
      });

      if (yesterdayData.length > 0) {
        doc.save(
          `${role == 'USER' ? name : balanceOrgName} ning kecha kelgan ${
            valueTodayData == "level"
              ? "sath"
              : valueTodayData == "conductivity"
              ? "sho'rlanish"
              : valueTodayData == "temp"
              ? "temperatura"
              : null
          } ma'lumotlari ${resultDate}.pdf`
        );
      }
    } else if (whichData == "search-between") {
      const doc = new jsPDF("l", "mm", [397, 210]);

      doc.text(
        `${role == 'USER' ? name : balanceOrgName} ning ${searchBetweenStartDate} dan ${searchBetweenEndDate} gacha oraliqdagi ${
          valueTodayData == "level"
            ? "sath"
            : valueTodayData == "conductivity"
            ? "sho'rlanish"
            : valueTodayData == "temp"
            ? "temperatura"
            : null
        } ma'lumotlari ${resultDate}`,
        20,
        10
      );

      doc.autoTable({
        html: "#table-style-search-id",
        margin: { right: 5, left: 5 },
        styles: { halign: "center" },
        theme: "striped",
        headStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
        bodyStyles: { lineWidth: 0.3, lineColor: [0, 0, 0] },
      });

      if (searchBetweenData.length > 0) {
        doc.save(
          `${role == 'USER' ? name : balanceOrgName} ning ${searchBetweenStartDate} dan ${searchBetweenEndDate} gacha oraliqdagi ${
            valueTodayData == "level"
              ? "sath"
              : valueTodayData == "conductivity"
              ? "sho'rlanish"
              : valueTodayData == "temp"
              ? "temperatura"
              : null
          } ma'lumotlari ${resultDate}.pdf`
        );
      }
    }
  };

  // ! SAVE DATA EXCEL
  const exportDataToExcel = () => {
    const fixedDate = new Date();

    const resultDate = `${fixedDate.getDate()}/${
      fixedDate.getMonth() + 1
    }/${fixedDate.getFullYear()} ${fixedDate.getHours()}:${
      String(fixedDate.getMinutes()).length == 1
        ? "0" + fixedDate.getMinutes()
        : fixedDate.getMinutes()
    }`;

    if (whichData == "hour") {
      const tableHour = document.getElementById("table-style-hour-id");

      const data = XLSX.utils.table_to_book(tableHour);

      if (todayData.length > 0) {
        XLSX.writeFile(
          data,
          `${role == 'USER' ? name : balanceOrgName} ning bugungi ${
            valueTodayData == "level"
              ? "sath"
              : valueTodayData == "volume"
              ? "hajm"
              : valueTodayData == "correction"
              ? "tuzatish"
              : null
          } ma'lumotlari ${resultDate}.xlsx`
        );
      }
    } else if (whichData == "daily") {
      const tableDaily = document.getElementById("table-style-daily-id");

      const data = XLSX.utils.table_to_book(tableDaily);

      if (dailyData.length > 0) {
        XLSX.writeFile(
          data,
          `${role == 'USER' ? name : balanceOrgName} ning kunlik ${
            valueTodayData == "level"
              ? "sath"
              : valueTodayData == "volume"
              ? "hajm"
              : valueTodayData == "correction"
              ? "tuzatish"
              : null
          } ma'lumotlari ${resultDate}.xlsx`
        );
      }
    } else if (whichData == "monthly") {
      const tableMonthly = document.getElementById("table-style-monthly-id");

      const data = XLSX.utils.table_to_book(tableMonthly);

      if (monthlyData.length > 0) {
        XLSX.writeFile(
          data,
          `${role == 'USER' ? name : balanceOrgName} ning oylik ${
            valueTodayData == "level"
              ? "sath"
              : valueTodayData == "volume"
              ? "hajm"
              : valueTodayData == "correction"
              ? "tuzatish"
              : null
          } ma'lumotlari ${resultDate}.xlsx`
        );
      }
    } else if (whichData == "yesterday") {
      const tableYesterday = document.getElementById(
        "table-style-yesterday-id"
      );

      const data = XLSX.utils.table_to_book(tableYesterday);

      if (yesterdayData.length > 0) {
        XLSX.writeFile(
          data,
          `${role == 'USER' ? name : balanceOrgName} ning kecha kelgan ${
            valueTodayData == "level"
              ? "sath"
              : valueTodayData == "volume"
              ? "hajm"
              : valueTodayData == "correction"
              ? "tuzatish"
              : null
          } ma'lumotlari ${resultDate}.xlsx`
        );
      }
    } else if (whichData == "search-between") {
      const tableSearchBetween = document.getElementById(
        "table-style-search-id"
      );

      const data = XLSX.utils.table_to_book(tableSearchBetween);

      if (searchBetweenData.length > 0) {
        XLSX.writeFile(
          data,
          `${role == 'USER' ? name : balanceOrgName} ning ${searchBetweenStartDate} dan ${searchBetweenEndDate} gacha oraliqdagi ${
            valueTodayData == "level"
              ? "sath"
              : valueTodayData == "volume"
              ? "hajm"
              : valueTodayData == "correction"
              ? "tuzatish"
              : null
          } ma'lumotlari ${resultDate}.xlsx`
        );
      }
    }
  };

  const checkStationWorkingOrNot = (value) => {
    const presentDate = new Date();
    let startDate = new Date(value?.date);
    startDate.setHours(startDate.getHours() - 5);

    if (value == undefined) {
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

  const searchLastDataWithInput = (inputValue) => {
    const search = lastDataMain.filter((e) =>
      e.name.toLowerCase().includes(inputValue)
    );
    if (search.length > 0) {
      setLastData(search);
    }
  };

  const foundNameMonthForMap = (month) => {
    const foundNameMonth = valueYear.find((e, i) => i + 1 == month);

    return foundNameMonth;
  };

  const handlePageChangeHour = (selectedPage) => {
    if (searchWithDaily) {
      setHourSearchBoolean(true);
      customFetch
        .get(
          `/yesterdayData/getAllDataByDay?page=${
            selectedPage.selected + 1
          }&perPage=10&day=${hourInputValue}`
        )
        .then((data) => {
          setTodayDataMain(data.data.data);
          setTodayData(data.data.data);
          setHourSearchBoolean(false);
        });
    } else {
      customFetch
        .get(
          `/mqttDataWrite/getAllTodayData?page=${
            selectedPage.selected + 1
          }&perPage=10`
        )
        .then((data) => {
          setTodayDataMain(data.data.data);
          setTodayData(data.data.data);
        });
    }
  };

  const handlePageChangeDaily = (selectedPage) => {
    setHourSearchBoolean(true);
    customFetch
      .get(
        `/dailyData/getAllStationsDataByMonth?page=${
          selectedPage.selected + 1
        }&perPage=10&month=${valueDailyDataTable}`
      )
      .then((data) => {
        setDailyDataMain(data.data.data);
        setDailyData(data.data.data);
        setHourSearchBoolean(false);
      });
  };

  const handlePageChangeMonthly = (selectedPage) => {
    customFetch
      .get(
        `/monthlyData/getAllStationDataByYear?page=${
          selectedPage.selected + 1
        }&perPage=10&year=${new Date().toISOString().substring(0, 4)}`
      )
      .then((data) => {
        setMonthlyDataMain(data.data.stations.data);
        setMonthlyData(data.data.stations.data);
      });
  };

  const handlePageChangeYesterday = (selectedPage) => {
    customFetch
      .get(
        `/yesterdayData/getAllYesterdayData?page=${
          selectedPage.selected + 1
        }&perPage=10`
      )
      .then((data) => {
        setYesterdayDataMain(data.data.data);
        setYesterdayData(data.data.data);
      });
  };

  return (
    <HelmetProvider>
      {/* MODAL */}
      <div
        className="modal fade"
        id="exampleModal"
        tabIndex="-1"
        data-bs-backdrop="static"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog table-location-width-user-data modal-dialog-centered">
          <div className="modal-content modal-content-user-data">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="exampleModalLabel">
                {balanceOrgName}
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body d-flex justify-content-between flex-wrap">
              <GoogleMap
                zoom={15}
                center={{
                  lat:
                    whichData == "hour"
                      ? todayDataStatistic.location?.split("-")[0] * 1
                      : whichData == "yesterday"
                      ? yesterdayDataStatistic.location?.split("-")[0] * 1
                      : whichData == "daily"
                      ? dailyDataStatistic.location?.split("-")[0] * 1
                      : whichData == "monthly"
                      ? monthlyDataStatistic.location?.split("-")[0] * 1
                      : 40.77408090036615,
                  lng:
                    whichData == "hour"
                      ? todayDataStatistic.location?.split("-")[1] * 1
                      : whichData == "yesterday"
                      ? yesterdayDataStatistic.location?.split("-")[1] * 1
                      : whichData == "daily"
                      ? dailyDataStatistic.location?.split("-")[1] * 1
                      : whichData == "monthly"
                      ? monthlyDataStatistic.location?.split("-")[1] * 1
                      : 72.5355339,
                }}
                mapContainerClassName="user-data-map"
              >
                <MarkerF
                  position={{
                    lat:
                      whichData == "hour"
                        ? todayDataStatistic.location?.split("-")[0] * 1
                        : whichData == "yesterday"
                        ? yesterdayDataStatistic.location?.split("-")[0] * 1
                        : whichData == "daily"
                        ? dailyDataStatistic.location?.split("-")[0] * 1
                        : whichData == "monthly"
                        ? monthlyDataStatistic.location?.split("-")[0] * 1
                        : 40.77408090036615,
                    lng:
                      whichData == "hour"
                        ? todayDataStatistic.location?.split("-")[1] * 1
                        : whichData == "yesterday"
                        ? yesterdayDataStatistic.location?.split("-")[1] * 1
                        : whichData == "daily"
                        ? dailyDataStatistic.location?.split("-")[1] * 1
                        : whichData == "monthly"
                        ? monthlyDataStatistic.location?.split("-")[1] * 1
                        : 72.5355339,
                  }}
                  title={
                    whichData == "hour"
                      ? todayDataStatistic.name
                      : whichData == "yesterday"
                      ? yesterdayDataStatistic.name
                      : whichData == "daily"
                      ? dailyDataStatistic.name
                      : whichData == "monthly"
                      ? monthlyDataStatistic.name
                      : null
                  }
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
                      {whichData == "hour" && !searchWithDaily ? (
                        todayDataStatistic.todayData?.length > 0 ? (
                          <div>
                            <h3 className="fw-semibold text-success fs-6">
                              {todayDataStatistic.name}
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
                                {Number(
                                  todayDataStatistic?.todayData[0]?.level
                                ).toFixed(2)}{" "}
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
                                  todayDataStatistic?.todayData[0]?.volume
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
                                {Number(
                                  todayDataStatistic?.todayData[0]?.correction
                                ).toFixed(2)}{" "}
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
                                {
                                  todayDataStatistic.todayData[0].date?.split(
                                    " "
                                  )[1]
                                }
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h3 className="fw-semibold text-success fs-6 text-center">
                              {todayDataStatistic.name}
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
                      ) : whichData == "hour" && searchWithDaily ? (
                        todayDataStatistic.allData?.length > 0 ? (
                          <div>
                            <h3 className="fw-semibold text-success fs-6">
                              {todayDataStatistic.name}
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
                                {Number(
                                  todayDataStatistic?.allData[0]?.level
                                ).toFixed(2)}{" "}
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
                              Hajm:
                              </p>{" "}
                              <span className="infowindow-span">
                                {Number(
                                  todayDataStatistic?.allData[0]?.volume
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
                                {Number(
                                  todayDataStatistic?.allData[0]?.correction
                                ).toFixed(2)}{" "}
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
                                {todayDataStatistic?.allData[0]?.date}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h3 className="fw-semibold text-success fs-6 text-center">
                              {todayDataStatistic.name}
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
                        monthlyDataStatistic.monthlyData?.length > 0 ? (
                          <div>
                            <h3 className="fw-semibold text-success fs-6">
                              {monthlyDataStatistic?.name}
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
                                {Number(
                                  monthlyDataStatistic?.monthlyData[0]?.level
                                ).toFixed(2)}{" "}
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
                                Sho'rlanish:
                              </p>{" "}
                              <span className="infowindow-span">
                                {Number(
                                  monthlyDataStatistic?.monthlyData[0]
                                    ?.conductivity
                                ).toFixed(2)}{" "}
                                g/l
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
                                Temperatura:
                              </p>{" "}
                              <span className="infowindow-span">
                                {Number(
                                  monthlyDataStatistic?.monthlyData[0]?.temp
                                ).toFixed(2)}{" "}
                                °C
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
                                {foundNameMonthForMap(
                                  monthlyDataStatistic?.monthlyData[0]
                                    ?.monthNumber
                                )}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h3 className="fw-semibold text-success fs-6 text-center">
                              {monthlyDataStatistic?.name}
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
                              {dailyDataStatistic.name}
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
                                {Number(
                                  dailyDataStatistic?.dailyData[0]?.level
                                ).toFixed(2)}{" "}
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
                                Sho'rlanish:
                              </p>{" "}
                              <span className="infowindow-span">
                                {Number(
                                  dailyDataStatistic?.dailyData[0]?.conductivity
                                ).toFixed(2)}{" "}
                                g/l
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
                                Temperatura:
                              </p>{" "}
                              <span className="infowindow-span">
                                {Number(
                                  dailyDataStatistic?.dailyData[0]?.temp
                                ).toFixed(2)}{" "}
                                °C
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
                                Kun:
                              </p>{" "}
                              <span className="infowindow-span">
                                {
                                  dailyDataStatistic?.dailyData[0]?.date.split(
                                    "-"
                                  )[2]
                                }
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h3 className="fw-semibold text-success fs-6 text-center">
                              {dailyDataStatistic.name}
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
                              {searchBetweenDataStatistic.name}
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
                                {Number(
                                  searchBetweenDataStatistic?.allData[0]?.level
                                ).toFixed(2)}{" "}
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
                                Sho'rlanish:
                              </p>{" "}
                              <span className="infowindow-span">
                                {Number(
                                  searchBetweenDataStatistic?.allData[0]
                                    ?.conductivity
                                ).toFixed(2)}{" "}
                                g/l
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
                                Temperatura:
                              </p>{" "}
                              <span className="infowindow-span">
                                {Number(
                                  searchBetweenDataStatistic?.allData[0]?.temp
                                ).toFixed(2)}{" "}
                                °C
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
                                Kun:
                              </p>{" "}
                              <span className="infowindow-span">
                                {
                                  searchBetweenDataStatistic?.allData[0]?.date.split(
                                    " "
                                  )[0]
                                }
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h3 className="fw-semibold text-success fs-6 text-center">
                              {dailyDataStatistic.name}
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
                        yesterdayDataStatistic.yesterdayData?.length > 0 ? (
                          <div>
                            <h3 className="fw-semibold text-success fs-6">
                              {yesterdayDataStatistic.name}
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
                                {Number(
                                  yesterdayDataStatistic?.yesterdayData[0]
                                    ?.level
                                ).toFixed(2)}{" "}
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
                                Sho'rlanish:
                              </p>{" "}
                              <span className="infowindow-span">
                                {Number(
                                  yesterdayDataStatistic?.yesterdayData[0]
                                    ?.conductivity
                                ).toFixed(2)}{" "}
                                g/l
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
                                Temperatura:
                              </p>{" "}
                              <span className="infowindow-span">
                                {Number(
                                  yesterdayDataStatistic?.yesterdayData[0]?.temp
                                ).toFixed(2)}{" "}
                                °C
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
                                {
                                  yesterdayDataStatistic?.yesterdayData[0]?.date.split(
                                    " "
                                  )[1]
                                }
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h3 className="fw-semibold text-success fs-6 text-center">
                              {yesterdayDataStatistic.name}
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

              <div className="modal-body pt-0">
                <div className="char-statistic-frame char-statistic-frame-height m-auto">
                  <Line
                    className="char-statistic-wrapper"
                    data={data}
                    options={option}
                  />
                </div>

                <select
                  onChange={(e) => setValueStatistic(e.target.value)}
                  className="form-select select-user-last-data select-user-last-data-width"
                >
                  <option value="level">Sathi (sm)</option>
                  <option value="volume">Hajm (m³/s)</option>
                  <option value="correction">Tuzatish</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="home-section py-3 ">
        <div className="container-fluid">
          <div className="card-user-data card--open">
            {lastData.length > 0 ? (
              <div className="card-body pt-3">
                <ul className="nav nav-tabs nav-tabs-bordered">
                  <li className="nav-item">
                    <button
                      className="nav-link active"
                      data-bs-toggle="tab"
                      data-bs-target="#profile-hour"
                      onClick={() => {
                        setWhichData("hour");
                        setValueTodayData("level");
                        setValueStatistic("level");
                        setSearchDate(false);
                        setSearchWithDaily(false);
                        setHourInputValue(
                          new Date().toISOString().substring(0, 10)
                        );
                      }}
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
                        setWhichData("yesterday");
                        setValueTodayData("level");
                        setValueStatistic("level");
                        setSearchDate(false);
                        setSearchWithDaily(false);
                        setHourInputValue(
                          new Date().toISOString().substring(0, 10)
                        );
                      }}
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
                        setWhichData("daily");
                        setValueTodayData("level");
                        setValueStatistic("level");
                        setSearchDate(false);
                        setSearchWithDaily(false);
                        setHourInputValue(
                          new Date().toISOString().substring(0, 10)
                        );
                      }}
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
                        setWhichData("monthly");
                        setValueTodayData("level");
                        setValueStatistic("level");
                        setSearchDate(false);
                        setSearchWithDaily(false);
                        setHourInputValue(
                          new Date().toISOString().substring(0, 10)
                        );
                      }}
                    >
                      Oylik
                    </button>
                  </li>
                </ul>

                <div className="tab-content d-flex justify-content-between flex-wrap mt-4">
                  {/* ! HOUR */}
                  <div
                    className="tab-pane tab-pane-hour fade show active profile-hour "
                    id="profile-hour"
                  >
                    <div className="containerr">
                      <div className="user-data-hour-wrapper">
                        <div className="d-flex justify-content-between align-items-center">
                          <input
                            className="form-control user-lastdata-news-search"
                            type="text"
                            placeholder="Search..."
                            onChange={(e) =>
                              searchTodayDataWithInput(
                                e.target.value.toLowerCase()
                              )
                            }
                          />
                          <div className="d-flex align-items-center ms-auto">
                            <input
                              type="date"
                              className="form-control"
                              id="dateMonth"
                              name="dateDaily"
                              required
                              defaultValue={new Date()
                                .toISOString()
                                .substring(0, 10)}
                              onChange={(e) => {
                                searchTodayDataWithDate(e.target.value);
                                setHourInputValue(e.target.value);
                                setSearchDate(true);
                              }}
                            />

                            <select
                              onChange={(e) =>
                                setValueTodayData(e.target.value)
                              }
                              className="form-select select-user-data-today ms-4"
                            >
                              <option value="level">Sathi (sm)</option>
                              <option value="volume">
                              Hajm (m³/s)
                              </option>
                              <option value="correction">Tuzatish</option>
                            </select>
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
                              <img
                                src={excel}
                                alt="excel"
                                width={26}
                                height={30}
                              />
                            </button>
                          </div>
                        </div>
                        <div className="tableFlexible mt-3">
                          <div className="tableFlexible-width">
                            {hourSearchBoolean ? (
                              <div className="d-flex align-items-center justify-content-center hour-spinner-wrapper">
                                <span className="loader"></span>
                              </div>
                            ) : (
                              <table
                                className="table-style"
                                id="table-style-hour-id"
                              >
                                <thead className="">
                                  <tr>
                                    <th rowSpan="2" className="sticky">
                                      T/R
                                    </th>
                                    <th
                                      rowSpan="2"
                                      className="sticky"
                                      style={{ left: "57px" }}
                                    >
                                      Stantsiya nomi
                                    </th>
                                    <th colSpan="24">{hourInputValue}</th>
                                  </tr>
                                  <tr>
                                    {valueTodayTable.map((r, l) => {
                                      return <th key={l}>{r}</th>;
                                    })}
                                  </tr>
                                </thead>
                                <tbody>
                                  {todayData?.map((e, i) => {
                                    return (
                                      <tr
                                        className="tr0"
                                        data-bs-toggle="modal"
                                        data-bs-target="#exampleModal"
                                        key={i}
                                        onClick={() => {
                                          setTodayDataStatistic(e);
                                        }}
                                      >
                                        <td className="sticky" style={{}}>
                                          {i + 1}
                                        </td>
                                        <td
                                          className="text-start sticky fix-with"
                                          style={{ left: "57px" }}
                                        >
                                          {e.name}
                                        </td>
                                        {valueTodayTable.map((d, w) => {
                                          const existedValue = !searchDate
                                            ? e.todayData?.find(
                                                (a) =>
                                                  a.date
                                                    .split(" ")[1]
                                                    .split(":")[0] == d
                                              )
                                            : e.allData?.find(
                                                (a) =>
                                                  a.date
                                                    .split(" ")[1]
                                                    .split(":")[0] == d
                                              );

                                          if (existedValue) {
                                            return (
                                              <td key={w}>
                                                {Number(
                                                  existedValue[valueTodayData]
                                                ).toFixed(2)}
                                              </td>
                                            );
                                          } else {
                                            return <td key={w}>-</td>;
                                          }
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                        <ReactPaginate
                          pageCount={totalPagesHour}
                          onPageChange={handlePageChangeHour}
                          forcePage={currentPage}
                          previousLabel={"<<"}
                          nextLabel={">>"}
                          activeClassName={"pagination__link--active"}
                        />
                      </div>
                    </div>
                  </div>

                  {/* YESTERDAY */}
                  <div
                    className="tab-pane tab-pane-hour fade profile-users-ten"
                    id="profile-users-ten"
                  >
                    <div className="containerr">
                      <div className="user-data-hour-wrapper">
                        <div className="d-flex justify-content-between align-items-center">
                          <input
                            className="form-control user-lastdata-news-search"
                            type="text"
                            placeholder="Search..."
                            onChange={(e) =>
                              searchTodayDataWithInput(
                                e.target.value.toLowerCase()
                              )
                            }
                          />
                          <div className="d-flex align-items-center ms-auto">
                            <select
                              onChange={(e) =>
                                setValueTodayData(e.target.value)
                              }
                              className="form-select select-user-data-today ms-4"
                            >
                              <option value="level">Sathi (sm)</option>
                              <option value="conductivity">
                                Sho'rlanish (g/l)
                              </option>
                              <option value="temp">Temperatura (°C)</option>
                            </select>
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
                              <img
                                src={excel}
                                alt="excel"
                                width={26}
                                height={30}
                              />
                            </button>
                          </div>
                        </div>
                        <div className="tableFlexible mt-3">
                          <div className="tableFlexible-width">
                            <table
                              className="table-style"
                              id="table-style-yesterday-id"
                            >
                              <thead className="">
                                <tr>
                                  <th rowSpan="2" className="sticky">
                                    T/R
                                  </th>
                                  <th
                                    rowSpan="2"
                                    className="sticky"
                                    style={{ left: "57px" }}
                                  >
                                    Stantsiya nomi
                                  </th>
                                  <th colSpan="24">
                                    {new Date().toISOString().substring(0, 10)}
                                  </th>
                                </tr>
                                <tr>
                                  {valueTodayTable.map((r, l) => {
                                    return <th key={l}>{r}</th>;
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {yesterdayData?.map((e, i) => {
                                  return (
                                    <tr
                                      className="tr0"
                                      data-bs-toggle="modal"
                                      data-bs-target="#exampleModal"
                                      key={i}
                                      onClick={() => {
                                        setYesterdayDataStatistic(e);
                                      }}
                                    >
                                      <td className="sticky" style={{}}>
                                        {i + 1}
                                      </td>
                                      <td
                                        className="text-start sticky fix-with"
                                        style={{ left: "57px" }}
                                      >
                                        {e.name}
                                      </td>
                                      {valueTodayTable.map((d, w) => {
                                        const existedValue =
                                          e.yesterdayData.find(
                                            (a) =>
                                              a.date
                                                .split(" ")[1]
                                                .split(":")[0] == d
                                          );

                                        if (existedValue) {
                                          return (
                                            <td key={w}>
                                              {Number(
                                                existedValue[valueTodayData]
                                              ).toFixed(2)}
                                            </td>
                                          );
                                        } else {
                                          return <td key={w}>-</td>;
                                        }
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <ReactPaginate
                          pageCount={totalPagesYesterday}
                          onPageChange={handlePageChangeYesterday}
                          forcePage={currentPage}
                          previousLabel={"<<"}
                          nextLabel={">>"}
                          activeClassName={"pagination__link--active"}
                        />
                      </div>
                    </div>
                  </div>

                  {/* DAILY */}
                  <div
                    className="tab-pane tab-pane-hour fade profile-users"
                    id="profile-users"
                  >
                    <div className="containerr">
                      <div className="user-data-hour-wrapper">
                        <div className="d-flex justify-content-between align-items-center">
                          <input
                            className="form-control user-lastdata-news-search"
                            type="text"
                            placeholder="Search..."
                            onChange={(e) =>
                              searchTodayDataWithInput(
                                e.target.value.toLowerCase()
                              )
                            }
                          />
                          <div className="d-flex align-items-center ms-auto">
                            <input
                              type="month"
                              className="form-control"
                              id="dateMonth"
                              name="dateDaily"
                              required
                              defaultValue={new Date()
                                .toISOString()
                                .substring(0, 7)}
                              onChange={(e) => {
                                searchDailyDataWithDate(e.target.value);
                                setValueDailyDataTable(e.target.value);
                              }}
                            />

                            <select
                              onChange={(e) =>
                                setValueTodayData(e.target.value)
                              }
                              className="form-select select-user-data-today ms-4"
                            >
                              <option value="level">Sathi (sm)</option>
                              <option value="conductivity">
                                Sho'rlanish (g/l)
                              </option>
                              <option value="temp">Temperatura (°C)</option>
                            </select>
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
                              <img
                                src={excel}
                                alt="excel"
                                width={26}
                                height={30}
                              />
                            </button>
                          </div>
                        </div>
                        <div className="tableFlexible mt-3">
                          <div className="tableFlexible-width">
                            {hourSearchBoolean ? (
                              <div className="d-flex align-items-center justify-content-center hour-spinner-wrapper">
                                <span className="loader"></span>
                              </div>
                            ) : (
                              <table
                                className="table-style"
                                id="table-style-daily-id"
                              >
                                <thead className="">
                                  <tr>
                                    <th rowSpan="2" className="sticky">
                                      T/R
                                    </th>
                                    <th
                                      rowSpan="2"
                                      className="sticky"
                                      style={{ left: "57px" }}
                                    >
                                      Stantsiya nomi
                                    </th>
                                    <th colSpan={lastDateOfMonth}>
                                      {valueDailyDataTable}
                                    </th>
                                  </tr>
                                  <tr>
                                    {valueMonth.map((r, l) => {
                                      return <th key={l}>{r}</th>;
                                    })}
                                  </tr>
                                </thead>
                                <tbody>
                                  {dailyData?.map((e, i) => {
                                    return (
                                      <tr
                                        className="tr0"
                                        data-bs-toggle="modal"
                                        data-bs-target="#exampleModal"
                                        key={i}
                                        onClick={() => {
                                          setDailyDataStatistic(e);
                                        }}
                                      >
                                        <td className="sticky" style={{}}>
                                          {i + 1}
                                        </td>
                                        <td
                                          className="text-start sticky fix-with"
                                          style={{ left: "57px" }}
                                        >
                                          {e.name}
                                        </td>
                                        {valueMonth.map((d, w) => {
                                          const existedValue = e.dailyData.find(
                                            (a) => a.date.split("-")[2] == d
                                          );

                                          if (existedValue) {
                                            return (
                                              <td key={w}>
                                                {Number(
                                                  existedValue[valueTodayData]
                                                ).toFixed(2)}
                                              </td>
                                            );
                                          } else {
                                            return <td key={w}>-</td>;
                                          }
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                        <ReactPaginate
                          pageCount={totalPagesDaily}
                          onPageChange={handlePageChangeDaily}
                          forcePage={currentPage}
                          previousLabel={"<<"}
                          nextLabel={">>"}
                          activeClassName={"pagination__link--active"}
                        />
                      </div>
                    </div>
                  </div>

                  {/* MONTHLY */}
                  <div
                    className="tab-pane tab-pane-hour fade profile-overview"
                    id="profile-overview"
                  >
                    <div className="containerr">
                      <div className="user-data-hour-wrapper">
                        <div className="d-flex justify-content-between align-items-center">
                          <input
                            className="form-control user-lastdata-news-search"
                            type="text"
                            placeholder="Search..."
                            onChange={(e) =>
                              searchTodayDataWithInput(
                                e.target.value.toLowerCase()
                              )
                            }
                          />
                          <div className="d-flex align-items-center ms-auto">
                            <select
                              onChange={(e) =>
                                setValueTodayData(e.target.value)
                              }
                              className="form-select select-user-data-today ms-4"
                            >
                              <option value="level">Sathi (sm)</option>
                              <option value="conductivity">
                                Sho'rlanish (g/l)
                              </option>
                              <option value="temp">Temperatura (°C)</option>
                            </select>
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
                              <img
                                src={excel}
                                alt="excel"
                                width={26}
                                height={30}
                              />
                            </button>
                          </div>
                        </div>
                        <div className="tableFlexible mt-3">
                          <div className="tableFlexible-width">
                            <table
                              className="table-style"
                              id="table-style-monthly-id"
                            >
                              <thead className="">
                                <tr>
                                  <th rowSpan="2" className="sticky">
                                    T/R
                                  </th>
                                  <th
                                    rowSpan="2"
                                    className="sticky"
                                    style={{ left: "57px" }}
                                  >
                                    Stantsiya nomi
                                  </th>
                                  <th colSpan={12}>
                                    {new Date().toISOString().substring(0, 4)}
                                  </th>
                                </tr>
                                <tr>
                                  {valueYear.map((r, l) => {
                                    return <th key={l}>{r}</th>;
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {monthlyData?.map((e, i) => {
                                  return (
                                    <tr
                                      className="tr0"
                                      data-bs-toggle="modal"
                                      data-bs-target="#exampleModal"
                                      key={i}
                                      onClick={() => {
                                        setMonthlyDataStatistic(e);
                                      }}
                                    >
                                      <td className="sticky">{i + 1}</td>
                                      <td
                                        className="text-start sticky fix-with"
                                        style={{ left: "57px" }}
                                      >
                                        {e.name}
                                      </td>
                                      {valueYear.map((d, w) => {
                                        const existedValue = e.monthlyData.find(
                                          (a) => a.monthNumber == w + 1
                                        );

                                        if (existedValue) {
                                          return (
                                            <td key={w}>
                                              {Number(
                                                existedValue[valueTodayData]
                                              ).toFixed(2)}
                                            </td>
                                          );
                                        } else {
                                          return <td key={w}>-</td>;
                                        }
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <ReactPaginate
                          pageCount={totalPagesMonthly}
                          onPageChange={handlePageChangeMonthly}
                          forcePage={currentPage}
                          previousLabel={"<<"}
                          nextLabel={">>"}
                          activeClassName={"pagination__link--active"}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div>
                      <div className="smartwell-search-user-data d-flex align-items-center flex-wrap">
                        <input
                          id="bbr"
                          type="input"
                          placeholder="Kuzatuv stansiyasi..."
                          className="form-control search-user-data-input-observe"
                          onChange={(e) =>
                            searchLastDataWithInput(e.target.value)
                          }
                        />
                        <span className="ms-3 me-3 text-danger">
                          Soni: {lastDataLength} ta
                        </span>
                        <label htmlFor="bbr">
                          <span
                            role="img"
                            aria-label="search"
                            className="anticon anticon-search"
                            style={{ color: "rgb(110, 139, 245)" }}
                          >
                            <svg
                              viewBox="64 64 896 896"
                              focusable="false"
                              data-icon="search"
                              width="1em"
                              height="1em"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"></path>
                            </svg>
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="user-data-right">
                      <ul className="list-group list-unstyled m-0 mt-3">
                        {lastData?.map((e, i) => {
                          return (
                            <li
                              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                              key={i}
                            >
                              <div className="d-flex align-items-center">
                                <img
                                  src={
                                    checkStationWorkingOrNot(e.lastData) == 0
                                      ? locationGreen
                                      : checkStationWorkingOrNot(e.lastData) <=
                                        3
                                      ? locationYellow
                                      : checkStationWorkingOrNot(e.lastData) ==
                                        404
                                      ? locationRed
                                      : locationOrange
                                  }
                                  alt="location"
                                  width={23}
                                  height={20}
                                />

                                <p className="m-0 ms-2 fs-6">{e.name}</p>
                              </div>

                              <p className="m-0 text-danger">
                                {e.lastData?.level}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
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
        <Helmet>
          <script src="../../src/assets/js/Admin.js"></script>
        </Helmet>
      </section>
    </HelmetProvider>
  );
};

export default UserData;