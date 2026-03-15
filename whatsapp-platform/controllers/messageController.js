import { HttpError } from "../utils/httpError.js";
import { sendWhatsAppMessage } from "../services/whatsappService.js";

export const sendMessage = async (req, res, next) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      throw new HttpError(400, "Both 'to' and 'message' are required");
    }

    const data = await sendWhatsAppMessage({ to, message });

    return res.status(200).json({
      status: "sent",
      data,
    });
  } catch (error) {
    return next(error);
  }
};
