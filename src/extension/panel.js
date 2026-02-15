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
    data: createDemoData(),
    config: Object.assign({}, RENDER.defaults),
    activeTab: "emotes"
  };

  function setStatus(message, isError) {
    statusElement.textContent = message;
    statusElement.classList.toggle("is-error", !!isError);
  }

  function getPersistedKeys(config) {
    return {
      showEmotes: config.showEmotes,
      showSubBadges: config.showSubBadges,
      showBitsBadges: config.showBitsBadges,
      showStampNames: config.showStampNames,
      headerTitle: config.headerTitle,
      headerColor: config.headerColor,
      footerColor: config.footerColor,
      panelBackgroundColor: config.panelBackgroundColor,
      stampBackgroundColor: config.stampBackgroundColor,
      tierOrder: config.tierOrder,
      columns: config.columns,
      emoteSize: config.emoteSize,
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

  function normalizeEmotes(items) {
    var grouped = { "1000": [], "2000": [], "3000": [] };
    (items || []).forEach(function (emote) {
      var tier = String(emote.tier || "");
      if (!grouped[tier]) {
        return;
      }
      grouped[tier].push({
        id: emote.id,
        name: emote.name,
        tier: tier,
        images: emote.images || {}
      });
    });
    return grouped;
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
    var badges = normalizeBadges(badgesResponse.data);

    state.data = {
      emotesByTier: normalizeEmotes(emotesResponse.data),
      subBadges: badges.subBadges,
      bitsBadges: badges.bitsBadges
    };
  }

  function createDemoData() {
    return {
      emotesByTier: {
        "1000": [{ id: "demo-1", name: "DemoHi", tier: "1000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_a2f6f67fce8c46ad9f9af4c8ec7dba6d/default/light/3.0" } }],
        "2000": [{ id: "demo-2", name: "DemoLove", tier: "2000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_7f5f7e130d48472aa70abf4fcb8915f2/default/light/3.0" } }],
        "3000": [{ id: "demo-3", name: "DemoGG", tier: "3000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_2c5b8c398f6f422f9de0b166cdd68f6f/default/light/3.0" } }]
      },
      subBadges: [],
      bitsBadges: []
    };
  }

  async function initTwitchFlow() {
    if (!window.Twitch || !window.Twitch.ext) {
      setStatus("Running in demo mode outside Twitch.", false);
      renderPanel();
      return;
    }

    if (window.Twitch.ext.configuration && window.Twitch.ext.configuration.onChanged) {
      window.Twitch.ext.configuration.onChanged(function () {
        state.config = readConfigFromTwitch();
        renderPanel();
      });
    }

    window.Twitch.ext.onAuthorized(async function (auth) {
      state.auth = auth;
      setStatus("Loading from Helix API...", false);

      try {
        state.config = readConfigFromTwitch();
        state.config = RENDER.normalizeConfig(getPersistedKeys(state.config));
        await fetchAllData();
        setStatus("Updated.", false);
      } catch (error) {
        setStatus(error.message || "Failed to load data.", true);
      }

      renderPanel();
    });
  }

  initTwitchFlow();
})();
