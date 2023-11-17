/* eslint-disable */
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import OBSWebSocket from "obs-websocket-js";
import { io } from "socket.io-client";
// import jwt from 'jsonwebtoken';

//LAYOUTS FOLDER
import BetHistory from "../layout/BetHistory";

//SERVICES API FOLDER
import TopUpModal from "../layout/TopUpModal";
import DesktopResponsive2 from "../layout/DesktopResponsive2";
import MobileResponsive2 from "../layout/MobileResponsive2";

//CONTEXT
import { ModalProvider } from "../context/AddCreditsModalContext";
import { LiveStreamProvider } from "../context/LiveStreamContext";

const LiveGameStreamPage = ({ userToken }) => {
  const [isOpen, setIsOpen] = useState(false); //modal state*
  const [userId, setUserId] = useState(""); //user id state*
  const [rows, setRows] = useState([]);
  const [totalCredits, setTotalCredits] = useState(0); //total credits amount*
  const [currentProgramScene, setCurrentProgramScene] = useState(); //*
  const [confetti, setConfetti] = useState(false);
  const [betStatus, setBetStatus] = useState("");

  const obsAddress = "ws://127.0.0.1:4455";
  const obs = new OBSWebSocket();

  //USER LOGIN CREDENTIAL
  useEffect(() => {
    const baseUrl = process.env.REACT_APP_BACKEND_URL;
    const headers = {
      Authorization: `Bearer ${userToken}`,
    };
    axios
      .get(`${baseUrl}/user/check/session`, { headers })
      .then((response) => {
        if (response.status === 200) {
          setUserId(response.data.userSessionDets.user_id);
        } else {
          console.log("User session is not active.");
        }
      })
      .catch((error) => {
        console.error("Error checking user session:", error);
        console.log("Error checking user session.");
      });
  }, []);

  // FETCH SOCKETS
  useEffect(() => {
    // console.log('userId changed:', userId);
    const baseUrl = process.env.REACT_APP_BACKEND_URL;
    const socket = io(baseUrl, { query: { userId } });

    socket.on("connect", () => {
      console.log("Socket connected!");
    });

    socket.on("walletUpdate", (data) => {
      console.log("Received wallet update:", data.balance);
      setConfetti(false);
      setTotalCredits(data.balance);
    });

    socket.on("walletUpdateWin", (data) => {
      console.log("UpdatedWalletBalance:", data.balance);
      setTimeout(() => {
        setTotalCredits(data.balance);
      }, 3000);
      setConfetti(true);
    });

    socket.on("bettingStatusUpdate", (data) => {
      console.log("Betting Status:", data.status);
      setBetStatus(data.status); //set the bet status to 'Closed'
    });

    socket.on("bettingHistoryUpdate", (data) =>{
      console.log(data.combinedDetails)
      setRows(data.combinedDetails)

    })



    return () => {
      socket.disconnect();
    };
  }, [userId]);

  //INITIALIZE OBS CONNECTION
  useEffect(() => {
    (async () => {
      try {
        //OBS websocket connection
        await obs.connect(obsAddress);
        console.log(`Connected to OBS`);

        //Scene change listener
        obs.on("CurrentProgramSceneChanged", onCurrentSceneChanged);
      } catch (error) {
        console.error("Failed to connect", error.code, error.message);
      }
    })();
  }, []);

  return (
    <div className="h-auto flex flex-col gap-10 items-center border-2 border-green-600 ">
      <ModalProvider
        userToken={userToken}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      >
        <TopUpModal />
      </ModalProvider>

      <LiveStreamProvider
        userToken={userToken}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        totalCredits={totalCredits}
      >
        {/* <div className="w-full h-full lg:w-[70%] lg:h-[720px] 2xl:h-[963px] flex flex-col gap-10 border-2 border-red-600 ">
          <div className="hidden lg:flex flex-col h-full justify-between border-4 border-blue-600">
            <DesktopResponsive confetti={confetti} />
          </div>
          <MobileResponsive />
        </div>
        <div className="w-full lg:w-[70%]">
          <BetHistory userToken={userToken} />
        </div> */}
        {/* <div className="h-[100vh] w-full border-2 border-blue-600">
          <DesktopResponsive2 />
        </div> */}

        {/* <Desktop userToken={userToken} confetti={confetti} />
        <Mobile userToken={userToken} /> */}

        <div className="hidden max-h-[150vh] w-[80%] lg:flex flex-col gap-10 border-2 border-blue-600">
          <DesktopResponsive2 confetti={confetti} betStatus={betStatus} />
          <BetHistory userToken={userToken} rows={rows}/>
        </div>
        <div className="lg:hidden flex flex-col gap-10  h-auto w-full">
          <MobileResponsive2 />
          <BetHistory userToken={userToken} rows={rows} />
        </div>
      </LiveStreamProvider>
    </div>
  );
};

export default LiveGameStreamPage;
