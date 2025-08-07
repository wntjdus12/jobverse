import axios from "axios";

const api = axios.create({
  baseURL: '/api',
  headers: {
    "Content-Type": "application/json",
    authorization: "Bearer " + sessionStorage.getItem("token"),
  },
});
/**
 * 요청 
 */
api.interceptors.request.use(
  (request) => {
    console.log("Starting Request", request);
    return request;
  },
  function (error) {
    console.log("REQUEST ERROR", error);
  }
);

/**
 * 응답 
 */
api.interceptors.response.use(
  (response) => {
    console.log("Response:", response);
    return response;
  },
  function (error) {
    error = error.response.data;
    console.log("RESPONSE ERROR", error);
    return Promise.reject(error);
  }
);

export default api;
