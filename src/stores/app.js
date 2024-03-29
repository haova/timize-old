import { defineStore } from 'pinia';
import { clone, equals } from 'ramda';
import { reactive, ref } from 'vue';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { API_EMAIL, API_PASSWORD, API_TOKEN } from '../constants';
import { useNoticeStore } from './notice';
// import { Secure } from '@rugo-vn/shared';
import moment from 'moment';

const validateStatus = (status) => status >= 200 && status < 500;

export const useAppStore = defineStore('app', () => {
  const notice = useNoticeStore();

  const events = reactive([]);
  const appToken = ref(localStorage.getItem(API_TOKEN) || '');
  const appPassword = ref(localStorage.getItem(API_PASSWORD) || '');

  if (!appPassword.value) appToken.value = '';

  const user = reactive({
    email: localStorage.getItem(API_EMAIL),
    password: localStorage.getItem(API_PASSWORD),
  });

  const view = ref('');

  // methods
  const createHttp = () =>
    axios.create({
      baseURL: import.meta.env.TIMIZE_API,
      validateStatus,
      headers: {
        ...(appToken.value
          ? { authorization: `Bearer ${appToken.value}` }
          : {}),
      },
    });

  const clearToken = () => {
    localStorage.removeItem(API_TOKEN);
    localStorage.removeItem(API_PASSWORD);
    appToken.value = '';
    appPassword.value = '';
  };

  const getUserInfo = async () => {
    const http = createHttp();
    const res = await http.get('/api/info');
    const { user } = handleResponse(res);
    return user;
  };

  const handleResponse = (res) => {
    if (res.status === 403) {
      clearToken();
    }

    if (res.data?.error?.title) {
      notice.push(
        'danger',
        res.data?.error?.title ||
          'Error occurs, please check console to more information',
        res.data?.error?.detail
      );
      throw new Error(res.data);
    }

    return res.data;
  };

  const encrypt = (data) => {
    return CryptoJS.AES.encrypt(
      JSON.stringify(data),
      appPassword.value
    ).toString();
  };

  const decrypt = (text) => {
    try {
      return JSON.parse(
        CryptoJS.AES.decrypt(text, appPassword.value).toString(
          CryptoJS.enc.Utf8
        )
      );
    } catch (err) {
      notice.push(
        'danger',
        'Invalid password',
        'Please re-login to get decrypt password'
      );
      clearToken();
    }
  };

  const serialize = (tzEvent) => ({
    id: tzEvent.id || null,
    user: tzEvent.user,
    from: tzEvent.from,
    to: tzEvent.to,
    duration: moment(tzEvent.to).toDate() - moment(tzEvent.from).toDate(),
    content: tzEvent.content || undefined,
    data: {
      cipher: encrypt({
        title: tzEvent.title,
        color: tzEvent.color,
        note: tzEvent.note,
        done: tzEvent.done,
        important: tzEvent.important,
      }),
      key: tzEvent.key,
    },
  });

  const deserialize = (rawTzEvent) => {
    const data = decrypt(rawTzEvent.data.cipher);
    return {
      id: rawTzEvent.id,
      from: rawTzEvent.from,
      to: rawTzEvent.to,
      duration:
        rawTzEvent.duration ||
        moment(rawTzEvent.to).toDate() - moment(rawTzEvent.from).toDate(),
      title: data.title,
      note: data.note,
      color: data.color,
      done: data.done,
      content: rawTzEvent.content,
      important: data.important,
    };
  };

  const save = async (tzEvent, isDelete = false) => {
    const http = createHttp();
    const userInfo = await getUserInfo();

    const item = serialize({
      ...tzEvent,
      user: userInfo.id,
      key: userInfo.credentials[0].key,
    });

    let res;

    if (!tzEvent.id) {
      tzEvent = {
        data: tzEvent,
      };

      res = await http.post(`/api/tables/notes`, item);
    } else if (isDelete) {
      res = await http.delete(`/api/tables/notes/${tzEvent.id}`);
    } else {
      res = await http.patch(`/api/tables/notes/${tzEvent.id}`, {
        set: item,
      });
    }

    const rawTzEvent = handleResponse(res);

    if (!tzEvent.id) events.push(deserialize(rawTzEvent));
  };

  const addEvent = async (payload) => {
    const now = new Date().toISOString();
    const tzEvent = {
      ...payload,
      createdAt: now,
      updatedAt: now,
    };

    if (!(await save(tzEvent))) return false;

    notice.push(
      'success',
      'Success',
      `The event "${payload.title}" was added!`
    );
  };

  const updateEvent = async (payload) => {
    let isChanged = false;
    let updatedTzEvent = null;

    for (const event of events) {
      if (payload.id === event.id) {
        const prevEvent = clone(event);
        delete payload.id;
        delete payload.createdAt;
        for (let key in payload) event[key] = payload[key];
        if (!equals(prevEvent, event)) {
          isChanged = true;
          event.updatedAt = new Date().toISOString();
          updatedTzEvent = event;
        }
        break;
      }
    }

    if (!isChanged) return false;

    await save(updatedTzEvent);

    notice.push(
      'success',
      'Success',
      `The event "${payload.title}" was updated!`
    );

    return true;
  };

  const forceUpdateEvent = async (id, payload) => {
    const updatedTzEvent = clone(payload);
    updatedTzEvent.id = id;

    await save(updatedTzEvent);

    notice.push(
      'success',
      'Success',
      `The event "${payload.title}" was updated!`
    );

    return true;
  };

  const deleteEvent = async (payload) => {
    let deletedTzEvent;

    for (let i = 0; i < events.length; i++) {
      if (events[i].id === payload.id) {
        deletedTzEvent = events.splice(i, 1)[0];
        break;
      }
    }

    await save(deletedTzEvent, true);

    notice.push(
      'success',
      'Success',
      `The event "${payload.title}" was deleted!`
    );
  };

  const login = async ({ email, password }) => {
    const http = createHttp();

    const res = await http.post('/api/login', {
      email,
      password,
    });

    const { token: nextToken } = handleResponse(res);

    localStorage.setItem(API_TOKEN, nextToken);
    localStorage.setItem(API_EMAIL, email);
    localStorage.setItem(API_PASSWORD, password);

    appToken.value = nextToken;
    appPassword.value = password;

    notice.push('success', `Sign in successful`, '');
  };

  const loadEvents = async (currentDate, isDone = null) => {
    const http = createHttp();
    const userInfo = await getUserInfo();

    const fromRange = moment(currentDate).add(-32, 'day').toDate();
    const toRange = moment(currentDate).add(32, 'day').toDate();

    let res = await http.get(
      `/api/tables/notes?filters[user]=${
        userInfo.id
      }&filters[from][$gte]=${fromRange.toISOString()}&filters[from][$lte]=${toRange.toISOString()}&limit=-1`
    );

    let { data } = handleResponse(res);

    if (typeof isDone === 'boolean') {
      res = await http.get(
        `/api/tables/notes?filters[user]=${userInfo.id}&filters[done]=${isDone}&limit=-1`
      );

      data = [...data, ...handleResponse(res).data];
    }

    const nextEvents = data.map(deserialize);

    while (events.length) events.shift();
    for (const tzEvent of nextEvents) events.push(tzEvent);
  };

  const loadEventsByContent = async (id) => {
    const http = createHttp();
    const userInfo = await getUserInfo();

    const res = await http.get(
      `/api/tables/notes?filters[user]=${userInfo.id}&filters[content]=${id}&limit=-1`
    );

    const { data } = handleResponse(res);
    return data.map(deserialize);
  };

  const loadLongTermEvents = async (duration) => {
    const http = createHttp();
    const userInfo = await getUserInfo();

    let res = await http.get(
      `/api/tables/notes?filters[user]=${userInfo.id}&filters[duration][$gte]=${duration}&limit=-1`
    );

    let { data } = handleResponse(res);
    return data.map(deserialize);
  };

  const getEvent = async (id) => {
    const http = createHttp();
    const userInfo = await getUserInfo();

    const res = await http.get(
      `/api/tables/notes/${id}?filters[user]=${userInfo.id}`
    );

    const item = handleResponse(res);
    return deserialize(item);
  };

  const createContent = async (name) => {
    const http = createHttp();
    const userInfo = await getUserInfo();

    await http.post(`/api/tables/contents`, {
      name,
      user: userInfo.id,
    });

    notice.push('success', `Create successful`, '');
  };

  const loadContents = async () => {
    const http = createHttp();
    const userInfo = await getUserInfo();

    const res = await http.get(
      `/api/tables/contents?filters[user]=${userInfo.id}&limit=-1`
    );

    const { data } = handleResponse(res);

    return data.sort((a, b) => a.name.localeCompare(b.name));
  };

  const getContent = async (id) => {
    const http = createHttp();
    const userInfo = await getUserInfo();

    const res = await http.get(
      `/api/tables/contents/${id}?filters[user]=${userInfo.id}`
    );

    return handleResponse(res);
  };

  const updateContent = async (id, set) => {
    const http = createHttp();

    await http.patch(`/api/tables/contents/${id}`, {
      set,
    });

    notice.push('success', `Update successful`, '');
  };

  const searchContent = async (text) => {
    const http = createHttp();
    const userInfo = await getUserInfo();

    const res = await http.get(
      `/api/tables/contents?filters[user]=${userInfo.id}&filters[name][$regex]=.*${text}.*&filters[name][$options]=i&limit=5`
    );

    const { data } = handleResponse(res);

    return data.sort((a, b) => a.name.localeCompare(b.name));
  };

  return {
    token: appToken,
    view,
    notice,
    events,
    user,
    addEvent,
    updateEvent,
    forceUpdateEvent,
    deleteEvent,
    login,
    loadEvents,
    loadEventsByContent,
    loadLongTermEvents,
    getEvent,
    createContent,
    loadContents,
    updateContent,
    searchContent,
    getContent,
  };
});
