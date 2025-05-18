import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import { v2 as cloudinary } from "cloudinary";
import {sendEmail} from "../utils/sendEmail.js";


import axios from "axios"; // Import axios for API requests

export const postApplication = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, phone, address, coverLetter } = req.body;
  if (!name || !email || !phone || !address || !coverLetter) {
    return next(new ErrorHandler("All fields are required.", 400));
  }

  const jobDetails = await Job.findById(id);
  if (!jobDetails) {
    return next(new ErrorHandler("Job not found.", 404));
  }

  const isAlreadyApplied = await Application.findOne({
    "jobInfo.jobId": id,
    "jobSeekerInfo.id": req.user._id,
  });
  if (isAlreadyApplied) {
    return next(new ErrorHandler("You have already applied for this job.", 400));
  }

  const jobSeekerInfo = {
    id: req.user._id,
    name,
    email,
    phone,
    address,
    coverLetter,
    role: "Job Seeker",
  };

  // Upload Resume to Cloudinary if provided
  if (req.files && req.files.resume) {
    const { resume } = req.files;
    try {
      const cloudinaryResponse = await cloudinary.uploader.upload(
        resume.tempFilePath,
        { folder: "Job_Seekers_Resume" }
      );
      if (!cloudinaryResponse || cloudinaryResponse.error) {
        return next(new ErrorHandler("Failed to upload resume to Cloudinary.", 500));
      }
      jobSeekerInfo.resume = {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      };
    } catch (error) {
      return next(new ErrorHandler("Failed to upload resume", 500));
    }
  } else {
    if (!req.user.resume?.url) {
      return next(new ErrorHandler("Please upload your resume.", 400));
    }
    jobSeekerInfo.resume = {
      public_id: req.user.resume.public_id,
      url: req.user.resume.url,
    };
  }

  const employerInfo = {
    id: jobDetails.postedBy,
    role: "Employer",
  };

  const jobInfo = {
    jobId: id,
    jobTitle: jobDetails.title,
  };

  let resumeScore = 0;

  // ✅ Send Resume, Job Description & Requirements to FastAPI for Scoring
  try {
    const fastApiResponse = await axios.post("http://127.0.0.1:8000/score-resume", {
      resume_url: jobSeekerInfo.resume.url,
      job_description: jobDetails.introduction,
      job_requirements: jobDetails.responsibilities, // Ensure this exists in Job schema
    });

    if (fastApiResponse.data && fastApiResponse.data.resume_score !== undefined) {
      resumeScore = fastApiResponse.data.resume_score; 
    } else {
      console.error("Invalid response from FastAPI:", fastApiResponse.data);
    }
  } catch (error) {
    console.error("Error scoring resume:", error.message);
  }

  // ✅ Store Resume Score in Application
  const application = await Application.create({
    jobSeekerInfo,
    employerInfo,
    jobInfo,
    resumeScore, // Save the resume score in the application
  });

  const subject = `Application Received: ${jobDetails.title} at ${jobDetails.companyName}`;
  const message = `Hi ${name},\n\nThank you for applying for the ${jobDetails.title} position at ${jobDetails.companyName}. We have received your application, and our hiring team will review it shortly.\n\nBest regards,\n${jobDetails.companyName} Hiring Team`;

  sendEmail({
    email: email,
    subject,
    message,
  });

  res.status(201).json({
    success: true,
    message: "Application submitted.",
    application,
  });
});


export const employerGetAllApplication = catchAsyncErrors(
  async (req, res, next) => {
    const { _id } = req.user;
    const applications = await Application.find({
      "employerInfo.id": _id,
      "deletedBy.employer": false,
    });
    res.status(200).json({
      success: true,
      applications,
    });
  }
);

export const jobSeekerGetAllApplication = catchAsyncErrors(
  async (req, res, next) => {
    const { _id } = req.user;
    const applications = await Application.find({
      "jobSeekerInfo.id": _id,
      "deletedBy.jobSeeker": false,
    }).populate({
      path: "jobInfo.jobId", 
      select: "title recruiterEmail companyName" // Include recruiterEmail from Job schema
    });
    res.status(200).json({
      success: true,
      applications,
    });
  }
);

export const acceptApplication = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  // Find the application by ID
  const application = await Application.findById(id);
  if (!application) {
    return next(new ErrorHandler("Application not found.", 404));
  }

  // Update application status to "Accepted"
  application.status = "Accepted";
  await application.save();

  // Get job details
  const jobDetails = await Job.findById(application.jobInfo.jobId);
  if (!jobDetails) {
    return next(new ErrorHandler("Job details not found.", 404));
  }

  // Send an email to the job seeker
  const subject = `Your Application for ${jobDetails.title} Has Been Shortlisted`;
  const message = `Dear ${application.jobSeekerInfo.name},\n\nCongratulations! Your application for the position of ${jobDetails.title} at ${jobDetails.companyName} has been shortlisted. Our team will contact you for further steps soon.\n\nBest regards,\n${jobDetails.companyName} Hiring Team`;

  sendEmail({
    email: application.jobSeekerInfo.email,
    subject,
    message,
  });

  res.status(200).json({
    success: true,
    message: "Application accepted and email sent to the job seeker.",
  });
});



export const updateApplicationStatus = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== "Employer") {
    return next(new ErrorHandler("Only employers can update application status.", 403));
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!["Pending", "Accepted", "Rejected"].includes(status)) {
    return next(new ErrorHandler("Invalid status provided.", 400));
  }

  const application = await Application.findById(id).populate("jobInfo").populate("jobSeekerInfo");

  if (!application) {
    return next(new ErrorHandler("Application not found.", 404));
  }

  application.status = status;
  await application.save();

  let emailOptions;
  if (status === "Accepted") {
    emailOptions = {
      email: application.jobSeekerInfo.email,
      subject: `Congratulations! Your Job Application has been Accepted`,
      message: `Dear ${application.jobSeekerInfo.name},\n\nWe are pleased to inform you that your application for "${application.jobInfo.jobTitle}" has been accepted.\n\nAccess the mock interview platform: https://ai-mock-interviews.vercel.app/`,
    };
  } else if (status === "Rejected") {
    emailOptions = {
      email: application.jobSeekerInfo.email,
      subject: `Your Job Application Status: Rejected`,
      message: `Dear ${application.jobSeekerInfo.name},\n\nWe regret to inform you that your application for "${application.jobInfo.jobTitle}" has been rejected.`,
    };
  }

  await sendEmail(emailOptions);

  res.status(200).json({
    success: true,
    message: `Application status updated to ${status}, and an email notification has been sent.`,
    application,
  });
});



export const deleteApplication = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const application = await Application.findById(id);
  if (!application) {
    return next(new ErrorHandler("Application not found.", 404));
  }
  const { role } = req.user;
  switch (role) {
    case "Job Seeker":
      application.deletedBy.jobSeeker = true;
      await application.save();
      break;
    case "Employer":
      application.deletedBy.employer = true;
      await application.save();
      break;

    default:
      console.log("Default case for application delete function.");
      break;
  }

  if (
    application.deletedBy.employer === true &&
    application.deletedBy.jobSeeker === true
  ) {
    await application.deleteOne();
  }
  res.status(200).json({
    success: true,
    message: "Application Deleted.",
  });
});
 