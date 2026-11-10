export type ToastTone = "success" | "error";

export type ToastMessage = {
  tone: ToastTone;
  title: string;
  description: string;
};
