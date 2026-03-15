import axios from "axios";
import { HttpError } from "../utils/httpError.js";

export const sendWhatsAppMessage = async ({ to, message }) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    throw new HttpError(500, "WhatsApp API credentials are not configured");
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const response = await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: Number(process.env.WHATSAPP_API_TIMEOUT_MS || 10_000),
    },
  );

  return response.data;
};
