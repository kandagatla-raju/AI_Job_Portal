import React, { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  clearAllApplicationErrors,
  deleteApplication,
  fetchEmployerApplications,
  resetApplicationSlice,
  updateApplicationStatus,
} from "../store/slices/applicationSlice";
import Spinner from "./Spinner";
import { Link } from "react-router-dom";

const Applications = () => {
  const { applications, loading, error, message } = useSelector(
    (state) => state.applications
  );
  const dispatch = useDispatch();

  // Track IDs of applications that have already been updated
  const [updatedApps, setUpdatedApps] = useState(new Set());

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAllApplicationErrors());
    }
    if (message) {
      toast.success(message);
      dispatch(resetApplicationSlice());
    }
    dispatch(fetchEmployerApplications());
  }, [dispatch, error, message]);

  // Only update applications once if resumeScore is below 40
  useEffect(() => {
    applications.forEach((app) => {
      if (
        app.resumeScore < 40 &&
        app.status !== "Rejected" &&
        !updatedApps.has(app._id)
      ) {
        dispatch(updateApplicationStatus(app._id, "Rejected"));
        setUpdatedApps((prev) => new Set(prev).add(app._id));
      }
    });
  }, [applications, dispatch, updatedApps]);

  const handleStatusChange = useCallback((id, status) => {
    dispatch(updateApplicationStatus(id, status));
  }, [dispatch]);

  const handleDeleteApplication = useCallback((id) => {
    dispatch(deleteApplication(id));
  }, [dispatch]);

  const highScoringApplications = applications.filter(
    (app) => app.resumeScore >= 40
  );

  // Group applications by job title
  const groupedApplications = highScoringApplications.reduce((acc, app) => {
    const jobTitle = app.jobInfo.jobTitle;
    if (!acc[jobTitle]) {
      acc[jobTitle] = [];
    }
    acc[jobTitle].push(app);
    return acc;
  }, {});

  return (
    <>
      {loading ? (
        <Spinner />
      ) : Object.keys(groupedApplications).length === 0 ? (
        <h1>No high-scoring applications available.</h1>
      ) : (
        <div className="account_components">
          <h3>Applications</h3>
          {Object.entries(groupedApplications).map(([jobTitle, apps]) => (
            <div key={jobTitle} className="job-section">
              
              <p className="job-title">
                      <h4><strong>Job Title : {jobTitle}</strong></h4>
                      
                    </p>
              <div className="applications_container">
                {apps.map((element) => (
                  <div className="card" key={element._id}>
                    <p className="sub-sec">
                      <span>Applicant's Name: </span>
                      {element.jobSeekerInfo.name}
                    </p>
                    <p className="sub-sec">
                      <span>Email: </span>
                      {element.jobSeekerInfo.email}
                    </p>
                    <p className="sub-sec">
                      <span>Phone: </span>
                      {element.jobSeekerInfo.phone}
                    </p>
                    <p className="sub-sec">
                      <span>Resume Score: </span>
                      <span
                        className={`resume-score ${
                          element.resumeScore > 80
                            ? "high"
                            : element.resumeScore > 60
                            ? "medium"
                            : "low"
                        }`}
                      >
                        {element.resumeScore} / 100
                      </span>
                    </p>
                    <p className="sub-sec">
                      <span>Status: </span>
                      <strong
                        style={{
                          color:
                            element.status === "Accepted"
                              ? "green"
                              : element.status === "Rejected"
                              ? "red"
                              : "orange",
                        }}
                      >
                        {element.status || "Pending"}
                      </strong>
                    </p>
                    <div className="sub-sec">
                      <span>Update Status:</span>
                      <select
                        onChange={(e) =>
                          handleStatusChange(element._id, e.target.value)
                        }
                        defaultValue={element.status || "Pending"}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="btn-wrapper">
                      <button
                        className="outline_btn"
                        onClick={() => handleDeleteApplication(element._id)}
                      >
                        Delete Application
                      </button>
                      <Link
                        to={
                          element.jobSeekerInfo &&
                          element.jobSeekerInfo.resume.url
                        }
                        className="btn"
                        target="_blank"
                      >
                        View Resume
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Applications;
