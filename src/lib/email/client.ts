import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResend() {
  resendClient ??= new Resend(process.env.RESEND_API_KEY!);
  return resendClient;
}
