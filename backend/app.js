import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connection } from "./database/connection.js";
import { errorMiddleware } from "./middlewares/error.js";
import fileUpload from "express-fileupload";
import userRouter from "./routes/userRouter.js";
import jobRouter from "./routes/jobRouter.js";
import applicationRouter from "./routes/applicationRouter.js";
import { newsLetterCron } from "./automation/newsLetterCron.js";

const app = express();
config({ path: "./config/config.env" });

// ✅ CORS config (Allow credentials and frontend origin)
app.use(cors({
  origin: process.env.FRONTEND_URL, // e.g., "https://ai-job-portal-0ytr.onrender.com"
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

// ❌ REMOVE this manual header setting block, it's redundant & may conflict:
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "https://ai-job-portal-0ytr.onrender.com");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

// ✅ Middleware setup
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/",
}));

// ✅ Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicationRouter);

// ✅ Cron & DB
newsLetterCron();
connection();

// ✅ Error handling
app.use(errorMiddleware);

export default app;
