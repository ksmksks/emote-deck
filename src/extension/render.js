(function (global) {
  "use strict";

  var DEFAULT_CONFIG = {
    showEmotes: true,
    showSubBadges: true,
    showBitsBadges: true,
    tierOrder: "asc",
    columns: 4,
    emoteSize: 56,
    theme: "custom",
    primaryColor: "#1f8ef1",
    accentColor: "#f9c74f",
    backgroundColor: "#111827",
    borderRadius: 12,
    glowIntensity: 12
  };

  var THEME_PRESETS = {
    custom: null,
    ocean: {
      primary: "#00a6fb",
      accent: "#00f5d4",
      background: "#031926"
    },
    sunset: {
      primary: "#ff6b6b",
      accent: "#ffd166",
      background: "#2b1e34"
    },
    forest: {
      primary: "#2a9d8f",
      accent: "#e9c46a",
      background: "#1b4332"
    }
  };

  var TIER_KEYS = ["1000", "2000", "3000"];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function sanitizeColor(value, fallback) {
    return /^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.test(String(value || "")) ? value : fallback;
  }

  function hexToRgba(hex, alpha) {
    var normalized = (hex || "").replace("#", "");
    if (normalized.length === 3) {
      normalized = normalized[0] + normalized[0] + normalized[1] + normalized[1] + normalized[2] + normalized[2];
    }
    if (normalized.length !== 6) {
      return "rgba(255,255,255," + alpha + ")";
    }
    var r = parseInt(normalized.slice(0, 2), 16);
    var g = parseInt(normalized.slice(2, 4), 16);
    var b = parseInt(normalized.slice(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeConfig(rawConfig) {
    var cfg = Object.assign({}, DEFAULT_CONFIG, rawConfig || {});

    cfg.showEmotes = cfg.showEmotes !== false;
    cfg.showSubBadges = cfg.showSubBadges !== false;
    cfg.showBitsBadges = cfg.showBitsBadges !== false;

    cfg.tierOrder = cfg.tierOrder === "desc" ? "desc" : "asc";
    cfg.columns = clamp(parseInt(cfg.columns, 10) || DEFAULT_CONFIG.columns, 2, 8);
    cfg.emoteSize = clamp(parseInt(cfg.emoteSize, 10) || DEFAULT_CONFIG.emoteSize, 32, 112);
    cfg.borderRadius = clamp(parseInt(cfg.borderRadius, 10) || DEFAULT_CONFIG.borderRadius, 0, 24);
    cfg.glowIntensity = clamp(parseInt(cfg.glowIntensity, 10) || DEFAULT_CONFIG.glowIntensity, 0, 32);

    if (!THEME_PRESETS[cfg.theme] && cfg.theme !== "custom") {
      cfg.theme = "custom";
    }

    cfg.primaryColor = sanitizeColor(cfg.primaryColor, DEFAULT_CONFIG.primaryColor);
    cfg.accentColor = sanitizeColor(cfg.accentColor, DEFAULT_CONFIG.accentColor);
    cfg.backgroundColor = sanitizeColor(cfg.backgroundColor, DEFAULT_CONFIG.backgroundColor);
    cfg.activeTab = ["emotes", "subBadges", "bitsBadges"].indexOf(cfg.activeTab) >= 0 ? cfg.activeTab : "emotes";

    return cfg;
  }

  function normalizeData(rawData) {
    var model = {
      emotesByTier: {
        "1000": [],
        "2000": [],
        "3000": []
      },
      subBadges: [],
      bitsBadges: []
    };

    if (!rawData || typeof rawData !== "object") {
      return model;
    }

    if (rawData.emotesByTier) {
      TIER_KEYS.forEach(function (tier) {
        var list = rawData.emotesByTier[tier] || [];
        model.emotesByTier[tier] = Array.isArray(list) ? list : [];
      });
    } else if (Array.isArray(rawData.emotes)) {
      rawData.emotes.forEach(function (emote) {
        var tier = String(emote.tier || "");
        if (model.emotesByTier[tier]) {
          model.emotesByTier[tier].push(emote);
        }
      });
    }

    model.subBadges = Array.isArray(rawData.subBadges) ? rawData.subBadges : [];
    model.bitsBadges = Array.isArray(rawData.bitsBadges) ? rawData.bitsBadges : [];
    return model;
  }

  function resolveTheme(cfg) {
    var preset = THEME_PRESETS[cfg.theme];
    if (preset) {
      return preset;
    }
    return {
      primary: cfg.primaryColor,
      accent: cfg.accentColor,
      background: cfg.backgroundColor
    };
  }

  function applyThemeVariables(cfg) {
    var theme = resolveTheme(cfg);
    var root = document.documentElement;

    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--background", theme.background);
    root.style.setProperty("--radius", cfg.borderRadius + "px");
    root.style.setProperty("--glow", cfg.glowIntensity + "px");
    root.style.setProperty("--glow-color", hexToRgba(theme.accent, 0.35));
  }

  function getEnabledTabs(cfg) {
    var tabs = [];
    if (cfg.showEmotes) {
      tabs.push({ id: "emotes", label: "Emotes" });
    }
    if (cfg.showSubBadges) {
      tabs.push({ id: "subBadges", label: "Subscriber Badges" });
    }
    if (cfg.showBitsBadges) {
      tabs.push({ id: "bitsBadges", label: "Bits Badges" });
    }
    return tabs;
  }

  function pickImage(images, fallback) {
    if (images && typeof images === "object") {
      return images.url_4x || images.url_2x || images.url_1x || fallback || "";
    }
    return fallback || "";
  }

  function renderEmptyState(message) {
    return '<div class="ed-empty">' + escapeHtml(message) + "</div>";
  }

  function renderEmotes(model, cfg) {
    var tierOrder = cfg.tierOrder === "desc" ? ["3000", "2000", "1000"] : ["1000", "2000", "3000"];
    var tierNames = { "1000": "Tier 1000", "2000": "Tier 2000", "3000": "Tier 3000" };
    var html = "";
    var total = 0;

    tierOrder.forEach(function (tier) {
      var emotes = model.emotesByTier[tier] || [];
      total += emotes.length;
      html += '<section class="ed-tier">';
      html += '<h3 class="ed-tier-title">' + tierNames[tier] + "</h3>";
      if (!emotes.length) {
        html += renderEmptyState("No emotes in this tier.");
      } else {
        html += '<div class="ed-grid">';
        emotes.forEach(function (emote) {
          var imageUrl = pickImage(emote.images, emote.imageUrl);
          var emoteName = escapeHtml(emote.name || emote.id || "emote");
          html += '<article class="ed-item ed-item--emote">';
          html += '<img class="ed-image" src="' + escapeHtml(imageUrl) + '" alt="' + emoteName + '" loading="lazy">';
          html += '<p class="ed-label">' + emoteName + "</p>";
          html += "</article>";
        });
        html += "</div>";
      }
      html += "</section>";
    });

    if (!total) {
      return renderEmptyState("No subscriber emotes found.");
    }
    return html;
  }

  function renderBadges(list, emptyMessage) {
    if (!list.length) {
      return renderEmptyState(emptyMessage);
    }

    var html = '<div class="ed-grid">';
    list.forEach(function (badge) {
      var title = escapeHtml(badge.title || badge.id || "badge");
      var desc = escapeHtml(badge.description || "");
      var imageUrl = escapeHtml(badge.imageUrl || "");
      html += '<article class="ed-item">';
      html += '<img class="ed-image" src="' + imageUrl + '" alt="' + title + '" loading="lazy">';
      html += '<p class="ed-label">' + title + "</p>";
      if (desc) {
        html += '<p class="ed-meta">' + desc + "</p>";
      }
      html += "</article>";
    });
    html += "</div>";
    return html;
  }

  function render(container, rawData, rawConfig) {
    if (!container) {
      return;
    }

    var cfg = normalizeConfig(rawConfig);
    var model = normalizeData(rawData);
    applyThemeVariables(cfg);

    container.style.setProperty("--columns", String(cfg.columns));
    container.style.setProperty("--emote-size", cfg.emoteSize + "px");

    var tabs = getEnabledTabs(cfg);
    if (!tabs.length) {
      container.innerHTML = '<section class="ed-shell">' +
        '<header class="ed-header"><h2 class="ed-title">EmoteDeck</h2></header>' +
        renderEmptyState("All categories are OFF. Enable at least one in Config.") +
        "</section>";
      return;
    }

    var activeTab = tabs.some(function (tab) { return tab.id === cfg.activeTab; }) ? cfg.activeTab : tabs[0].id;
    var panelHtml = "";

    if (activeTab === "emotes") {
      panelHtml = renderEmotes(model, cfg);
    } else if (activeTab === "subBadges") {
      panelHtml = renderBadges(model.subBadges, "No subscriber badges found.");
    } else {
      panelHtml = renderBadges(model.bitsBadges, "No bits badges found.");
    }

    container.innerHTML = '<section class="ed-shell">' +
      '<header class="ed-header">' +
      '<h2 class="ed-title">EmoteDeck</h2>' +
      '<p class="ed-subtitle">Twitch channel rewards</p>' +
      "</header>" +
      '<nav class="ed-tabs" role="tablist">' +
      tabs.map(function (tab) {
        var activeClass = tab.id === activeTab ? "is-active" : "";
        return '<button class="ed-tab ' + activeClass + '" type="button" data-ed-tab="' + tab.id + '">' +
          escapeHtml(tab.label) +
          "</button>";
      }).join("") +
      "</nav>" +
      '<section class="section" data-ed-panel="active">' + panelHtml + "</section>" +
      "</section>";

    Array.prototype.forEach.call(container.querySelectorAll("[data-ed-tab]"), function (button) {
      button.addEventListener("click", function () {
        var nextTab = button.getAttribute("data-ed-tab");
        if (typeof cfg.onTabChange === "function") {
          cfg.onTabChange(nextTab);
        }
        if (typeof CustomEvent === "function") {
          container.dispatchEvent(new CustomEvent("emotedeck:tabchange", { detail: { tab: nextTab } }));
        }
      });
    });
  }

  global.EmoteDeckRender = {
    render: render,
    defaults: clone(DEFAULT_CONFIG),
    themePresets: clone(THEME_PRESETS),
    normalizeConfig: normalizeConfig
  };
})(window);
