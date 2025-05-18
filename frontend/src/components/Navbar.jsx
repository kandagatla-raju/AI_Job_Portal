import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { fetchJobSeekerApplications } from "../store/slices/applicationSlice";
import { toast } from "react-toastify";

const Navbar = () => {
  const [show, setShow] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const { applications } = useSelector((state) => state.applications);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuthenticated && user?.role === "Job Seeker") {
      dispatch(fetchJobSeekerApplications());
    }
  }, [dispatch, isAuthenticated, user]);

  // ✅ Check if job seeker has an accepted application
  const hasAcceptedApplication =
    user?.role === "Job Seeker" &&
    applications?.some((app) => app.status?.toLowerCase() === "accepted");

  const handleMockInterview = (e) => {
    if (!hasAcceptedApplication) {
      e.preventDefault();
      toast.error("No Access: None of your applications have been accepted.");
    }
  };

  return (
    <>
      <nav className={show ? "navbar show_navbar" : "navbar"}>
        <div className="logo">
          <img src="/logo.png" alt="logo" />
        </div>
        <div className="links">
          <ul>
            <li>
              <Link to={"/"} onClick={() => setShow(!show)}>
                HOME
              </Link>
            </li>
            <li>
              <Link to={"/jobs"} onClick={() => setShow(!show)}>
                JOBS
              </Link>
            </li>
            {isAuthenticated ? (
              <div>
                <li>
                  <Link to={"/dashboard"} onClick={() => setShow(!show)}>
                    DASHBOARD
                  </Link>
                </li>

                {/* ✅ Show "AI Mock Interviews" only for Job Seekers */}
                {user?.role === "Job Seeker" && (
                  <li>
                    <Link
                      to={hasAcceptedApplication ? "https://ai-mock-interviews.vercel.app/" : "#"}
                      onClick={handleMockInterview}
                    >
                      AI Mock Interviews
                    </Link>
                  </li>
                )}
              </div>
            ) : (
              <li>
                <Link to={"/login"} onClick={() => setShow(!show)}>
                  LOGIN
                </Link>
              </li>
            )}
          </ul>
        </div>
        <GiHamburgerMenu className="hamburger" onClick={() => setShow(!show)} />
      </nav>
    </>
  );
};

export default Navbar;
