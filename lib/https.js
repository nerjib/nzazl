import axios from 'axios';


// const baseUrl  = 'https://myappapi-0be985206ca4.herokuapp.com';
const baseUrl  = 'http://localhost:5000';

const authUrl = `${baseUrl}/auth-service`; // http://157.245.84.14:1000

export const customBaseUrl = {
    baseUrl,
}

export const httpPost = async (url, postBody, otherUrl, pin, isNotAuth) => {
    // if (!navigator.onLine) {
    //   return NotificationManager.error(
    //     'Please check your internet',
    //     'Oops!',
    //     3000
    //   );
    // }
    try {
      const res = await axios.post(
        `${otherUrl || baseUrl}${url}`,
        postBody,
        !isNotAuth
          ? {
              headers: {
                Authorization: `${localStorage.token}`,
                'content-type': 'application/json',
                PIN: pin ?? '',
                'CLIENT-ID': CLIENT_ID,
                'CLIENT-TYPE': CLIENT_TYPE,
              },
            }
          : {
              headers: {
                'content-type': 'application/json',
                PIN: pin ?? '',
                'CLIENT-ID': CLIENT_ID,
                'CLIENT-TYPE': CLIENT_TYPE,
              },
            }
      );
      return res.data;
    } catch (error) {
      // hideLoader();
      if (error?.response?.data.error === 'Internal Server Error') {
        return {
          status: false,
          message: error.response.data.error,
        };
      }
      if (error?.response?.data.message === 'Validation Errors') {
        // Object.values(error.response.data.data).map((item) =>
        //   NotificationManager.error(item, 'Oops!', 5000)
        // );
        return {
          status: false,
          message: error.response?.data.data[0],
        };
      }
      return error.response?.data;
    }
  };
  
  export const httpPostBlob = async (url, postBody, otherUrl, pin, isNotAuth) => {
    if (!navigator.onLine) {
    //   return NotificationManager.error(
    //     'Please check your internet',
    //     'Oops!',
    //     3000
    //   );
    }
    try {
      const res = await axios.post(
        `${otherUrl || baseUrl}${url}`,
        postBody,
        !isNotAuth
          ? {
              responseType: 'blob',
              headers: {
                Authorization: `${localStorage.token}`,
                'Content-Type': 'application/json',
                PIN: pin ?? '',
                'CLIENT-ID': CLIENT_ID,
                'CLIENT-TYPE': CLIENT_TYPE,
              },
            }
          : {}
      );
      return res.data;
    } catch (error) {
      // hideLoader();
      return error.response;
    }
  };
  
  export const httpPostUnreloaded = async (
    url,
    postBody,
    otherUrl,
    isNotAuth
  ) => {
    if (!navigator.onLine) {
    //   return NotificationManager.error(
    //     'Please check your internet',
    //     'Oops!',
    //     3000
    //   );
    }
    try {
      const res = await axios.post(
        `${otherUrl || baseUrl}${url}`,
        postBody,
        !isNotAuth
          ? {
              headers: {
                Authorization: `${localStorage.token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'CLIENT-ID': CLIENT_ID,
                'CLIENT-TYPE': CLIENT_TYPE,
              },
            }
          : {}
      );
      // console.log(res);
      return res.data;
    } catch (error) {
      // hideLoader();
      return error.response?.data;
    }
  };
  
  export const httpPostFormData = async (url, postBody, otherUrl, isNotAuth) => {
    if (!navigator.onLine) {
    //   return NotificationManager.error(
    //     'Please check your internet',
    //     'Oops!',
    //     3000
    //   );
    }
    try {
      const res = await axios.post(
        `${otherUrl || baseUrl}${url}`,
        postBody,
        !isNotAuth
          ? {
              headers: {
                Authorization: `${localStorage.token}`,
                'Content-Type': 'multipart/form-data',
                'CLIENT-ID': CLIENT_ID,
                'CLIENT-TYPE': CLIENT_TYPE,
              },
            }
          : {}
      );
      // console.log(res);
      return res.data;
    } catch (error) {
      // hideLoader();
      return error.response?.data;
    }
  };
  
  export const httpGet = async (core, url, otherUrl, isNotAuth) => {
    if (!core) return '';
    if (!navigator.onLine) {
    //   return NotificationManager.error(
    //     'Please check your internet',
    //     'Oops!',
    //     3000
    //   );
    }
    try {
      const res = await axios.get(
        url,
        !isNotAuth
          ? {
              headers: {
                Authorization: `${localStorage.token}`,
                'CLIENT-ID': CLIENT_ID,
                'CLIENT-TYPE': CLIENT_TYPE,
              },
            }
          : {
              headers: {
                Authorization: `${localStorage.token}`,
                'CLIENT-ID': CLIENT_ID,
                'CLIENT-TYPE': CLIENT_TYPE,
              },
            }
      );
      // console.log(res);
      return res.data;
    } catch (error) {
      // hideLoader();
      if (error?.response?.data?.message === 'Validation Errors') {
        Object.values(error?.response?.data?.data).map((item) =>
          swal('Oops!', item, 'error')
        );
        return {
          status: false,
          message: error?.response?.data.data[0],
        };
      }
      return error?.response?.data;
    }
  };
  export const httpGetPdf = async (url, otherUrl, isNotAuth) => {
    if (!navigator.onLine) {
    //   return NotificationManager.error(
    //     'Please check your internet',
    //     'Oops!',
    //     3000
    //   );
    }
    try {
      const res = await axios.get(
        url,
        !isNotAuth
          ? {
              responseType: 'blob',
              headers: {
                Authorization: `${localStorage.token}`,
                'Content-Type': 'application/pdf',
                'CLIENT-ID': CLIENT_ID,
                'CLIENT-TYPE': CLIENT_TYPE,
              },
            }
          : {}
      );
      // console.log(res);
      return res.data;
    } catch (error) {
      // hideLoader();
      if (error?.response?.data?.message === 'Validation Errors') {
        Object.values(error?.response?.data?.data).map((item) =>
          swal('Oops!', item, 'error')
        );
        return error?.response?.data;
      }
      return error?.response?.data;
    }
  };
  export const httpPut = async (url, postBody, otherUrl, pin, isNotAuth) => {
    if (!navigator.onLine) {
    //   return NotificationManager.error(
    //     'Please check your internet',
    //     'Oops!',
    //     3000
    //   );
    }
    try {
      const res = await axios.put(
        `${otherUrl || baseUrl}${url}`,
        postBody,
        !isNotAuth
          ? {
              headers: {
                Authorization: `${localStorage.token}`,
                'content-type': 'application/json',
                PIN: pin ?? null,
                'CLIENT-ID': CLIENT_ID,
                'CLIENT-TYPE': CLIENT_TYPE,
              },
            }
          : {}
      );
      // console.log(res);
      return res.data;
    } catch (error) {
      // hideLoader();
      if (error.response.data.message === 'Validation Errors') {
        return {
          status: false,
          message: error.response?.data.data[0],
        };
      }
      return error.response?.data;
    }
  };
  
  export const httpPatch = async (url, postBody, otherUrl, isNotAuth) => {
    if (!navigator.onLine) {
    //   return NotificationManager.error(
    //     'Please check your internet',
    //     'Oops!',
    //     3000
    //   );
    }
    try {
      const res = await axios.patch(
        `${otherUrl || baseUrl}${url}`,
        postBody,
        !isNotAuth
          ? {
              headers: {
                Authorization: `${localStorage.token}`,
                'CLIENT-ID': CLIENT_ID,
                'CLIENT-TYPE': CLIENT_TYPE,
              },
            }
          : {}
      );
      return res.data;
    } catch (error) {
      return error.response?.data;
    }
  };
  
  export const httpDelete = async (url, data, otherUrl, isNotAuth) => {
    if (!navigator.onLine) {
    //   return NotificationManager.error(
    //     'Please check your internet',
    //     'Oops!',
    //     3000
    //   );
    }
    try {
      const res = await axios.delete(
        `${otherUrl || baseUrl}${url}`,
        !isNotAuth
          ? {
              headers: {
                Authorization: `${localStorage.token}`,
                'CLIENT-ID': CLIENT_ID,
                'CLIENT-TYPE': CLIENT_TYPE,
              },
              data,
            }
          : {}
      );
      // console.log(res);
      return res.data;
    } catch (error) {
      // hideLoader();
      return error.response?.data;
    }
  };
  