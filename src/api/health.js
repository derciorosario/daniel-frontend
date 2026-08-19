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
