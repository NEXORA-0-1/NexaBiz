import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000', // your NestJS server
});

export default API;
