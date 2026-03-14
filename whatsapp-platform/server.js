import express from "express";
import dotenv from "dotenv";
import sendMessageRoute from "./routes/sendMessage.js";

dotenv.config();

const app = express();

app.use(express.json());

app.use("/api", sendMessageRoute);

app.get("/", (req, res) => {
  res.send("WhatsApp Platform Running");
});

app.listen(process.env.PORT || 8080, () => {
  console.log("Server running");
});
