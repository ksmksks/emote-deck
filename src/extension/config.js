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
    "followerEmoteOrder",
    "cheermoteOrder",
    "subBadgeOrder",
    "bitsBadgeOrder",
    "showEmotes",
    "showBadges",
    "showFollowerStamps",
    "showTier1000",
    "showTier2000",
    "showTier3000",
    "showCheermotes",
    "showSubBadges",
    "showBitsBadges",
    "showEmoteNames",
    "showBadgeNames",
    "emoteNameSize",
    "badgeNameSize",
    "showHoverTooltip",
    "enableStampNameCopy",
    "fontFamily",
    "hiddenStampIds",
    "emoteSectionOrder",
    "columns",
    "emoteSize",
    "itemPadding",
    "itemGap",
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
    showBadges: document.getElementById("showBadges"),
    showFollowerStamps: document.getElementById("showFollowerStamps"),
    showTier1000: document.getElementById("showTier1000"),
    showTier2000: document.getElementById("showTier2000"),
    showTier3000: document.getElementById("showTier3000"),
    showCheermotes: document.getElementById("showCheermotes"),
    emoteVisibilityChildren: document.getElementById("emoteVisibilityChildren"),
    badgesVisibilityChildren: document.getElementById("badgesVisibilityChildren"),
    showSubBadges: document.getElementById("showSubBadges"),
    showBitsBadges: document.getElementById("showBitsBadges"),
    showEmoteNames: document.getElementById("showEmoteNames"),
    showBadgeNames: document.getElementById("showBadgeNames"),
    emoteNameSize: document.getElementById("emoteNameSize"),
    badgeNameSize: document.getElementById("badgeNameSize"),
    showHoverTooltip: document.getElementById("showHoverTooltip"),
    enableStampNameCopy: document.getElementById("enableStampNameCopy"),
    fontFamily: document.getElementById("fontFamily"),
    stampToggleList: document.getElementById("stampToggleList"),
    columns: document.getElementById("columns"),
    emoteSize: document.getElementById("emoteSize"),
    itemPadding: document.getElementById("itemPadding"),
    itemGap: document.getElementById("itemGap"),
    theme: document.getElementById("theme"),
    primaryColor: document.getElementById("primaryColor"),
    accentColor: document.getElementById("accentColor"),
    backgroundColor: document.getElementById("backgroundColor"),
    borderRadius: document.getElementById("borderRadius"),
    glowIntensity: document.getElementById("glowIntensity"),
    columnsValue: document.getElementById("columnsValue"),
    emoteSizeValue: document.getElementById("emoteSizeValue"),
    emoteNameSizeValue: document.getElementById("emoteNameSizeValue"),
    badgeNameSizeValue: document.getElementById("badgeNameSizeValue"),
    itemPaddingValue: document.getElementById("itemPaddingValue"),
    itemGapValue: document.getElementById("itemGapValue"),
    borderRadiusValue: document.getElementById("borderRadiusValue"),
    glowIntensityValue: document.getElementById("glowIntensityValue"),
    saveButton: document.getElementById("save-button"),
    resetButton: document.getElementById("reset-button")
  };

  var state = {
    auth: null,
    config: Object.assign({}, RENDER.defaults),
    data: createEmptyData(),
    activeTab: "emotes",
    saveTimer: null,
    pendingRemoteSave: false,
    maxColumnsFit: 8
  };

  function setStatus(message, isError) {
    statusElement.textContent = message;
    statusElement.classList.toggle("is-error", !!isError);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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
    var currentColumns = parseInt(controls.columns.value, 10) || 1;
    var maxColumns = parseInt(controls.columns.max, 10) || 8;
    controls.columnsValue.textContent = maxColumns < 8 ? (currentColumns + " / " + maxColumns) : String(currentColumns);
    controls.emoteSizeValue.textContent = controls.emoteSize.value + "%";
    controls.emoteNameSizeValue.textContent = controls.emoteNameSize.value;
    controls.badgeNameSizeValue.textContent = controls.badgeNameSize.value;
    controls.itemPaddingValue.textContent = controls.itemPadding.value;
    controls.itemGapValue.textContent = controls.itemGap.value;
    controls.borderRadiusValue.textContent = controls.borderRadius.value;
    controls.glowIntensityValue.textContent = controls.glowIntensity.value;
  }

  function writeForm(config) {
    controls.headerTitle.value = config.headerTitle;
    controls.headerColor.value = config.headerColor;
    controls.footerColor.value = config.footerColor;
    controls.panelBackgroundColor.value = config.panelBackgroundColor;
    controls.stampBackgroundColor.value = config.stampBackgroundColor;
    controls.showEmotes.checked = !!config.showEmotes;
    controls.showBadges.checked = !!config.showBadges;
    controls.showFollowerStamps.checked = !!config.showFollowerStamps;
    controls.showTier1000.checked = !!config.showTier1000;
    controls.showTier2000.checked = !!config.showTier2000;
    controls.showTier3000.checked = !!config.showTier3000;
    controls.showCheermotes.checked = !!config.showCheermotes;
    controls.showSubBadges.checked = !!config.showSubBadges;
    controls.showBitsBadges.checked = !!config.showBitsBadges;
    controls.showEmoteNames.checked = !!config.showEmoteNames;
    controls.showBadgeNames.checked = !!config.showBadgeNames;
    controls.emoteNameSize.value = String(config.emoteNameSize);
    controls.badgeNameSize.value = String(config.badgeNameSize);
    controls.showHoverTooltip.checked = !!config.showHoverTooltip;
    controls.enableStampNameCopy.checked = !!config.enableStampNameCopy;
    controls.fontFamily.value = config.fontFamily;
    controls.columns.max = "8";
    controls.columns.value = String(config.columns);
    controls.emoteSize.value = String(config.emoteSize);
    controls.itemPadding.value = String(config.itemPadding);
    controls.itemGap.value = String(config.itemGap);
    controls.theme.value = config.theme;
    controls.primaryColor.value = config.primaryColor;
    controls.accentColor.value = config.accentColor;
    controls.backgroundColor.value = config.backgroundColor;
    controls.borderRadius.value = String(config.borderRadius);
    controls.glowIntensity.value = String(config.glowIntensity);
    syncRangeLabels();
    syncVisibilityControls();
  }

  function readForm() {
    var nextConfig = Object.assign({}, state.config, {
      headerTitle: controls.headerTitle.value,
      headerColor: controls.headerColor.value,
      footerColor: controls.footerColor.value,
      panelBackgroundColor: controls.panelBackgroundColor.value,
      stampBackgroundColor: controls.stampBackgroundColor.value,
      showEmotes: controls.showEmotes.checked,
      showBadges: controls.showBadges.checked,
      showFollowerStamps: controls.showFollowerStamps.checked,
      showTier1000: controls.showTier1000.checked,
      showTier2000: controls.showTier2000.checked,
      showTier3000: controls.showTier3000.checked,
      showCheermotes: controls.showCheermotes.checked,
      showSubBadges: controls.showSubBadges.checked,
      showBitsBadges: controls.showBitsBadges.checked,
      showEmoteNames: controls.showEmoteNames.checked,
      showBadgeNames: controls.showBadgeNames.checked,
      emoteNameSize: parseInt(controls.emoteNameSize.value, 10),
      badgeNameSize: parseInt(controls.badgeNameSize.value, 10),
      showHoverTooltip: controls.showHoverTooltip.checked,
      enableStampNameCopy: controls.enableStampNameCopy.checked,
      fontFamily: controls.fontFamily.value,
      columns: parseInt(controls.columns.value, 10),
      emoteSize: parseInt(controls.emoteSize.value, 10),
      itemPadding: parseInt(controls.itemPadding.value, 10),
      itemGap: parseInt(controls.itemGap.value, 10),
      theme: controls.theme.value,
      primaryColor: controls.primaryColor.value,
      accentColor: controls.accentColor.value,
      backgroundColor: controls.backgroundColor.value,
      borderRadius: parseInt(controls.borderRadius.value, 10),
      glowIntensity: parseInt(controls.glowIntensity.value, 10)
    });
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
    function createRenderConfig() {
      return Object.assign({}, state.config, {
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
    }

    function syncColumnsConstraintFromPreview() {
      var rawFit = previewElement && previewElement.style ? previewElement.style.getPropertyValue("--max-columns-fit") : "";
      var fit = parseInt(rawFit, 10);
      if (!fit || isNaN(fit)) {
        fit = 8;
      }
      fit = Math.max(1, Math.min(8, fit));
      state.maxColumnsFit = fit;
      controls.columns.max = String(fit);
      var current = parseInt(controls.columns.value, 10) || 1;
      if (current > fit) {
        controls.columns.value = String(fit);
        state.config = RENDER.normalizeConfig(Object.assign({}, state.config, { columns: fit }));
        return true;
      }
      return false;
    }

    var configForRender = createRenderConfig();
    RENDER.render(previewElement, state.data, configForRender);
    if (syncColumnsConstraintFromPreview()) {
      RENDER.render(previewElement, state.data, createRenderConfig());
      syncColumnsConstraintFromPreview();
    }
    syncRangeLabels();
    renderStampToggleList();
  }

  function syncVisibilityControls() {
    var emotesEnabled = !!controls.showEmotes.checked;
    var emoteChildren = [
      controls.showFollowerStamps,
      controls.showTier1000,
      controls.showTier2000,
      controls.showTier3000,
      controls.showCheermotes
    ];

    emoteChildren.forEach(function (input) {
      if (input) {
        input.disabled = !emotesEnabled;
      }
    });

    if (controls.emoteVisibilityChildren) {
      controls.emoteVisibilityChildren.classList.toggle("is-disabled", !emotesEnabled);
    }

    var badgesEnabled = !!controls.showBadges.checked;
    var badgeChildren = [
      controls.showSubBadges,
      controls.showBitsBadges
    ];

    badgeChildren.forEach(function (input) {
      if (input) {
        input.disabled = !badgesEnabled;
      }
    });

    if (controls.badgesVisibilityChildren) {
      controls.badgesVisibilityChildren.classList.toggle("is-disabled", !badgesEnabled);
    }
  }

  function getHiddenStampIds() {
    return (state.config && state.config.hiddenStampIds) || {};
  }

  function isStampVisible(kind, tier, itemId) {
    var key = "";
    if (kind === "emotes") {
      key = "emotes" + String(tier || "");
    } else if (kind === "followerStamps") {
      key = "followerStamps";
    } else if (kind === "cheerStamps") {
      key = "cheerStamps";
    } else if (kind === "subBadges") {
      key = "subBadges";
    } else if (kind === "bitsBadges") {
      key = "bitsBadges";
    }
    if (!key) {
      return true;
    }
    var hidden = getHiddenStampIds()[key] || [];
    return hidden.indexOf(String(itemId)) < 0;
  }

  function toToggleGroup(title, items, kind, tier) {
    if (!items.length) {
      return "";
    }

    var body = items.map(function (item) {
      var id = String((item && (item.id || item.name)) || "");
      var label = String((item && (item.name || item.title || item.id)) || id);
      var checked = isStampVisible(kind, tier, id) ? " checked" : "";
      var tierAttr = tier ? ' data-stamp-tier="' + escapeHtml(tier) + '"' : "";
      return '<label class="stamp-toggle-item">' +
        '<input type="checkbox" data-stamp-toggle="1" data-stamp-kind="' + escapeHtml(kind) + '"' + tierAttr + ' data-stamp-id="' + escapeHtml(id) + '"' + checked + ">" +
        "<span>" + escapeHtml(label) + "</span>" +
        "</label>";
    }).join("");

    return '<section class="stamp-toggle-group">' +
      '<h3 class="stamp-toggle-title">' + escapeHtml(title) + "</h3>" +
      '<div class="stamp-toggle-items">' + body + "</div>" +
      "</section>";
  }

  function renderStampToggleList() {
    if (!controls.stampToggleList) {
      return;
    }
    var model = state.data || {};
    var groups = [];

    if (state.config.showEmotes) {
      var sectionOrder = Array.isArray(state.config.emoteSectionOrder) ? state.config.emoteSectionOrder : ["follower", "1000", "2000", "3000", "cheer"];
      sectionOrder.forEach(function (sectionId) {
        if (sectionId === "follower") {
          if (state.config.showFollowerStamps) {
            groups.push(toToggleGroup("Follower", model.followerEmotes || [], "followerStamps", ""));
          }
          return;
        }
        if (sectionId === "cheer") {
          if (state.config.showCheermotes) {
            groups.push(toToggleGroup("Cheermotes", model.cheerEmotes || [], "cheerStamps", ""));
          }
          return;
        }
        if (sectionId === "1000" && state.config.showTier1000) {
          groups.push(toToggleGroup("Tier 1", ((model.emotesByTier || {})["1000"]) || [], "emotes", "1000"));
        } else if (sectionId === "2000" && state.config.showTier2000) {
          groups.push(toToggleGroup("Tier 2", ((model.emotesByTier || {})["2000"]) || [], "emotes", "2000"));
        } else if (sectionId === "3000" && state.config.showTier3000) {
          groups.push(toToggleGroup("Tier 3", ((model.emotesByTier || {})["3000"]) || [], "emotes", "3000"));
        }
      });
    }

    if (state.config.showBadges) {
      if (state.config.showSubBadges) {
        groups.push(toToggleGroup("Subscriber Badges", model.subBadges || [], "subBadges", ""));
      }
      if (state.config.showBitsBadges) {
        groups.push(toToggleGroup("Bits Badges", model.bitsBadges || [], "bitsBadges", ""));
      }
    }

    var html = groups.filter(Boolean).join("");
    controls.stampToggleList.innerHTML = html || '<p class="stamp-toggle-note">No stamps available yet.</p>';
  }

  function updateHiddenStampIdsFromToggle(target) {
    var kind = target.getAttribute("data-stamp-kind") || "";
    var tier = target.getAttribute("data-stamp-tier") || "";
    var itemId = target.getAttribute("data-stamp-id") || "";
    if (!kind || !itemId) {
      return;
    }

    var hiddenMap = Object.assign({}, getHiddenStampIds());
    var key = "";
    if (kind === "emotes") {
      key = "emotes" + tier;
    } else if (kind === "followerStamps") {
      key = "followerStamps";
    } else if (kind === "cheerStamps") {
      key = "cheerStamps";
    } else if (kind === "subBadges") {
      key = "subBadges";
    } else if (kind === "bitsBadges") {
      key = "bitsBadges";
    }
    if (!key) {
      return;
    }

    var nextList = Array.isArray(hiddenMap[key]) ? hiddenMap[key].slice() : [];
    var index = nextList.indexOf(itemId);
    if (target.checked) {
      if (index >= 0) {
        nextList.splice(index, 1);
      }
    } else if (index < 0) {
      nextList.push(itemId);
    }

    hiddenMap[key] = nextList;
    state.config = RENDER.normalizeConfig(Object.assign({}, state.config, {
      hiddenStampIds: hiddenMap
    }));
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

    if (payload.kind === "emoteSections") {
      state.config.emoteSectionOrder = moveIdInList(baseOrder.length ? baseOrder : state.config.emoteSectionOrder, payload.fromId, payload.toId);
      return;
    }

    if (payload.kind === "subBadges") {
      state.config.subBadgeOrder = moveIdInList(baseOrder.length ? baseOrder : state.config.subBadgeOrder, payload.fromId, payload.toId);
      return;
    }

    if (payload.kind === "followerStamps") {
      state.config.followerEmoteOrder = moveIdInList(baseOrder.length ? baseOrder : state.config.followerEmoteOrder, payload.fromId, payload.toId);
      return;
    }

    if (payload.kind === "cheerStamps") {
      state.config.cheermoteOrder = moveIdInList(baseOrder.length ? baseOrder : state.config.cheermoteOrder, payload.fromId, payload.toId);
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

  async function fetchLiveData() {
    if (!state.auth) {
      return;
    }
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
    if (event.target && event.target.getAttribute("data-stamp-toggle") === "1") {
      updateHiddenStampIdsFromToggle(event.target);
      renderPreview();
      scheduleSave();
      return;
    }

    var targetId = event.target && event.target.id ? event.target.id : "";

    if (targetId === "theme" && controls.theme.value !== "custom") {
      applyPresetColors(controls.theme.value);
    }

    if (targetId === "primaryColor" || targetId === "accentColor" || targetId === "backgroundColor" || targetId === "headerColor" || targetId === "footerColor" || targetId === "panelBackgroundColor" || targetId === "stampBackgroundColor") {
      controls.theme.value = "custom";
    }

    state.config = readForm();
    syncVisibilityControls();
    syncRangeLabels();
    renderPreview();
    scheduleSave();
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
          { id: "demo-cheer", name: "DemoCheer", tier: "1000", images: demoStampImage("demo-cheer.svg") },
          { id: "demo-hype", name: "DemoHype", tier: "1000", images: demoStampImage("demo-hype.svg") },
          { id: "demo-wow", name: "DemoWow", tier: "1000", images: demoStampImage("demo-wow.svg") }
        ],
        "2000": [
          { id: "demo-love", name: "DemoLove", tier: "2000", images: demoStampImage("demo-love.svg") },
          { id: "demo-clap", name: "DemoClap", tier: "2000", images: demoStampImage("demo-clap.svg") },
          { id: "demo-fire", name: "DemoFire", tier: "2000", images: demoStampImage("demo-fire.svg") },
          { id: "demo-heart", name: "DemoHeart", tier: "2000", images: demoStampImage("demo-heart.svg") }
        ],
        "3000": [
          { id: "demo-gg", name: "DemoGG", tier: "3000", images: demoStampImage("demo-gg.svg") },
          { id: "demo-king", name: "DemoKing", tier: "3000", images: demoStampImage("demo-king.svg") },
          { id: "demo-halo", name: "DemoHalo", tier: "3000", images: demoStampImage("demo-halo.svg") },
          { id: "demo-max", name: "DemoMax", tier: "3000", images: demoStampImage("demo-max.svg") }
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
        { id: "cheer-1000", name: "Cheer 1000", imageUrl: demoBadgeImage("bits-5000.svg") },
        { id: "cheer-5000", name: "Cheer 5000", imageUrl: demoBadgeImage("bits-10000.svg") }
      ],
      subBadges: [
        { id: "1", title: "Subscriber 1", description: "1 month", imageUrl: demoBadgeImage("sub-1.svg") },
        { id: "3", title: "Subscriber 3", description: "3 months", imageUrl: demoBadgeImage("sub-3.svg") },
        { id: "6", title: "Subscriber 6", description: "6 months", imageUrl: demoBadgeImage("sub-6.svg") },
        { id: "12", title: "Subscriber 12", description: "12 months", imageUrl: demoBadgeImage("sub-12.svg") }
      ],
      bitsBadges: [
        { id: "100", title: "Bits 100", description: "100 bits", imageUrl: demoBadgeImage("bits-100.svg") },
        { id: "1000", title: "Bits 1000", description: "1000 bits", imageUrl: demoBadgeImage("bits-1000.svg") },
        { id: "5000", title: "Bits 5000", description: "5000 bits", imageUrl: demoBadgeImage("bits-5000.svg") },
        { id: "10000", title: "Bits 10000", description: "10000 bits", imageUrl: demoBadgeImage("bits-10000.svg") }
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
      state.data = createDemoData();
      renderPreview();
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
    window.addEventListener("resize", renderPreview);
    state.data = createEmptyData();
    renderPreview();
    setStatus("Waiting for Twitch authorization...", false);
    initTwitchFlow();
  }

  init();
})();

