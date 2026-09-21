class MediaBanner extends HTMLElement {
  constructor() {
    super();
    this.player = null;
    this.videoId = this.dataset.videoId;
    this.type = this.dataset.type;
    this.init = this.dataset.init === "true";
    this.playerReady = false;
  }

  connectedCallback() {
    if (this.init) return;
    this.dataset.init = "true";

    // Handle different video types
    switch (this.type) {
      case "youtube":
        this.loadYouTubeAPI();
        break;
      case "vimeo":
        this.loadVimeoPlayer();
        break;
      case "mp4":
        this.setupMP4Player();
        break;
      default:
        console.warn("Unsupported video type:", this.type);
    }
  }

  loadYouTubeAPI() {
    if (window.YT) {
      this.initYouTubePlayer();
      return;
    }

    // Load YouTube API if not already loaded
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      this.initYouTubePlayer();
    };
  }

  initYouTubePlayer() {
    try {
      // Create container for YouTube player
      const playerContainer = document.createElement("div");
      playerContainer.id = `youtube-player-${this.videoId}`;
      this.appendChild(playerContainer);

      this.player = new YT.Player(playerContainer.id, {
        videoId: this.videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
          mute: 1,
          loop: 1,
          playlist: this.videoId, // Required for looping
        },
        events: {
          onReady: (event) => {
            this.playerReady = true;
            this.handlePlayerReady(event);
          },
          onStateChange: (event) => this.handleStateChange(event),
          onError: (event) => this.handleError(event),
        },
      });
    } catch (error) {
      console.error("Error initializing YouTube player:", error);
    }
  }

  handlePlayerReady(event) {
    try {
      event.target.playVideo();
      // Add class to indicate player is ready
      this.classList.add("player-ready");
    } catch (error) {
      console.error("Error in player ready handler:", error);
    }
  }

  handleStateChange(event) {
    try {
      if (event.data === YT.PlayerState.ENDED) {
        event.target.playVideo();
      }
      // Update UI based on player state
      this.updatePlayerState(event.data);
    } catch (error) {
      console.error("Error in state change handler:", error);
    }
  }

  handleError(event) {
    console.error("YouTube player error:", event.data);
    // Handle specific error codes
    switch (event.data) {
      case 2:
        console.error("Invalid parameter value");
        break;
      case 5:
        console.error("HTML5 player related error");
        break;
      case 100:
        console.error("Video not found");
        break;
      case 101:
      case 150:
        console.error("Video embedding not allowed");
        break;
    }
  }

  updatePlayerState(state) {
    // Remove all state classes
    this.classList.remove(
      "is-playing",
      "is-paused",
      "is-buffering",
      "is-ended"
    );

    // Add appropriate state class
    switch (state) {
      case YT.PlayerState.PLAYING:
        this.classList.add("is-playing");
        break;
      case YT.PlayerState.PAUSED:
        this.classList.add("is-paused");
        break;
      case YT.PlayerState.BUFFERING:
        this.classList.add("is-buffering");
        break;
      case YT.PlayerState.ENDED:
        this.classList.add("is-ended");
        break;
    }
  }

  // Vimeo player initialization (if needed)
  loadVimeoPlayer() {
    console.warn("Vimeo player implementation pending");
  }

  // MP4 video setup (if needed)
  setupMP4Player() {
    // MP4 videos are handled directly in the template
    const video = this.querySelector("video");
    if (video) {
      video.play().catch((error) => {
        console.warn("Autoplay prevented:", error);
      });
    }
  }

  // Public methods for external control
  play() {
    if (!this.playerReady) return;
    if (this.type === "youtube" && this.player) {
      this.player.playVideo();
    }
  }

  pause() {
    if (!this.playerReady) return;
    if (this.type === "youtube" && this.player) {
      this.player.pauseVideo();
    }
  }

  mute() {
    if (!this.playerReady) return;
    if (this.type === "youtube" && this.player) {
      this.player.mute();
    }
  }

  unMute() {
    if (!this.playerReady) return;
    if (this.type === "youtube" && this.player) {
      this.player.unMute();
    }
  }

  // Cleanup
  disconnectedCallback() {
    if (this.player && typeof this.player.destroy === "function") {
      this.player.destroy();
    }
    this.player = null;
    this.playerReady = false;
  }
}

// Register the custom element
customElements.define("media-banner", MediaBanner);
