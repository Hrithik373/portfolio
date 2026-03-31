export type AutoReplyTemplate = (recipient: string, role: string) => string

export const getAutoReplyTemplates = (): AutoReplyTemplate[] => [
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Thank you for reaching out and considering my profile. I truly appreciate the opportunity to connect.\n\n` +
    `I’ve received your message and will review the details shortly. I’ll get back to you with a more detailed response soon.\n\n` +
    `Please feel free to share any additional information about the role or team in the meantime.\n\n` +
    `Looking forward to connecting.\n\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Appreciate you reaching out and sharing this opportunity with me.\n\n` +
    `I’ve received your message and will go through it carefully. I’ll respond with more details shortly.\n\n` +
    `If there’s anything else you’d like to add about the role, feel free to share.\n\n` +
    `Looking forward to speaking with you.\n\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Thank you for contacting me regarding this opportunity.\n\n` +
    `I’ve received your message and will review it soon. I’ll follow up with a detailed response shortly.\n\n` +
    `Please feel free to provide any additional context in the meantime.\n\n` +
    `Best regards,\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Thanks for reaching out and considering my background.\n\n` +
    `I’ve received your message and will take a closer look. I’ll get back to you shortly with more details.\n\n` +
    `Feel free to share any additional information about the opportunity.\n\n` +
    `Looking forward to connecting.\n\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `I appreciate you reaching out and sharing this role with me.\n\n` +
    `Your message has been received, and I’ll review it shortly. I’ll respond soon with more details.\n\n` +
    `Please feel free to include any further information that may be helpful.\n\n` +
    `Looking forward to your response.\n\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Thank you for getting in touch and considering my profile.\n\n` +
    `I’ve received your message and will review it carefully. I’ll follow up soon with a detailed response.\n\n` +
    `If you have more details about the role or expectations, feel free to share.\n\n` +
    `Best regards,\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Thank you for your message and for considering me for this opportunity.\n\n` +
    `I’ve received the details and will review them shortly. I’ll respond with more information soon.\n\n` +
    `Please feel free to share any additional insights about the position.\n\n` +
    `Looking forward to connecting.\n\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Appreciate you reaching out regarding this opportunity.\n\n` +
    `I’ve received your message and will go through it shortly. I’ll get back to you soon with a detailed reply.\n\n` +
    `Feel free to share any additional details in the meantime.\n\n` +
    `Best regards,\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Thank you for reaching out and sharing this opportunity.\n\n` +
    `I’ve received your message and will review it soon. I’ll follow up with more details shortly.\n\n` +
    `Please feel free to provide additional context if available.\n\n` +
    `Looking forward to connecting.\n\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Thank you for considering my profile and reaching out.\n\n` +
    `I’ve received your message and will review it shortly. I’ll get back to you soon with a detailed response.\n\n` +
    `Feel free to share more about the role if needed.\n\n` +
    `Best regards,\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Thanks for getting in touch with me.\n\n` +
    `I’ve received your message and will review the details shortly. I’ll respond soon with more information.\n\n` +
    `Please feel free to share any additional details in the meantime.\n\n` +
    `Looking forward to connecting.\n\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `I appreciate you reaching out and sharing this opportunity.\n\n` +
    `I’ve received your message and will go through it shortly. I’ll follow up soon with a detailed response.\n\n` +
    `Feel free to share more details if available.\n\n` +
    `Best regards,\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Thank you for your message and interest in my profile.\n\n` +
    `I’ve received your message and will review it soon. I’ll respond shortly with more details.\n\n` +
    `Please feel free to provide additional information if needed.\n\n` +
    `Looking forward to connecting.\n\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Thanks for reaching out and sharing this opportunity.\n\n` +
    `I’ve received your message and will review it carefully. I’ll get back to you soon with more details.\n\n` +
    `Feel free to share any additional information in the meantime.\n\n` +
    `Best regards,\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Thank you for considering my profile and reaching out.\n\n` +
    `I’ve received your message and will go through it shortly. I’ll follow up soon with a detailed response.\n\n` +
    `Please feel free to share more about the role.\n\n` +
    `Looking forward to connecting.\n\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Appreciate you getting in touch regarding this opportunity.\n\n` +
    `I’ve received your message and will review the details shortly. I’ll respond soon with more information.\n\n` +
    `Feel free to share additional context if available.\n\n` +
    `Best regards,\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Thank you for your message and for considering me.\n\n` +
    `I’ve received your message and will review it shortly. I’ll follow up soon with more details.\n\n` +
    `Please feel free to share any additional information.\n\n` +
    `Looking forward to connecting.\n\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Thanks for reaching out and sharing this opportunity.\n\n` +
    `I’ve received your message and will go through it soon. I’ll get back to you shortly with a detailed response.\n\n` +
    `Feel free to share any additional details.\n\n` +
    `Best regards,\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `I appreciate you reaching out and considering my background.\n\n` +
    `I’ve received your message and will review it shortly. I’ll respond soon with more details.\n\n` +
    `Please feel free to share additional information.\n\n` +
    `Looking forward to connecting.\n\n` +
    `Hrithik will respond within 12–24 hours.`,
  (recipient, role) =>
    `Dear ${recipient},\n\n` +
    `Thank you for getting in touch and sharing this opportunity.\n\n` +
    `I’ve received your message and will review it carefully. I’ll follow up soon with a detailed response.\n\n` +
    `Feel free to share any additional context or details.\n\n` +
    `Best regards,\n` +
    `Hrithik will respond within 12–24 hours.`,
]
