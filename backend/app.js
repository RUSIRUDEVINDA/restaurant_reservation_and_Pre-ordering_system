//username->admin  password->1234

require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const orderRouter = require("./routes/restaurantOrderRoute");
const reservationRouter = require("./routes/reservationRoute");
const restaurantRouter = require("./routes/restaurantRoute");
const authRouter = require("./routes/authRoute");
const reservationRequestController = require('./controllers/reservationRequestController');
const { seedDefaultUsers } = require('./controllers/authController');

const app = express();

//Middleware 
app.use(express.json());
const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URLS,
]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8083",
  "http://127.0.0.1:8083",
  ...configuredOrigins,
]);

const isLocalDevelopmentOrigin = (origin) => {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
};

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "airport-food-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/ready", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  if (!databaseConnected) {
    return res.status(503).json({
      status: "not ready",
      database: "disconnected",
    });
  }

  res.status(200).json({
    status: "ready",
    database: "connected",
  });
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || isLocalDevelopmentOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Handle preflight requests for all restaurant routes
app.options('/restaurant/*', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

app.use("/api/auth", authRouter);
app.use("/restaurant", orderRouter);
app.use("/restaurant", restaurantRouter);
app.use("/api", reservationRouter);

// Reservation Request Routes
app.post('/api/reservation-requests', reservationRequestController.createReservationRequest);
app.get('/api/reservation-requests', reservationRequestController.getReservationRequestsByUserEmail);
app.get('/api/restaurant/:restaurantId/reservation-requests', reservationRequestController.getReservationRequestsByRestaurant);
app.patch('/api/reservation-requests/:id', reservationRequestController.updateReservationRequestStatus);


const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("MongoDB connected successfully");
    await seedDefaultUsers();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
