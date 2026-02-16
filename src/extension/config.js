(function () {
  "use strict";

  var RENDER = window.EmoteDeckRender;
  var previewElement = document.getElementById("preview");
  var statusElement = document.getElementById("config-status");
  var formElement = document.getElementById("config-form");

  if (!RENDER) {
    statusElement.textContent = "Failed to load render.js";
    statusElement.classList.add("is-error");
    return;
  }

  var PRESET_KEYS = [
    "headerTitle",
    "headerColor",
    "footerColor",
    "panelBackgroundColor",
    "stampBackgroundColor",
    "emoteOrderByTier",
    "subBadgeOrder",
    "bitsBadgeOrder",
    "showEmotes",
    "showSubBadges",
    "showBitsBadges",
    "showStampNames",
    "tierOrder",
    "columns",
    "emoteSize",
    "theme",
    "primaryColor",
    "accentColor",
    "backgroundColor",
    "borderRadius",
    "glowIntensity"
  ];

  var controls = {
    headerTitle: document.getElementById("headerTitle"),
    headerColor: document.getElementById("headerColor"),
    footerColor: document.getElementById("footerColor"),
    panelBackgroundColor: document.getElementById("panelBackgroundColor"),
    stampBackgroundColor: document.getElementById("stampBackgroundColor"),
    showEmotes: document.getElementById("showEmotes"),
    showSubBadges: document.getElementById("showSubBadges"),
    showBitsBadges: document.getElementById("showBitsBadges"),
    showStampNames: document.getElementById("showStampNames"),
    tierOrder: document.getElementById("tierOrder"),
    columns: document.getElementById("columns"),
    emoteSize: document.getElementById("emoteSize"),
    theme: document.getElementById("theme"),
    primaryColor: document.getElementById("primaryColor"),
    accentColor: document.getElementById("accentColor"),
    backgroundColor: document.getElementById("backgroundColor"),
    borderRadius: document.getElementById("borderRadius"),
    glowIntensity: document.getElementById("glowIntensity"),
    columnsValue: document.getElementById("columnsValue"),
    emoteSizeValue: document.getElementById("emoteSizeValue"),
    borderRadiusValue: document.getElementById("borderRadiusValue"),
    glowIntensityValue: document.getElementById("glowIntensityValue"),
    saveButton: document.getElementById("save-button"),
    resetButton: document.getElementById("reset-button")
  };

  var state = {
    auth: null,
    config: Object.assign({}, RENDER.defaults),
    data: createDemoData(),
    activeTab: "emotes",
    saveTimer: null,
    pendingRemoteSave: false
  };

  function setStatus(message, isError) {
    statusElement.textContent = message;
    statusElement.classList.toggle("is-error", !!isError);
  }

  function pickPersistedConfig(config) {
    var output = {};
    PRESET_KEYS.forEach(function (key) {
      output[key] = config[key];
    });
    return output;
  }

  function parseConfig(raw) {
    if (!raw) {
      return Object.assign({}, RENDER.defaults);
    }
    try {
      return RENDER.normalizeConfig(JSON.parse(raw));
    } catch (_err) {
      return Object.assign({}, RENDER.defaults);
    }
  }

  function syncRangeLabels() {
    controls.columnsValue.textContent = controls.columns.value;
    controls.emoteSizeValue.textContent = controls.emoteSize.value;
    controls.borderRadiusValue.textContent = controls.borderRadius.value;
    controls.glowIntensityValue.textContent = controls.glowIntensity.value;
  }

  function getRecommendedEmoteSize(columns) {
    var col = parseInt(columns, 10) || 3;
    if (col <= 2) {
      return 64;
    }
    if (col === 3) {
      return 52;
    }
    if (col === 4) {
      return 42;
    }
    return 34;
  }

  function writeForm(config) {
    controls.headerTitle.value = config.headerTitle;
    controls.headerColor.value = config.headerColor;
    controls.footerColor.value = config.footerColor;
    controls.panelBackgroundColor.value = config.panelBackgroundColor;
    controls.stampBackgroundColor.value = config.stampBackgroundColor;
    controls.showEmotes.checked = !!config.showEmotes;
    controls.showSubBadges.checked = !!config.showSubBadges;
    controls.showBitsBadges.checked = !!config.showBitsBadges;
    controls.showStampNames.checked = !!config.showStampNames;
    controls.tierOrder.value = config.tierOrder;
    controls.columns.value = String(config.columns);
    controls.emoteSize.value = String(config.emoteSize);
    controls.theme.value = config.theme;
    controls.primaryColor.value = config.primaryColor;
    controls.accentColor.value = config.accentColor;
    controls.backgroundColor.value = config.backgroundColor;
    controls.borderRadius.value = String(config.borderRadius);
    controls.glowIntensity.value = String(config.glowIntensity);
    syncRangeLabels();
  }

  function readForm() {
    var nextConfig = {
      headerTitle: controls.headerTitle.value,
      headerColor: controls.headerColor.value,
      footerColor: controls.footerColor.value,
      panelBackgroundColor: controls.panelBackgroundColor.value,
      stampBackgroundColor: controls.stampBackgroundColor.value,
      showEmotes: controls.showEmotes.checked,
      showSubBadges: controls.showSubBadges.checked,
      showBitsBadges: controls.showBitsBadges.checked,
      showStampNames: controls.showStampNames.checked,
      tierOrder: controls.tierOrder.value,
      columns: parseInt(controls.columns.value, 10),
      emoteSize: parseInt(controls.emoteSize.value, 10),
      theme: controls.theme.value,
      primaryColor: controls.primaryColor.value,
      accentColor: controls.accentColor.value,
      backgroundColor: controls.backgroundColor.value,
      borderRadius: parseInt(controls.borderRadius.value, 10),
      glowIntensity: parseInt(controls.glowIntensity.value, 10)
    };
    return RENDER.normalizeConfig(nextConfig);
  }

  function applyPresetColors(themeKey) {
    var preset = RENDER.themePresets[themeKey];
    if (!preset) {
      return;
    }
    controls.primaryColor.value = preset.primary;
    controls.accentColor.value = preset.accent;
    controls.backgroundColor.value = preset.background;
    controls.headerColor.value = preset.primary;
    controls.footerColor.value = preset.primary;
    controls.panelBackgroundColor.value = preset.background;
    controls.stampBackgroundColor.value = preset.accent;
  }

  function renderPreview() {
    var configForRender = Object.assign({}, state.config, {
      activeTab: state.activeTab,
      enableDragSort: true,
      onTabChange: function (nextTab) {
        state.activeTab = nextTab;
        renderPreview();
      },
      onOrderChange: function (payload) {
        applyOrderChange(payload);
        renderPreview();
        scheduleSave();
      }
    });
    RENDER.render(previewElement, state.data, configForRender);
  }

  function moveIdInList(list, fromId, toId) {
    var items = Array.isArray(list) ? list.slice() : [];
    if (items.indexOf(fromId) < 0) {
      items.push(fromId);
    }
    if (items.indexOf(toId) < 0) {
      items.push(toId);
    }
    var fromIndex = items.indexOf(fromId);
    var toIndex = items.indexOf(toId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      return items;
    }
    items.splice(fromIndex, 1);
    items.splice(toIndex, 0, fromId);
    return items;
  }

  function applyOrderChange(payload) {
    if (!payload || !payload.kind || !payload.fromId || !payload.toId) {
      return;
    }
    var baseOrder = Array.isArray(payload.currentOrder) ? payload.currentOrder : [];

    if (payload.kind === "emotes") {
      var tier = payload.tier || "1000";
      var current = baseOrder.length ? baseOrder : ((state.config.emoteOrderByTier && state.config.emoteOrderByTier[tier]) || []);
      var nextTierOrder = moveIdInList(current, payload.fromId, payload.toId);
      state.config.emoteOrderByTier = Object.assign({}, state.config.emoteOrderByTier, {});
      state.config.emoteOrderByTier[tier] = nextTierOrder;
      return;
    }

    if (payload.kind === "subBadges") {
      state.config.subBadgeOrder = moveIdInList(baseOrder.length ? baseOrder : state.config.subBadgeOrder, payload.fromId, payload.toId);
      return;
    }

    if (payload.kind === "bitsBadges") {
      state.config.bitsBadgeOrder = moveIdInList(baseOrder.length ? baseOrder : state.config.bitsBadgeOrder, payload.fromId, payload.toId);
    }
  }

  function scheduleSave() {
    if (state.saveTimer) {
      clearTimeout(state.saveTimer);
    }
    state.saveTimer = setTimeout(function () {
      saveConfig(false);
    }, 500);
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
    var response = await fetch("https://api.twitch.tv/helix" + path, {
      method: "GET",
      headers: toHeaderMap(state.auth)
    });
    if (!response.ok) {
      var body = await response.text();
      throw new Error("Helix API error: " + response.status + " " + body);
    }
    return response.json();
  }

  function normalizeEmotes(items, responseTemplate) {
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
        images: emote.images || {},
        format: emote.format || [],
        scale: emote.scale || [],
        theme_mode: emote.theme_mode || [],
        template: emote.template || responseTemplate || ""
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

  async function fetchLiveData() {
    if (!state.auth) {
      return;
    }
    var emotesResponse = await callHelix("/chat/emotes?broadcaster_id=" + encodeURIComponent(state.auth.channelId));
    var badgesResponse = await callHelix("/chat/badges?broadcaster_id=" + encodeURIComponent(state.auth.channelId));
    var badges = normalizeBadges(badgesResponse.data);
    state.data = {
      emotesByTier: normalizeEmotes(emotesResponse.data, emotesResponse.template),
      subBadges: badges.subBadges,
      bitsBadges: badges.bitsBadges
    };
  }

  async function saveConfig(manual) {
    try {
      if (window.Twitch && window.Twitch.ext && window.Twitch.ext.configuration) {
        if (!state.auth) {
          state.pendingRemoteSave = true;
          setStatus("Waiting for Twitch authorization to save configuration.", false);
          return;
        }

        var payload = JSON.stringify(pickPersistedConfig(state.config));
        var version = String(Date.now());
        window.Twitch.ext.configuration.set("broadcaster", version, payload);
        state.pendingRemoteSave = false;
      } else {
        setStatus("Local preview mode: configuration is not persisted.", false);
        return;
      }

      setStatus(manual ? "Saved." : "Auto-saved.", false);
    } catch (error) {
      setStatus(error.message || "Failed to save.", true);
    }
  }
  function loadRemoteConfig() {
    if (!window.Twitch || !window.Twitch.ext || !window.Twitch.ext.configuration) {
      return;
    }
    var broadcaster = window.Twitch.ext.configuration.broadcaster;
    var raw = broadcaster && broadcaster.content ? broadcaster.content : "";
    if (!raw) {
      return;
    }
    state.config = parseConfig(raw);
    writeForm(state.config);
  }

  function onFormInput(event) {
    var targetId = event.target && event.target.id ? event.target.id : "";

    if (targetId === "columns") {
      controls.emoteSize.value = String(getRecommendedEmoteSize(controls.columns.value));
    }

    if (targetId === "theme" && controls.theme.value !== "custom") {
      applyPresetColors(controls.theme.value);
    }

    if (targetId === "primaryColor" || targetId === "accentColor" || targetId === "backgroundColor" || targetId === "headerColor" || targetId === "footerColor" || targetId === "panelBackgroundColor" || targetId === "stampBackgroundColor") {
      controls.theme.value = "custom";
    }

    state.config = readForm();
    syncRangeLabels();
    renderPreview();
    scheduleSave();
  }

  function createDemoData() {
    return {
      emotesByTier: {
        "1000": [
          { id: "demo-hi", name: "DemoHi", tier: "1000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_a2f6f67fce8c46ad9f9af4c8ec7dba6d/default/light/3.0" } },
          { id: "demo-nice", name: "DemoNice", tier: "1000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_d4d30d48bb2f4dbe8db6f484f31b4052/default/light/3.0" } },
          { id: "demo-wave", name: "DemoWave", tier: "1000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_62e6f6d3dbe54ca5b6cf5c1b7ece4e90/default/light/3.0" } },
          { id: "demo-cheer", name: "DemoCheer", tier: "1000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_3836d4622ed14c35b7b9ba31989fcb95/default/light/3.0" } },
          { id: "demo-hype", name: "DemoHype", tier: "1000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_71c6ef73d2eb44f39e192f4ca6aeb4c0/default/light/3.0" } },
          { id: "demo-wow", name: "DemoWow", tier: "1000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_1fb7bf8a4d4043d7a8fcebb8f485cb22/default/light/3.0" } }
        ],
        "2000": [
          { id: "demo-love", name: "DemoLove", tier: "2000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_7f5f7e130d48472aa70abf4fcb8915f2/default/light/3.0" } },
          { id: "demo-clap", name: "DemoClap", tier: "2000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_5ca74b0f78544d30bb553f6504f4111d/default/light/3.0" } },
          { id: "demo-fire", name: "DemoFire", tier: "2000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_870273fb2a1f41a6b584598987f58dc4/default/light/3.0" } },
          { id: "demo-heart", name: "DemoHeart", tier: "2000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_df1d47f73ab14f2a8f53951f2f8f4e97/default/light/3.0" } }
        ],
        "3000": [
          { id: "demo-gg", name: "DemoGG", tier: "3000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_2c5b8c398f6f422f9de0b166cdd68f6f/default/light/3.0" } },
          { id: "demo-king", name: "DemoKing", tier: "3000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_bf8087d8bc6046a6a06d2f14ac13d2db/default/light/3.0" } },
          { id: "demo-halo", name: "DemoHalo", tier: "3000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_97de78f7df784c6ab8e8d0ca4a3f2d4c/default/light/3.0" } },
          { id: "demo-max", name: "DemoMax", tier: "3000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_945ec6e9324e4fbe80f9f24f5b17aa73/default/light/3.0" } }
        ]
      },
      subBadges: [
        { id: "1", title: "Subscriber 1", description: "1 month", imageUrl: "https://static-cdn.jtvnw.net/badges/v1/9ba38fd3-bfae-4f87-bd25-4f6c4ddf3f2f/3" },
        { id: "3", title: "Subscriber 3", description: "3 months", imageUrl: "https://static-cdn.jtvnw.net/badges/v1/9550e168-8ccf-4fae-b2d0-11a3f53b829d/3" },
        { id: "6", title: "Subscriber 6", description: "6 months", imageUrl: "https://static-cdn.jtvnw.net/badges/v1/5f13bb5d-83e4-40f8-a55d-4b6e0f0930f8/3" },
        { id: "12", title: "Subscriber 12", description: "12 months", imageUrl: "https://static-cdn.jtvnw.net/badges/v1/20f26d17-6f28-4d7a-9f45-fd98f7f4a26c/3" }
      ],
      bitsBadges: [
        { id: "100", title: "Bits 100", description: "100 bits", imageUrl: "https://static-cdn.jtvnw.net/badges/v1/8d7f4fcf-b3db-49a9-97f8-1de6be8a7fe5/3" },
        { id: "1000", title: "Bits 1000", description: "1000 bits", imageUrl: "https://static-cdn.jtvnw.net/badges/v1/0f7f9c4a-3e7c-4d7e-a413-aec2a3f8b80f/3" },
        { id: "5000", title: "Bits 5000", description: "5000 bits", imageUrl: "https://static-cdn.jtvnw.net/badges/v1/5eff65f4-95b5-4f8f-8fd5-53ee2055ebf3/3" },
        { id: "10000", title: "Bits 10000", description: "10000 bits", imageUrl: "https://static-cdn.jtvnw.net/badges/v1/bf0f89fd-1e7e-444b-8842-93685d2e18ea/3" }
      ]
    };
  }

  function wireEvents() {
    formElement.addEventListener("input", onFormInput);
    controls.saveButton.addEventListener("click", function () {
      state.config = readForm();
      renderPreview();
      saveConfig(true);
    });
    controls.resetButton.addEventListener("click", function () {
      state.config = Object.assign({}, RENDER.defaults);
      state.activeTab = "emotes";
      writeForm(state.config);
      renderPreview();
      saveConfig(true);
    });
  }

  async function initTwitchFlow() {
    if (!window.Twitch || !window.Twitch.ext) {
      setStatus("Running in local preview mode. Configuration is not persisted.", false);
      return;
    }

    if (window.Twitch.ext.configuration && window.Twitch.ext.configuration.onChanged) {
      window.Twitch.ext.configuration.onChanged(function () {
        loadRemoteConfig();
        renderPreview();
        setStatus("Remote config change applied.", false);
      });
    }

    window.Twitch.ext.onAuthorized(async function (auth) {
      state.auth = auth;

      if (state.pendingRemoteSave) {
        await saveConfig(false);
      } else {
        loadRemoteConfig();
      }

      renderPreview();
      setStatus("Authorized. Loading Helix data...", false);

      try {
        await fetchLiveData();
        renderPreview();
        setStatus("Live preview updated.", false);
      } catch (error) {
        setStatus((error && error.message) || "Failed to load Helix data.", true);
      }
    });
  }

  function init() {
    state.config = Object.assign({}, RENDER.defaults);
    writeForm(state.config);
    wireEvents();
    renderPreview();
    setStatus("Ready.", false);
    initTwitchFlow();
  }

  init();
})();

