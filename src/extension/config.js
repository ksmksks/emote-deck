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
    "showEmotes",
    "showSubBadges",
    "showBitsBadges",
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

  var LOCAL_STORAGE_KEY = "emotedeck-config-local";

  var controls = {
    showEmotes: document.getElementById("showEmotes"),
    showSubBadges: document.getElementById("showSubBadges"),
    showBitsBadges: document.getElementById("showBitsBadges"),
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
    saveTimer: null
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

  function loadLocalConfig() {
    var raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return Object.assign({}, RENDER.defaults);
    }
    return parseConfig(raw);
  }

  function saveLocalConfig() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(pickPersistedConfig(state.config)));
  }

  function syncRangeLabels() {
    controls.columnsValue.textContent = controls.columns.value;
    controls.emoteSizeValue.textContent = controls.emoteSize.value;
    controls.borderRadiusValue.textContent = controls.borderRadius.value;
    controls.glowIntensityValue.textContent = controls.glowIntensity.value;
  }

  function writeForm(config) {
    controls.showEmotes.checked = !!config.showEmotes;
    controls.showSubBadges.checked = !!config.showSubBadges;
    controls.showBitsBadges.checked = !!config.showBitsBadges;
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
      showEmotes: controls.showEmotes.checked,
      showSubBadges: controls.showSubBadges.checked,
      showBitsBadges: controls.showBitsBadges.checked,
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
  }

  function renderPreview() {
    var configForRender = Object.assign({}, state.config, {
      activeTab: state.activeTab,
      onTabChange: function (nextTab) {
        state.activeTab = nextTab;
        renderPreview();
      }
    });
    RENDER.render(previewElement, state.data, configForRender);
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

  async function fetchLiveData() {
    if (!state.auth) {
      return;
    }
    var emotesResponse = await callHelix("/chat/emotes?broadcaster_id=" + encodeURIComponent(state.auth.channelId));
    var badgesResponse = await callHelix("/chat/badges?broadcaster_id=" + encodeURIComponent(state.auth.channelId));
    var badges = normalizeBadges(badgesResponse.data);
    state.data = {
      emotesByTier: normalizeEmotes(emotesResponse.data),
      subBadges: badges.subBadges,
      bitsBadges: badges.bitsBadges
    };
  }

  async function saveConfig(manual) {
    try {
      saveLocalConfig();

      if (window.Twitch && window.Twitch.ext && window.Twitch.ext.configuration && state.auth) {
        var payload = JSON.stringify(pickPersistedConfig(state.config));
        window.Twitch.ext.configuration.set("broadcaster", "1", payload);
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

    if (targetId === "theme" && controls.theme.value !== "custom") {
      applyPresetColors(controls.theme.value);
    }

    if (targetId === "primaryColor" || targetId === "accentColor" || targetId === "backgroundColor") {
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
          { id: "demo-nice", name: "DemoNice", tier: "1000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_d4d30d48bb2f4dbe8db6f484f31b4052/default/light/3.0" } }
        ],
        "2000": [
          { id: "demo-love", name: "DemoLove", tier: "2000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_7f5f7e130d48472aa70abf4fcb8915f2/default/light/3.0" } }
        ],
        "3000": [
          { id: "demo-gg", name: "DemoGG", tier: "3000", images: { url_4x: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_2c5b8c398f6f422f9de0b166cdd68f6f/default/light/3.0" } }
        ]
      },
      subBadges: [
        { id: "1", title: "Subscriber 1", description: "1 month", imageUrl: "https://static-cdn.jtvnw.net/badges/v1/9ba38fd3-bfae-4f87-bd25-4f6c4ddf3f2f/3" }
      ],
      bitsBadges: [
        { id: "100", title: "Bits 100", description: "100 bits", imageUrl: "https://static-cdn.jtvnw.net/badges/v1/8d7f4fcf-b3db-49a9-97f8-1de6be8a7fe5/3" }
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
      setStatus("Running in local mode outside Twitch.", false);
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
      loadRemoteConfig();
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
    state.config = loadLocalConfig();
    writeForm(state.config);
    wireEvents();
    renderPreview();
    setStatus("Ready.", false);
    initTwitchFlow();
  }

  init();
})();
