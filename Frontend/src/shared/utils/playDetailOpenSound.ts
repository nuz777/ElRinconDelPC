let openAudio: HTMLAudioElement | null = null;
let backAudio: HTMLAudioElement | null = null;
let profileSelectAudio: HTMLAudioElement | null = null;
let profileSaveAudio: HTMLAudioElement | null = null;
let profileSettingsOpenAudio: HTMLAudioElement | null = null;
let categorySelectAudio: HTMLAudioElement | null = null;
let chatHelloThereAudio: HTMLAudioElement | null = null;

export function playDetailOpenSound(): void {
  try {
    if (typeof window === "undefined") return;
    if (!openAudio) {
      openAudio = new Audio("/sounds/ps4-trophy.mp3");
      openAudio.preload = "auto";
    }
    openAudio.currentTime = 0;
    void openAudio.play().catch(() => {
      // Ignorar bloqueos de autoplay/reproducción
    });
  } catch {
    // noop
  }
}

export function playDetailBackSound(): void {
  try {
    if (typeof window === "undefined") return;
    if (!backAudio) {
      backAudio = new Audio("/sounds/ps4-menu-back.mp3");
      backAudio.preload = "auto";
    }
    backAudio.currentTime = 0;
    void backAudio.play().catch(() => {
      // Ignorar bloqueos de autoplay/reproducción
    });
  } catch {
    // noop
  }
}

export function playProfileSelectSound(): void {
  try {
    if (typeof window === "undefined") return;
    if (!profileSelectAudio) {
      profileSelectAudio = new Audio("/sounds/ps4-report-menu-appear.mp3");
      profileSelectAudio.preload = "auto";
    }
    profileSelectAudio.currentTime = 0;
    void profileSelectAudio.play().catch(() => {
      // Ignorar bloqueos de autoplay/reproducción
    });
  } catch {
    // noop
  }
}

export function playProfileSaveSound(): void {
  try {
    if (typeof window === "undefined") return;
    if (!profileSaveAudio) {
      profileSaveAudio = new Audio("/sounds/ps4-archivment-get.mp3");
      profileSaveAudio.preload = "auto";
    }
    profileSaveAudio.currentTime = 0;
    void profileSaveAudio.play().catch(() => {
      // Ignorar bloqueos de autoplay/reproducción
    });
  } catch {
    // noop
  }
}

export function playProfileSettingsOpenSound(): void {
  try {
    if (typeof window === "undefined") return;
    if (!profileSettingsOpenAudio) {
      profileSettingsOpenAudio = new Audio("/sounds/playstation-message-sound.mp3");
      profileSettingsOpenAudio.preload = "auto";
    }
    profileSettingsOpenAudio.currentTime = 0;
    void profileSettingsOpenAudio.play().catch(() => {
      // Ignorar bloqueos de autoplay/reproducción
    });
  } catch {
    // noop
  }
}

export function playCategorySelectSound(): void {
  try {
    if (typeof window === "undefined") return;
    if (!categorySelectAudio) {
      categorySelectAudio = new Audio("/sounds/ps5-selection-button.mp3");
      categorySelectAudio.preload = "auto";
    }
    categorySelectAudio.currentTime = 0;
    void categorySelectAudio.play().catch(() => {
      // Ignorar bloqueos de autoplay/reproducción
    });
  } catch {
    // noop
  }
}

export function playChatHelloThereSound(): void {
  try {
    if (typeof window === "undefined") return;
    if (!chatHelloThereAudio) {
      chatHelloThereAudio = new Audio("/sounds/hello-there-obi-wan.mp3");
      chatHelloThereAudio.preload = "auto";
    }
    chatHelloThereAudio.currentTime = 0;
    void chatHelloThereAudio.play().catch(() => {
      // Ignorar bloqueos de autoplay/reproducción
    });
  } catch {
    // noop
  }
}
