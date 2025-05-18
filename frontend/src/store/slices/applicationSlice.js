import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const applicationSlice = createSlice({
  name: "applications",
  initialState: {
    applications: [],
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    requestForAllApplications(state) {
      state.loading = true;
      state.error = null;
    },
    successForAllApplications(state, action) {
      state.loading = false;
      state.applications = action.payload;
    },
    failureForAllApplications(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    requestForMyApplications(state) {
      state.loading = true;
      state.error = null;
    },
    successForMyApplications(state, action) {
      state.loading = false;
      state.applications = action.payload;
    },
    failureForMyApplications(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    requestForPostApplication(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    successForPostApplication(state, action) {
      state.loading = false;
      state.message = action.payload;
    },
    failureForPostApplication(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },

    requestForDeleteApplication(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    successForDeleteApplication(state, action) {
      state.loading = false;
      state.message = action.payload;
    },
    failureForDeleteApplication(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },

    requestForUpdateStatus(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    successForUpdateStatus(state, action) {
      state.loading = false;
      state.message = action.payload;
    },
    failureForUpdateStatus(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },

    clearAllErrors(state) {
      state.error = null;
    },
    resetApplicationSlice(state) {
      state.error = null;
      state.applications = [];
      state.message = null;
      state.loading = false;
    },
  },
});

// Fetch all applications for employer
export const fetchEmployerApplications = () => async (dispatch) => {
  dispatch(applicationSlice.actions.requestForAllApplications());
  try {
    const response = await axios.get(
      `https://ai-job-portal-backend-nua8.onrender.com/api/v1/application/employer/getall`,
      { withCredentials: true }
    );
    dispatch(
      applicationSlice.actions.successForAllApplications(
        response.data.applications
      )
    );
    dispatch(applicationSlice.actions.clearAllErrors());
  } catch (error) {
    dispatch(
      applicationSlice.actions.failureForAllApplications(
        error.response?.data?.message || "Something went wrong"
      )
    );
  }
};

// Fetch all applications for job seeker
export const fetchJobSeekerApplications = () => async (dispatch) => {
  dispatch(applicationSlice.actions.requestForMyApplications());
  try {
    const response = await axios.get(
      `https://ai-job-portal-backend-nua8.onrender.com/api/v1/application/jobseeker/getall`,
      { withCredentials: true }
    );
    dispatch(
      applicationSlice.actions.successForMyApplications(
        response.data.applications
      )
    );
    dispatch(applicationSlice.actions.clearAllErrors());
  } catch (error) {
    dispatch(
      applicationSlice.actions.failureForMyApplications(
        error.response?.data?.message || "Something went wrong"
      )
    );
  }
};

// Apply for a job
export const postApplication = (data, jobId) => async (dispatch) => {
  dispatch(applicationSlice.actions.requestForPostApplication());
  try {
    const response = await axios.post(
      `https://ai-job-portal-backend-nua8.onrender.com/api/v1/application/post/${jobId}`,
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    dispatch(
      applicationSlice.actions.successForPostApplication(response.data.message)
    );
    dispatch(applicationSlice.actions.clearAllErrors());
  } catch (error) {
    dispatch(
      applicationSlice.actions.failureForPostApplication(
        error.response?.data?.message || "Something went wrong"
      )
    );
  }
};

// Update application status (e.g., "Accepted", "Rejected", "Pending")
export const updateApplicationStatus = (id, status) => async (dispatch) => {
  dispatch(applicationSlice.actions.requestForUpdateStatus());
  try {
    const response = await axios.put(
      `https://ai-job-portal-backend-nua8.onrender.com/api/v1/application/update-status/${id}`,
      { status },
      { withCredentials: true }
    );

    dispatch(
      applicationSlice.actions.successForUpdateStatus(response.data.message)
    );

    dispatch(fetchEmployerApplications()); // Refresh applications list
  } catch (error) {
    dispatch(
      applicationSlice.actions.failureForUpdateStatus(
        error.response?.data?.message || "Something went wrong"
      )
    );
  }
};

// Delete an application
export const deleteApplication = (id) => async (dispatch) => {
  dispatch(applicationSlice.actions.requestForDeleteApplication());
  try {
    const response = await axios.delete(
      `https://ai-job-portal-backend-nua8.onrender.com/api/v1/application/delete/${id}`,
      { withCredentials: true }
    );
    dispatch(
      applicationSlice.actions.successForDeleteApplication(
        response.data.message
      )
    );
    dispatch(clearAllApplicationErrors());
  } catch (error) {
    dispatch(
      applicationSlice.actions.failureForDeleteApplication(
        error.response?.data?.message || "Something went wrong"
      )
    );
  }
};

// Clear errors
export const clearAllApplicationErrors = () => (dispatch) => {
  dispatch(applicationSlice.actions.clearAllErrors());
};

// Reset application state
export const resetApplicationSlice = () => (dispatch) => {
  dispatch(applicationSlice.actions.resetApplicationSlice());
};

export default applicationSlice.reducer;
