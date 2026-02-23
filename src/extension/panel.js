(function () {
  "use strict";

  var RENDER = window.EmoteDeckRender;
  var appElement = document.getElementById("app");
  var statusElement = document.getElementById("panel-status");

  if (!RENDER) {
    statusElement.textContent = "Failed to load render.js";
    statusElement.classList.add("is-error");
    return;
  }

  var state = {
    auth: null,
    data: createEmptyData(),
    config: Object.assign({}, RENDER.defaults),
    activeTab: "emotes",
    showInfoStatus: false,
    platform: "web",
    host: "browser"
  };

  function setStatus(message, isError, forceShow) {
    statusElement.textContent = message;
    statusElement.classList.toggle("is-error", !!isError);
    var visible = !!isError || !!forceShow;
    statusElement.style.display = visible && message ? "block" : "none";
  }

  function normalizePlatform(raw) {
    var value = String(raw || "").toLowerCase();
    return value === "mobile" ? "mobile" : "web";
  }

  function detectPlatformFromQuery() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return normalizePlatform(params.get("platform"));
    } catch (_error) {
      return "web";
    }
  }

  function applyPlatformToDom(platform) {
    var normalized = normalizePlatform(platform);
    document.documentElement.setAttribute("data-ed-platform", normalized);
    if (document.body) {
      document.body.setAttribute("data-ed-platform", normalized);
    }
  }

  function normalizeHost(raw) {
    return String(raw || "").toLowerCase() === "twitch" ? "twitch" : "browser";
  }

  function detectHost() {
    return window.Twitch && window.Twitch.ext ? "twitch" : "browser";
  }

  function applyHostToDom(host) {
    var normalized = normalizeHost(host);
    document.documentElement.setAttribute("data-ed-host", normalized);
    if (document.body) {
      document.body.setAttribute("data-ed-host", normalized);
    }
  }

  function getPersistedKeys(config) {
    return {
      showEmotes: config.showEmotes,
      showBadges: config.showBadges,
      showFollowerStamps: config.showFollowerStamps,
      showCheermotes: config.showCheermotes,
      showTier1000: config.showTier1000,
      showTier2000: config.showTier2000,
      showTier3000: config.showTier3000,
      showSubBadges: config.showSubBadges,
      showBitsBadges: config.showBitsBadges,
      showEmoteNames: config.showEmoteNames,
      showBadgeNames: config.showBadgeNames,
      emoteNameSize: config.emoteNameSize,
      badgeNameSize: config.badgeNameSize,
      showHoverTooltip: config.showHoverTooltip,
      enableStampNameCopy: config.enableStampNameCopy,
      fontFamily: config.fontFamily,
      hiddenStampIds: config.hiddenStampIds,
      headerTitle: config.headerTitle,
      headerColor: config.headerColor,
      footerColor: config.footerColor,
      panelBackgroundColor: config.panelBackgroundColor,
      stampBackgroundColor: config.stampBackgroundColor,
      emoteOrderByTier: config.emoteOrderByTier,
      followerEmoteOrder: config.followerEmoteOrder,
      cheermoteOrder: config.cheermoteOrder,
      subBadgeOrder: config.subBadgeOrder,
      bitsBadgeOrder: config.bitsBadgeOrder,
      emoteSectionOrder: config.emoteSectionOrder,
      columns: config.columns,
      emoteSize: config.emoteSize,
      itemPadding: config.itemPadding,
      itemGap: config.itemGap,
      theme: config.theme,
      primaryColor: config.primaryColor,
      accentColor: config.accentColor,
      backgroundColor: config.backgroundColor,
      borderRadius: config.borderRadius,
      glowIntensity: config.glowIntensity
    };
  }

  function renderPanel() {
    var configForRender = Object.assign({}, state.config, {
      platform: state.platform,
      activeTab: state.activeTab,
      onTabChange: function (nextTab) {
        state.activeTab = nextTab;
        renderPanel();
      }
    });
    RENDER.render(appElement, state.data, configForRender);
  }

  function parseConfig(rawContent) {
    if (!rawContent) {
      return Object.assign({}, RENDER.defaults);
    }
    try {
      return RENDER.normalizeConfig(JSON.parse(rawContent));
    } catch (_err) {
      return Object.assign({}, RENDER.defaults);
    }
  }

  function hasUsableTwitchContext() {
    return !!(
      window.Twitch &&
      window.Twitch.ext &&
      typeof window.Twitch.ext.onAuthorized === "function"
    );
  }

  function readConfigFromTwitch() {
    if (!window.Twitch || !window.Twitch.ext || !window.Twitch.ext.configuration) {
      return Object.assign({}, RENDER.defaults);
    }
    var broadcasterConfig = window.Twitch.ext.configuration.broadcaster;
    var raw = broadcasterConfig && broadcasterConfig.content ? broadcasterConfig.content : "";
    return parseConfig(raw);
  }

  function toHeaderMap(auth) {
    var helixJwt = auth && auth.helixToken;
    if (!helixJwt) {
      throw new Error("Missing auth.helixToken from Twitch onAuthorized payload.");
    }
    return {
      "Client-ID": auth.clientId,
      "Authorization": "Extension " + helixJwt
    };
  }

  async function callHelix(path) {
    var url = "https://api.twitch.tv/helix" + path;
    var response = await fetch(url, {
      method: "GET",
      headers: toHeaderMap(state.auth)
    });

    if (!response.ok) {
      var body = await response.text();
      throw new Error("Helix API error: " + response.status + " " + body);
    }

    return response.json();
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeEmotes(items, responseMeta) {
    var responseTemplate = responseMeta && responseMeta.template ? responseMeta.template : "";
    var responseFormat = toArray(responseMeta && (responseMeta.format || responseMeta.formats));
    var responseScale = toArray(responseMeta && (responseMeta.scale || responseMeta.scales));
    var responseThemeMode = toArray(responseMeta && (responseMeta.theme_mode || responseMeta.theme_modes));
    var grouped = { "1000": [], "2000": [], "3000": [] };
    var follower = [];
    var cheermotes = [];
    (items || []).forEach(function (emote) {
      var tier = String(emote.tier || "");
      var emoteType = String(emote.emote_type || "").toLowerCase();
      var normalized = {
        id: emote.id,
        name: emote.name,
        tier: tier,
        images: emote.images || {},
        format: toArray(emote.format).length ? toArray(emote.format) : responseFormat,
        scale: toArray(emote.scale).length ? toArray(emote.scale) : responseScale,
        theme_mode: toArray(emote.theme_mode).length ? toArray(emote.theme_mode) : responseThemeMode,
        template: emote.template || responseTemplate || ""
      };
      if (grouped[tier]) {
        grouped[tier].push(normalized);
        return;
      }
      if (emoteType === "follower") {
        follower.push(normalized);
        return;
      }
      if (emoteType === "bitstier") {
        cheermotes.push(normalized);
      }
    });
    return {
      emotesByTier: grouped,
      followerEmotes: follower,
      cheerEmotes: cheermotes
    };
  }

  function normalizeBadges(items) {
    var subBadges = [];
    var bitsBadges = [];

    (items || []).forEach(function (setItem) {
      var target = null;
      if (setItem.set_id === "subscriber") {
        target = subBadges;
      } else if (setItem.set_id === "bits") {
        target = bitsBadges;
      }
      if (!target) {
        return;
      }

      (setItem.versions || []).forEach(function (version) {
        target.push({
          id: version.id,
          title: (setItem.set_id === "subscriber" ? "Subscriber" : "Bits") + " " + version.id,
          description: version.title || "",
          imageUrl: version.image_url_4x || version.image_url_2x || version.image_url_1x || ""
        });
      });
    });

    return {
      subBadges: subBadges,
      bitsBadges: bitsBadges
    };
  }

  async function fetchAllData() {
    var emotesResponse = await callHelix("/chat/emotes?broadcaster_id=" + encodeURIComponent(state.auth.channelId));
    var badgesResponse = await callHelix("/chat/badges?broadcaster_id=" + encodeURIComponent(state.auth.channelId));
    var normalizedEmotes = normalizeEmotes(emotesResponse.data, emotesResponse);
    var badges = normalizeBadges(badgesResponse.data);

    state.data = {
      emotesByTier: normalizedEmotes.emotesByTier,
      followerEmotes: normalizedEmotes.followerEmotes,
      cheerEmotes: normalizedEmotes.cheerEmotes,
      subBadges: badges.subBadges,
      bitsBadges: badges.bitsBadges
    };
  }

  function createEmptyData() {
    return {
      emotesByTier: { "1000": [], "2000": [], "3000": [] },
      followerEmotes: [],
      cheerEmotes: [],
      subBadges: [],
      bitsBadges: []
    };
  }

  function createDemoData() {
    function demoStampImage(fileName) {
      return { url_4x: "demo-stamps/" + fileName };
    }

    function demoBadgeImage(fileName) {
      return "demo-stamps/" + fileName;
    }

    return {
      emotesByTier: {
        "1000": [
          { id: "demo-hi", name: "DemoHi", tier: "1000", images: demoStampImage("demo-hi.svg") },
          { id: "demo-nice", name: "DemoNice", tier: "1000", images: demoStampImage("demo-nice.svg") },
          { id: "demo-wave", name: "DemoWave", tier: "1000", images: demoStampImage("demo-wave.svg") },
          { id: "demo-cheer", name: "DemoCheer", tier: "1000", images: demoStampImage("demo-cheer.svg") }
        ],
        "2000": [
          { id: "demo-love", name: "DemoLove", tier: "2000", images: demoStampImage("demo-love.svg") },
          { id: "demo-clap", name: "DemoClap", tier: "2000", images: demoStampImage("demo-clap.svg") },
          { id: "demo-fire", name: "DemoFire", tier: "2000", images: demoStampImage("demo-fire.svg") }
        ],
        "3000": [
          { id: "demo-gg", name: "DemoGG", tier: "3000", images: demoStampImage("demo-gg.svg") },
          { id: "demo-king", name: "DemoKing", tier: "3000", images: demoStampImage("demo-king.svg") },
          { id: "demo-halo", name: "DemoHalo", tier: "3000", images: demoStampImage("demo-halo.svg") }
        ]
      },
      followerEmotes: [
        { id: "follower-wave", name: "FollowerWave", images: demoStampImage("follower-wave.svg") },
        { id: "follower-heart", name: "FollowerHeart", images: demoStampImage("follower-heart.svg") },
        { id: "follower-hype", name: "FollowerHype", images: demoStampImage("follower-hype.svg") }
      ],
      cheerEmotes: [
        { id: "cheer-1", name: "Cheer 1", imageUrl: demoBadgeImage("bits-100.svg") },
        { id: "cheer-100", name: "Cheer 100", imageUrl: demoBadgeImage("bits-1000.svg") },
        { id: "cheer-1000", name: "Cheer 1000", imageUrl: demoBadgeImage("bits-5000.svg") }
      ],
      subBadges: [
        { id: "1", title: "Subscriber 1", description: "1 month", imageUrl: demoBadgeImage("sub-1.svg") },
        { id: "3", title: "Subscriber 3", description: "3 months", imageUrl: demoBadgeImage("sub-3.svg") },
        { id: "6", title: "Subscriber 6", description: "6 months", imageUrl: demoBadgeImage("sub-6.svg") }
      ],
      bitsBadges: [
        { id: "100", title: "Bits 100", description: "100 bits", imageUrl: demoBadgeImage("bits-100.svg") },
        { id: "1000", title: "Bits 1000", description: "1000 bits", imageUrl: demoBadgeImage("bits-1000.svg") },
        { id: "5000", title: "Bits 5000", description: "5000 bits", imageUrl: demoBadgeImage("bits-5000.svg") }
      ]
    };
  }

  async function initTwitchFlow() {
    state.platform = detectPlatformFromQuery();
    state.host = detectHost();
    applyPlatformToDom(state.platform);
    applyHostToDom(state.host);

    if (!hasUsableTwitchContext()) {
      state.data = createDemoData();
      state.showInfoStatus = true;
      if (state.platform === "mobile") {
        setStatus("Demo mode (mobile layout). Helix data requires Twitch extension context.", false, true);
      } else {
        setStatus("Running in demo mode outside Twitch.", false, true);
      }
      renderPanel();
      return;
    }

    state.showInfoStatus = false;
    state.data = createEmptyData();
    setStatus("", false);

    if (window.Twitch.ext.configuration && window.Twitch.ext.configuration.onChanged) {
      window.Twitch.ext.configuration.onChanged(function () {
        state.config = readConfigFromTwitch();
        renderPanel();
      });
    }

    var authResolved = false;
    var authFallbackTimer = setTimeout(function () {
      if (authResolved) {
        return;
      }
      authResolved = true;
      state.data = createDemoData();
      state.showInfoStatus = true;
      if (state.platform === "mobile") {
        setStatus("Demo mode (mobile layout). Helix data requires Twitch extension context.", false, true);
      } else {
        setStatus("Running in demo mode outside Twitch.", false, true);
      }
      renderPanel();
    }, 1800);

    window.Twitch.ext.onAuthorized(async function (auth) {
      clearTimeout(authFallbackTimer);
      authResolved = true;
      state.auth = auth;
      setStatus("Loading from Helix API...", false, state.showInfoStatus);

      try {
        state.config = readConfigFromTwitch();
        state.config = RENDER.normalizeConfig(getPersistedKeys(state.config));
        await fetchAllData();
        setStatus("Updated.", false, state.showInfoStatus);
      } catch (error) {
        setStatus(error.message || "Failed to load data.", true);
      }

      renderPanel();
    });
  }

  window.addEventListener("resize", function () {
    renderPanel();
  });

  initTwitchFlow();
})();
