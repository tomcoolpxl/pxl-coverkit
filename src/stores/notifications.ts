import { defineStore } from 'pinia';

interface NotificationState {
  visible: boolean;
  message: string;
  timeout: number;
  undoCallback: (() => void) | null;
}

export const useNotificationStore = defineStore('notifications', {
  state: (): NotificationState => ({
    visible: false,
    message: '',
    timeout: 5000,
    undoCallback: null,
  }),
  actions: {
    show(message: string, timeout = 3000) {
      this.message = message;
      this.timeout = timeout;
      this.undoCallback = null;
      this.visible = true;
    },
    showUndo(message: string, onUndo: () => void, timeout = 5000) {
      this.message = message;
      this.timeout = timeout;
      this.undoCallback = onUndo;
      this.visible = true;
    },
    triggerUndo() {
      if (this.undoCallback) {
        this.undoCallback();
        this.visible = false;
        this.undoCallback = null;
      }
    },
    hide() {
      this.visible = false;
      this.undoCallback = null;
    },
  },
});
