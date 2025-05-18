import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const ContactEmployer = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  // ✅ Extract query parameters correctly
  const jobTitle = params.get("jobTitle") || "N/A";
  const recruiterEmail = params.get("recruiterEmail") || "N/A";
  const companyName = params.get("companyName") || "N/A";

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!jobTitle || !recruiterEmail || recruiterEmail === "N/A") {
      toast.error("Missing job details. Please try again.");
    }
  }, [jobTitle, recruiterEmail]);

  const handleSendEmail = (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Message cannot be empty!");
      return;
    }

    window.location.href = `mailto:${recruiterEmail}?subject=Regarding ${jobTitle} at ${companyName}&body=${encodeURIComponent(message)}`;
  };

  return (
    <div className="contactcontainer">
      <div className="contact-box">
        <h1>Contact Recruiter</h1>


        <p><strong>Job Title:</strong> {jobTitle}</p>
        
        <p><strong>Company Name:</strong> {companyName}</p>
       
        <textarea
          className="message-box"
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        ></textarea>

        <button onClick={handleSendEmail} className="send-btn">
          Send Email
        </button>
      </div>
    </div>
  );
};

export default ContactEmployer;
