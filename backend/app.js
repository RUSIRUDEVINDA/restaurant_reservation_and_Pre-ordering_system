//username->admin  password->1234

require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const orderRouter = require("./routes/restaurantOrderRoute");
const reservationRouter = require("./routes/reservationRoute");
const restaurantRouter = require("./routes/restaurantRoute");
const reservationRequestController = require('./controllers/reservationRequestController');

const app = express();

//Middleware 
app.use(express.json());
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
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
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });