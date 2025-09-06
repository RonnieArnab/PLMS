import axios from "axios";
import Cookies from "js-cookie";
import { API_ROUTES } from "../config/apiRoutes";

const api = axios.create({
  baseURL: API_ROUTES.base,
  withCredentials: true,
});

let onLogout = () => {};
export const setOnLogout = (fn) => (onLogout = fn || (() => {}));

api.interceptors.request.use((config) => {
  const token = Cookies.get("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let refreshPromise = null;
const subscribers = [];
const subscribe = (cb) => subscribers.push(cb);
const notifyAll = () => {
  subscribers.forEach((cb) => cb());
  subscribers.length = 0;
};

const isAuthRoute = (url = "") =>
  url.includes("/auth/login") ||
  url.includes("/auth/logout") ||
  url.includes("/auth/refresh");

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (!response) return Promise.reject(error);

    if (response.status === 401 && !config._retry && !isAuthRoute(config.url)) {
      config._retry = true;

      try {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = api
            .post(API_ROUTES.auth.refresh)
            .then((r) => {
              const access = r.data?.accessToken;
              if (access)
                Cookies.set("accessToken", access, { sameSite: "strict" });
              notifyAll();
            })
            .catch((e) => {
              Cookies.remove("accessToken");
              onLogout();
              throw e;
            })
            .finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
        }
        return new Promise((resolve, reject) => {
          subscribe(async () => {
            try {
              resolve(api(config));
            } catch (e) {
              reject(e);
            }
          });
          refreshPromise?.catch(reject);
        });
      } catch (e) {
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
