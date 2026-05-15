import axios from "axios";

//Base backend URL
const API = axios.create({
     baseURL: "http://localhost:3001",
});

//Spelling correct API
export const correctSpelling = async (word: string) => {
    const res = await API.post("/api/correct-spelling", { word });
  return res.data;
};

//Forecast API (protected, requires Firebase token)
export const forecast = async (token: string, query: string) => {
  const res = await API.post(
    "/api/forecast",
    { query },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
};