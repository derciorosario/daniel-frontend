import client from "./client";

export const getHealthReadings = (params = {}) => {
  return client.get("/health/readings", { params });
};

export const createHealthReading = (data) => {
  return client.post("/health/readings", data);
};

export const getPatients = () => {
  return client.get("/patients");
};

export const getPatient = (id) => {
  return client.get(`/patients/${id}`);
};

export const getUsers = () => {
  return client.get("/users");
};

export const getUser = (id) => {
  return client.get(`/users/${id}`);
};

export const updateUser = (id, data) => {
  return client.put(`/users/${id}`, data);
};

export const updateUserPhone = (phone) => {
  return client.put('/auth/phone', { phone });
};

export const deleteUser = (id) => {
  return client.delete(`/users/${id}`);
};
