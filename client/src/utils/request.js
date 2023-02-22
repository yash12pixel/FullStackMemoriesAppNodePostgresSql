import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-type": "application/json",
    Authorization: ` Bearer ${localStorage.getItem("token")}`,
  },
});

export const apiClientPost = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-type": "application/json",
    Authorization: ` Bearer ${localStorage.getItem("token")}`,
  },
});
