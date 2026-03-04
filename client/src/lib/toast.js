import { toast } from 'sonner';

export const showSuccessToast = (message) => {
  toast.success(message);
};

export const showErrorToast = (message) => {
  toast.error(message);
};

export const showWarningToast = (message) => {
  toast.warning(message);
};

export const showInfoToast = (message) => {
  toast.info(message);
};
