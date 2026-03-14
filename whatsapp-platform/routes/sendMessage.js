import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/send-message", async (req, res) => {

  const apiKey = req.headers["x-api-key"];

  if (apiKey !== process.env.APP_API_KEY) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  const { to, message, keyword } = req.body;

  try {

    // send message to WhatsApp webhook router
    await axios.post(
      "https://whatsappplatform-production.up.railway.app/webhook",
      {
        to,
        message,
        keyword
      }
    );

    res.json({
      success: true,
      status: "Message routed"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Message sending failed"
    });

  }

});

export default router;
