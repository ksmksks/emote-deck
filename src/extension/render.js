(function (global) {
  "use strict";

  var DEFAULT_CONFIG = {
    showEmotes: true,
    showFollowerStamps: true,
    showTier1000: true,
    showTier2000: true,
    showTier3000: true,
    showSubBadges: true,
    showBitsBadges: true,
    showStampNames: true,
    headerTitle: "EmoteDeck",
    headerColor: "#1b3f5f",
    footerColor: "#4a2746",
    panelBackgroundColor: "#101626",
    stampBackgroundColor: "#141d31",
    emoteOrderByTier: {
      "1000": [],
      "2000": [],
      "3000": []
    },
    followerEmoteOrder: [],
    subBadgeOrder: [],
    bitsBadgeOrder: [],
    hiddenStampIds: {
      emotes1000: [],
      emotes2000: [],
      emotes3000: [],
      followerStamps: [],
      subBadges: [],
      bitsBadges: []
    },
    emoteSectionOrder: ["follower", "1000", "2000", "3000"],
    columns: 3,
    emoteSize: 84,
    itemPadding: 10,
    itemGap: 8,
    theme: "custom",
    primaryColor: "#f06d9a",
    accentColor: "#6cc7ef",
    backgroundColor: "#232531",
    borderRadius: 12,
    glowIntensity: 20
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
    },
    blush: {
      primary: "#e56aa6",
      accent: "#ffc8dd",
      background: "#fff7fb"
    }
  };

  var TIER_KEYS = ["1000", "2000", "3000"];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function parseIntOrDefault(value, fallback) {
    var n = parseInt(value, 10);
    return isNaN(n) ? fallback : n;
  }

  function normalizeIdList(list) {
    if (!Array.isArray(list)) {
      return [];
    }
    var map = Object.create(null);
    var out = [];
    list.forEach(function (item) {
      var key = String(item || "").trim();
      if (!key || map[key]) {
        return;
      }
      map[key] = true;
      out.push(key);
    });
    return out;
  }

  function normalizeOrderByTier(raw) {
    var src = raw && typeof raw === "object" ? raw : {};
    return {
      "1000": normalizeIdList(src["1000"]),
      "2000": normalizeIdList(src["2000"]),
      "3000": normalizeIdList(src["3000"])
    };
  }

  function normalizeSectionOrder(raw) {
    var allowed = ["follower", "1000", "2000", "3000"];
    if (!Array.isArray(raw)) {
      return allowed.slice();
    }
    var seen = Object.create(null);
    var out = [];
    raw.forEach(function (item) {
      var key = String(item || "");
      if (allowed.indexOf(key) < 0 || seen[key]) {
        return;
      }
      seen[key] = true;
      out.push(key);
    });
    allowed.forEach(function (key) {
      if (!seen[key]) {
        out.push(key);
      }
    });
    return out;
  }

  function normalizeHiddenStampIds(raw) {
    var src = raw && typeof raw === "object" ? raw : {};
    return {
      emotes1000: normalizeIdList(src.emotes1000),
      emotes2000: normalizeIdList(src.emotes2000),
      emotes3000: normalizeIdList(src.emotes3000),
      followerStamps: normalizeIdList(src.followerStamps),
      subBadges: normalizeIdList(src.subBadges),
      bitsBadges: normalizeIdList(src.bitsBadges)
    };
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

  function hexToRgb(hex) {
    var normalized = (hex || "").replace("#", "");
    if (normalized.length === 3) {
      normalized = normalized[0] + normalized[0] + normalized[1] + normalized[1] + normalized[2] + normalized[2];
    }
    if (normalized.length !== 6) {
      return null;
    }
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16)
    };
  }

  function colorLuma(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) {
      return null;
    }
    return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  }

  function mixHex(colorA, colorB, amount, alpha) {
    var a = hexToRgb(colorA);
    var b = hexToRgb(colorB);
    if (!a || !b) {
      return hexToRgba(colorA, typeof alpha === "number" ? alpha : 1);
    }
    var t = clamp(Number(amount), 0, 1);
    var r = Math.round(a.r + (b.r - a.r) * t);
    var g = Math.round(a.g + (b.g - a.g) * t);
    var b2 = Math.round(a.b + (b.b - a.b) * t);
    var a2 = typeof alpha === "number" ? clamp(alpha, 0, 1) : 1;
    return "rgba(" + r + "," + g + "," + b2 + "," + a2 + ")";
  }

  function getContrastingTextColor(hex) {
    var luma = colorLuma(hex);
    if (luma === null) {
      return "#1f2330";
    }
    return luma > 0.62 ? "#1f2330" : "#f8fafc";
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
    cfg.showFollowerStamps = cfg.showFollowerStamps !== false;
    cfg.showTier1000 = cfg.showTier1000 !== false;
    cfg.showTier2000 = cfg.showTier2000 !== false;
    cfg.showTier3000 = cfg.showTier3000 !== false;
    cfg.showSubBadges = cfg.showSubBadges !== false;
    cfg.showBitsBadges = cfg.showBitsBadges !== false;
    cfg.showStampNames = cfg.showStampNames !== false;
    cfg.headerTitle = String(cfg.headerTitle || DEFAULT_CONFIG.headerTitle).trim().slice(0, 48) || DEFAULT_CONFIG.headerTitle;

    cfg.columns = clamp(parseIntOrDefault(cfg.columns, DEFAULT_CONFIG.columns), 1, 8);
    cfg.emoteSize = clamp(parseIntOrDefault(cfg.emoteSize, DEFAULT_CONFIG.emoteSize), 40, 100);
    cfg.itemPadding = clamp(parseIntOrDefault(cfg.itemPadding, DEFAULT_CONFIG.itemPadding), 0, 24);
    cfg.itemGap = clamp(parseIntOrDefault(cfg.itemGap, DEFAULT_CONFIG.itemGap), 0, 24);
    cfg.borderRadius = clamp(parseIntOrDefault(cfg.borderRadius, DEFAULT_CONFIG.borderRadius), 0, 24);
    cfg.glowIntensity = clamp(parseIntOrDefault(cfg.glowIntensity, DEFAULT_CONFIG.glowIntensity), 0, 32);

    if (!THEME_PRESETS[cfg.theme] && cfg.theme !== "custom") {
      cfg.theme = "custom";
    }

    cfg.primaryColor = sanitizeColor(cfg.primaryColor, DEFAULT_CONFIG.primaryColor);
    cfg.accentColor = sanitizeColor(cfg.accentColor, DEFAULT_CONFIG.accentColor);
    cfg.backgroundColor = sanitizeColor(cfg.backgroundColor, DEFAULT_CONFIG.backgroundColor);
    cfg.headerColor = sanitizeColor(cfg.headerColor, DEFAULT_CONFIG.headerColor);
    cfg.footerColor = sanitizeColor(cfg.footerColor, DEFAULT_CONFIG.footerColor);
    cfg.panelBackgroundColor = sanitizeColor(cfg.panelBackgroundColor, DEFAULT_CONFIG.panelBackgroundColor);
    cfg.stampBackgroundColor = sanitizeColor(cfg.stampBackgroundColor, DEFAULT_CONFIG.stampBackgroundColor);
    cfg.emoteOrderByTier = normalizeOrderByTier(cfg.emoteOrderByTier);
    cfg.emoteSectionOrder = normalizeSectionOrder(cfg.emoteSectionOrder);
    cfg.followerEmoteOrder = normalizeIdList(cfg.followerEmoteOrder);
    cfg.subBadgeOrder = normalizeIdList(cfg.subBadgeOrder);
    cfg.bitsBadgeOrder = normalizeIdList(cfg.bitsBadgeOrder);
    cfg.hiddenStampIds = normalizeHiddenStampIds(cfg.hiddenStampIds);
    var normalizedActiveTab = cfg.activeTab;
    if (normalizedActiveTab === "followerStamps") {
      normalizedActiveTab = "emotes";
    }
    if (normalizedActiveTab === "subBadges" || normalizedActiveTab === "bitsBadges") {
      normalizedActiveTab = "badges";
    }
    cfg.activeTab = ["emotes", "badges"].indexOf(normalizedActiveTab) >= 0 ? normalizedActiveTab : "emotes";

    return cfg;
  }

  function normalizeData(rawData) {
    var model = {
      emotesByTier: {
        "1000": [],
        "2000": [],
        "3000": []
      },
      followerEmotes: [],
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
          return;
        }
        if (String(emote.emote_type || "").toLowerCase() === "follower") {
          model.followerEmotes.push(emote);
        }
      });
    }

    if (Array.isArray(rawData.followerEmotes)) {
      model.followerEmotes = rawData.followerEmotes;
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
    var textColor = getContrastingTextColor(theme.background);
    var headerTextColor = getContrastingTextColor(cfg.headerColor);
    var footerTextColor = getContrastingTextColor(cfg.footerColor);
    var panelTextColor = getContrastingTextColor(cfg.panelBackgroundColor);
    var stampTextColor = getContrastingTextColor(cfg.stampBackgroundColor);
    var panelIsLight = colorLuma(cfg.panelBackgroundColor) > 0.62;
    var headerIsLight = colorLuma(cfg.headerColor) > 0.52;
    var footerIsLight = colorLuma(cfg.footerColor) > 0.52;
    var activeTextColor = (colorLuma(theme.primary) > 0.62 && colorLuma(theme.accent) > 0.62) ? "#1f2330" : "#f8fbff";

    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--background", theme.background);
    root.style.setProperty("--text-color", textColor);
    root.style.setProperty("--header-bg", cfg.headerColor);
    root.style.setProperty("--footer-bg", cfg.footerColor);
    root.style.setProperty("--header-text", headerTextColor);
    root.style.setProperty("--footer-text", footerTextColor);
    root.style.setProperty("--panel-bg", cfg.panelBackgroundColor);
    root.style.setProperty("--stamp-bg", cfg.stampBackgroundColor);
    root.style.setProperty("--panel-text", panelTextColor);
    root.style.setProperty("--stamp-text", stampTextColor);
    root.style.setProperty("--radius", cfg.borderRadius + "px");
    root.style.setProperty("--glow", cfg.glowIntensity + "px");
    root.style.setProperty("--glow-color", hexToRgba(theme.accent, 0.35));
    root.style.setProperty("--primary-glow", hexToRgba(theme.primary, 0.45));
    root.style.setProperty("--accent-glow", hexToRgba(theme.accent, 0.42));
    root.style.setProperty("--primary-soft", hexToRgba(theme.primary, 0.24));
    root.style.setProperty("--accent-soft", hexToRgba(theme.accent, 0.2));
    root.style.setProperty("--header-glow", hexToRgba(cfg.headerColor, 0.38));
    root.style.setProperty("--footer-glow", hexToRgba(cfg.footerColor, 0.38));
    root.style.setProperty("--tab-active-text", activeTextColor);

    if (headerIsLight) {
      root.style.setProperty("--header-grad-start", mixHex(cfg.headerColor, "#ffffff", 0.06, 1));
      root.style.setProperty("--header-grad-end", mixHex(cfg.headerColor, "#ffffff", 0.32, 1));
      root.style.setProperty("--header-border-color", hexToRgba(theme.accent, 0.45));
      root.style.setProperty("--header-inner-ring", "rgba(255,255,255,0.34)");
    } else {
      root.style.setProperty("--header-grad-start", mixHex(cfg.headerColor, "#000000", 0.03, 1));
      root.style.setProperty("--header-grad-end", mixHex(cfg.headerColor, "#000000", 0.24, 1));
      root.style.setProperty("--header-border-color", "var(--accent-glow)");
      root.style.setProperty("--header-inner-ring", "rgba(255,255,255,0.08)");
    }

    if (footerIsLight) {
      root.style.setProperty("--footer-grad-start", mixHex(cfg.footerColor, "#ffffff", 0.05, 1));
      root.style.setProperty("--footer-grad-end", mixHex(cfg.footerColor, "#ffffff", 0.3, 1));
      root.style.setProperty("--footer-border-color", hexToRgba(theme.primary, 0.45));
      root.style.setProperty("--footer-inner-ring", "rgba(255,255,255,0.32)");
    } else {
      root.style.setProperty("--footer-grad-start", mixHex(cfg.footerColor, "#000000", 0.03, 1));
      root.style.setProperty("--footer-grad-end", mixHex(cfg.footerColor, "#000000", 0.24, 1));
      root.style.setProperty("--footer-border-color", "var(--primary-glow)");
      root.style.setProperty("--footer-inner-ring", "rgba(255,255,255,0.08)");
    }

    if (panelIsLight) {
      root.style.setProperty("--tab-border", hexToRgba(theme.primary, 0.3));
      root.style.setProperty("--tab-text", "#273147");
      root.style.setProperty("--tab-bg-start", hexToRgba(theme.accent, 0.24));
      root.style.setProperty("--tab-bg-mid", "rgba(255,255,255,0.9)");
      root.style.setProperty("--tab-bg-end", hexToRgba(theme.primary, 0.2));
      root.style.setProperty("--tab-shadow", hexToRgba(theme.primary, 0.16));
      root.style.setProperty("--tab-hover-mid", "rgba(255,255,255,0.98)");
      root.style.setProperty("--tab-hover-shadow", hexToRgba(theme.accent, 0.32));
      root.style.setProperty("--tab-inner-ring", "rgba(31,35,48,0.08)");
    } else {
      root.style.setProperty("--tab-border", "var(--accent-soft)");
      root.style.setProperty("--tab-text", "#eef6ff");
      root.style.setProperty("--tab-bg-start", "var(--accent-soft)");
      root.style.setProperty("--tab-bg-mid", "rgba(20,29,49,0.9)");
      root.style.setProperty("--tab-bg-end", "var(--primary-soft)");
      root.style.setProperty("--tab-shadow", "var(--accent-soft)");
      root.style.setProperty("--tab-hover-mid", "rgba(20,29,49,0.82)");
      root.style.setProperty("--tab-hover-shadow", "var(--accent-glow)");
      root.style.setProperty("--tab-inner-ring", "rgba(255,255,255,0.06)");
    }
  }

  function getEnabledTabs(cfg) {
    var tabs = [];
    if (cfg.showEmotes) {
      tabs.push({ id: "emotes", label: "Stamps" });
    }
    if (cfg.showSubBadges || cfg.showBitsBadges) {
      tabs.push({ id: "badges", label: "Badges" });
    }
    return tabs;
  }

  function pickImage(images, fallback) {
    if (images && typeof images === "object") {
      return images.url_4x || images.url_2x || images.url_1x || fallback || "";
    }
    return fallback || "";
  }

  function buildAnimatedEmoteUrl(emote) {
    if (!emote || !emote.template || !Array.isArray(emote.format)) {
      return "";
    }
    if (emote.format.indexOf("animated") < 0) {
      return "";
    }
    var template = String(emote.template)
      .replace(/%7B/gi, "{")
      .replace(/%7D/gi, "}");
    var themeMode = Array.isArray(emote.theme_mode) && emote.theme_mode.indexOf("light") >= 0 ? "light" : "dark";
    var scale = "3.0";
    if (Array.isArray(emote.scale) && emote.scale.length) {
      if (emote.scale.indexOf("3.0") >= 0) {
        scale = "3.0";
      } else {
        scale = emote.scale[emote.scale.length - 1];
      }
    }
    var emoteId = String(emote.id || "").replace(/^\{+|\}+$/g, "");
    var url = template
      .replace(/\{\{\s*id\s*\}\}|\{\s*id\s*\}/g, encodeURIComponent(emoteId))
      // Helix V2 chat emotes use "default" for the animated rendition.
      .replace(/\{\{\s*format\s*\}\}|\{\s*format\s*\}/g, "default")
      .replace(/\{\{\s*theme_mode\s*\}\}|\{\s*theme_mode\s*\}/g, themeMode)
      .replace(/\{\{\s*scale\s*\}\}|\{\s*scale\s*\}/g, scale);

    if (/\{\s*(id|format|theme_mode|scale)\s*\}/.test(url)) {
      return "";
    }
    return url;
  }

  function buildStaticEmoteUrl(emote) {
    if (!emote || !emote.template) {
      return "";
    }
    var template = String(emote.template)
      .replace(/%7B/gi, "{")
      .replace(/%7D/gi, "}");
    var emoteId = String(emote.id || "").replace(/^\{+|\}+$/g, "");
    var themeMode = Array.isArray(emote.theme_mode) && emote.theme_mode.indexOf("light") >= 0 ? "light" : "dark";
    var scale = "3.0";
    if (Array.isArray(emote.scale) && emote.scale.length) {
      scale = emote.scale.indexOf("3.0") >= 0 ? "3.0" : emote.scale[emote.scale.length - 1];
    }

    var candidateFormats = ["default", "static"];
    for (var i = 0; i < candidateFormats.length; i += 1) {
      var format = candidateFormats[i];
      var url = template
        .replace(/\{\{\s*id\s*\}\}|\{\s*id\s*\}/g, encodeURIComponent(emoteId))
        .replace(/\{\{\s*format\s*\}\}|\{\s*format\s*\}/g, format)
        .replace(/\{\{\s*theme_mode\s*\}\}|\{\s*theme_mode\s*\}/g, themeMode)
        .replace(/\{\{\s*scale\s*\}\}|\{\s*scale\s*\}/g, scale);
      if (!/\{\s*(id|format|theme_mode|scale)\s*\}/.test(url)) {
        return url;
      }
    }
    return "";
  }

  function getItemId(item) {
    return String((item && (item.id || item.name)) || "");
  }

  function sortByOrder(items, orderList) {
    var order = normalizeIdList(orderList);
    if (!order.length) {
      return (items || []).slice();
    }
    var rank = Object.create(null);
    order.forEach(function (id, index) {
      rank[id] = index;
    });

    return (items || []).map(function (item, index) {
      return { item: item, index: index };
    }).sort(function (aWrap, bWrap) {
      var a = aWrap.item;
      var b = bWrap.item;
      var aId = getItemId(a);
      var bId = getItemId(b);
      var aRank = Object.prototype.hasOwnProperty.call(rank, aId) ? rank[aId] : Number.MAX_SAFE_INTEGER;
      var bRank = Object.prototype.hasOwnProperty.call(rank, bId) ? rank[bId] : Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) {
        return aRank - bRank;
      }
      return aWrap.index - bWrap.index;
    }).map(function (wrapped) {
      return wrapped.item;
    });
  }

  function isTierEnabled(cfg, tier) {
    if (tier === "1000") {
      return !!cfg.showTier1000;
    }
    if (tier === "2000") {
      return !!cfg.showTier2000;
    }
    if (tier === "3000") {
      return !!cfg.showTier3000;
    }
    return true;
  }

  function getHiddenKey(kind, tier) {
    if (kind === "emotes") {
      return "emotes" + String(tier || "");
    }
    if (kind === "followerStamps") {
      return "followerStamps";
    }
    if (kind === "subBadges") {
      return "subBadges";
    }
    if (kind === "bitsBadges") {
      return "bitsBadges";
    }
    return "";
  }

  function isHiddenStamp(cfg, kind, tier, item) {
    var key = getHiddenKey(kind, tier);
    if (!key) {
      return false;
    }
    var hidden = (cfg.hiddenStampIds && cfg.hiddenStampIds[key]) || [];
    var id = getItemId(item);
    return hidden.indexOf(id) >= 0;
  }

  function renderEmptyState(message) {
    return '<div class="ed-empty">' + escapeHtml(message) + "</div>";
  }

  function renderEmotes(model, cfg) {
    var tierNames = { "1000": "Tier 1", "2000": "Tier 2", "3000": "Tier 3" };
    var html = "";
    var total = 0;
    var sectionOrder = Array.isArray(cfg.emoteSectionOrder) ? cfg.emoteSectionOrder : ["follower", "1000", "2000", "3000"];

    sectionOrder.forEach(function (sectionId) {
      if (sectionId === "follower") {
        if (!cfg.showFollowerStamps) {
          return;
        }
        var followers = sortByOrder(model.followerEmotes || [], cfg.followerEmoteOrder);
        followers = followers.filter(function (emote) {
          return !isHiddenStamp(cfg, "followerStamps", "", emote);
        });
        total += followers.length;
        html += '<section class="ed-tier">';
        html += '<h3 class="ed-tier-title" data-ed-section-kind="emoteSections" data-ed-section-id="follower">Follower</h3>';
        if (!followers.length) {
          html += renderEmptyState("No follower found.");
        } else {
          html += '<div class="ed-grid">';
          followers.forEach(function (emote) {
            var animatedUrl = buildAnimatedEmoteUrl(emote);
            var fallbackUrl = pickImage(emote.images, emote.imageUrl) || buildStaticEmoteUrl(emote);
            var imageUrl = animatedUrl || fallbackUrl;
            var emoteName = escapeHtml(emote.name || emote.id || "follower");
            html += '<article class="ed-item ed-item--emote" data-ed-kind="followerStamps" data-ed-id="' + escapeHtml(getItemId(emote)) + '">';
            if (animatedUrl && fallbackUrl && animatedUrl !== fallbackUrl) {
              html += '<img class="ed-image" src="' + escapeHtml(imageUrl) + '" data-ed-fallback-src="' + escapeHtml(fallbackUrl) + '" alt="' + emoteName + '" loading="lazy">';
            } else {
              html += '<img class="ed-image" src="' + escapeHtml(imageUrl) + '" alt="' + emoteName + '" loading="lazy">';
            }
            if (cfg.showStampNames) {
              html += '<p class="ed-label">' + emoteName + "</p>";
            }
            html += "</article>";
          });
          html += "</div>";
        }
        html += "</section>";
        return;
      }

      var tier = sectionId;
      if (!isTierEnabled(cfg, tier)) {
        return;
      }
      var emotes = sortByOrder(model.emotesByTier[tier] || [], cfg.emoteOrderByTier[tier]);
      emotes = emotes.filter(function (emote) {
        return !isHiddenStamp(cfg, "emotes", tier, emote);
      });
      total += emotes.length;
      html += '<section class="ed-tier">';
      html += '<h3 class="ed-tier-title" data-ed-section-kind="emoteSections" data-ed-section-id="' + tier + '">' + tierNames[tier] + "</h3>";
      if (!emotes.length) {
        html += renderEmptyState("No emotes in this tier.");
      } else {
        html += '<div class="ed-grid">';
        emotes.forEach(function (emote) {
          var animatedUrl = buildAnimatedEmoteUrl(emote);
          var fallbackUrl = pickImage(emote.images, emote.imageUrl) || buildStaticEmoteUrl(emote);
          var imageUrl = animatedUrl || fallbackUrl;
          var emoteName = escapeHtml(emote.name || emote.id || "emote");
          html += '<article class="ed-item ed-item--emote" data-ed-kind="emotes" data-ed-tier="' + tier + '" data-ed-id="' + escapeHtml(getItemId(emote)) + '">';
          if (animatedUrl && fallbackUrl && animatedUrl !== fallbackUrl) {
            html += '<img class="ed-image" src="' + escapeHtml(imageUrl) + '" data-ed-fallback-src="' + escapeHtml(fallbackUrl) + '" alt="' + emoteName + '" loading="lazy">';
          } else {
            html += '<img class="ed-image" src="' + escapeHtml(imageUrl) + '" alt="' + emoteName + '" loading="lazy">';
          }
          if (cfg.showStampNames) {
            html += '<p class="ed-label">' + emoteName + "</p>";
          }
          html += "</article>";
        });
        html += "</div>";
      }
      html += "</section>";
    });

    if (!total) {
      return renderEmptyState("No emotes found.");
    }
    return html;
  }

  function renderFollowerEmotes(list, cfg) {
    var ordered = sortByOrder(list || [], cfg.followerEmoteOrder);
    ordered = ordered.filter(function (emote) {
      return !isHiddenStamp(cfg, "followerStamps", "", emote);
    });
    if (!ordered.length) {
      return renderEmptyState("No follower found.");
    }

    var html = '<div class="ed-grid">';
    ordered.forEach(function (emote) {
      var animatedUrl = buildAnimatedEmoteUrl(emote);
      var fallbackUrl = pickImage(emote.images, emote.imageUrl) || buildStaticEmoteUrl(emote);
      var imageUrl = animatedUrl || fallbackUrl;
      var emoteName = escapeHtml(emote.name || emote.id || "follower");
      html += '<article class="ed-item ed-item--emote" data-ed-kind="followerStamps" data-ed-id="' + escapeHtml(getItemId(emote)) + '">';
      if (animatedUrl && fallbackUrl && animatedUrl !== fallbackUrl) {
        html += '<img class="ed-image" src="' + escapeHtml(imageUrl) + '" data-ed-fallback-src="' + escapeHtml(fallbackUrl) + '" alt="' + emoteName + '" loading="lazy">';
      } else {
        html += '<img class="ed-image" src="' + escapeHtml(imageUrl) + '" alt="' + emoteName + '" loading="lazy">';
      }
      if (cfg.showStampNames) {
        html += '<p class="ed-label">' + emoteName + "</p>";
      }
      html += "</article>";
    });
    html += "</div>";
    return html;
  }

  function renderBadges(list, emptyMessage, cfg, badgeKind) {
    var order = badgeKind === "subBadges" ? cfg.subBadgeOrder : cfg.bitsBadgeOrder;
    var ordered = sortByOrder(list, order);
    ordered = ordered.filter(function (badge) {
      return !isHiddenStamp(cfg, badgeKind, "", badge);
    });

    if (!ordered.length) {
      return renderEmptyState(emptyMessage);
    }

    var html = '<div class="ed-grid">';
    ordered.forEach(function (badge) {
      var title = escapeHtml(badge.title || badge.id || "badge");
      var desc = escapeHtml(badge.description || "");
      var imageUrl = escapeHtml(badge.imageUrl || "");
      html += '<article class="ed-item ed-item--badge" data-ed-kind="' + escapeHtml(badgeKind) + '" data-ed-id="' + escapeHtml(getItemId(badge)) + '">';
      html += '<img class="ed-image" src="' + imageUrl + '" alt="' + title + '" loading="lazy">';
      if (cfg.showStampNames) {
        html += '<p class="ed-label">' + title + "</p>";
      }
      if (cfg.showStampNames && desc) {
        html += '<p class="ed-meta">' + desc + "</p>";
      }
      html += "</article>";
    });
    html += "</div>";
    return html;
  }

  function renderBadgesPanel(model, cfg) {
    var html = "";
    var hasAnyBadgeSection = false;

    if (cfg.showSubBadges) {
      hasAnyBadgeSection = true;
      html += '<section class="ed-tier">';
      html += '<h3 class="ed-tier-title">Subscriber Badges</h3>';
      html += renderBadges(model.subBadges, "No subscriber badges found.", cfg, "subBadges");
      html += "</section>";
    }

    if (cfg.showBitsBadges) {
      hasAnyBadgeSection = true;
      html += '<section class="ed-tier">';
      html += '<h3 class="ed-tier-title">Bits Badges</h3>';
      html += renderBadges(model.bitsBadges, "No bits badges found.", cfg, "bitsBadges");
      html += "</section>";
    }

    if (!hasAnyBadgeSection) {
      return renderEmptyState("No badge categories enabled.");
    }

    return html;
  }

  function render(container, rawData, rawConfig) {
    if (!container) {
      return;
    }

    var cfg = normalizeConfig(rawConfig);
    var model = normalizeData(rawData);
    applyThemeVariables(cfg);

    var layout = calculateLayoutMetrics(container, cfg);

    container.style.setProperty("--columns", String(cfg.columns));
    container.style.setProperty("--effective-columns", String(layout.effectiveColumns));
    container.style.setProperty("--emote-size", layout.imageSize + "px");
    container.style.setProperty("--item-padding", cfg.itemPadding + "px");
    container.style.setProperty("--item-gap", cfg.itemGap + "px");
    container.style.setProperty("--item-frame-size", layout.frameSize + "px");
    container.style.setProperty("--label-space", cfg.showStampNames ? "30px" : "6px");
    var footerHtml = '<footer class="ed-footer">' +
      '<p class="ed-footer-row">' +
      '<span class="ed-footer-text">EmoteDeck Panel</span>' +
      '<span class="ed-footer-meta">Developed by <a class="ed-footer-link" href="https://www.twitch.tv/ksmksks" target="_blank" rel="noopener noreferrer">ksmksks</a></span>' +
      "</p>" +
      "</footer>";

    var tabs = getEnabledTabs(cfg);
    if (!tabs.length) {
      container.innerHTML = '<section class="ed-shell">' +
        '<header class="ed-header">' +
        '<h2 class="ed-title">' + escapeHtml(cfg.headerTitle) + "</h2>" +
        "</header>" +
        '<section class="section" data-ed-panel="active">' + renderEmptyState("All categories are OFF. Enable at least one in Config.") + "</section>" +
        footerHtml +
        "</section>";
      return;
    }

    var activeTab = tabs.some(function (tab) { return tab.id === cfg.activeTab; }) ? cfg.activeTab : tabs[0].id;
    var panelHtml = "";

    if (activeTab === "emotes") {
      panelHtml = renderEmotes(model, cfg);
    } else {
      panelHtml = renderBadgesPanel(model, cfg);
    }

    container.innerHTML = '<section class="ed-shell">' +
      '<header class="ed-header">' +
      '<h2 class="ed-title">' + escapeHtml(cfg.headerTitle) + "</h2>" +
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
      footerHtml +
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

    Array.prototype.forEach.call(container.querySelectorAll(".ed-image[data-ed-fallback-src]"), function (img) {
      img.addEventListener("error", function onError() {
        var fallback = img.getAttribute("data-ed-fallback-src") || "";
        if (!fallback || img.getAttribute("src") === fallback) {
          return;
        }
        img.setAttribute("src", fallback);
        img.removeAttribute("data-ed-fallback-src");
        img.removeEventListener("error", onError);
      });
    });

    if (cfg.enableDragSort && typeof cfg.onOrderChange === "function") {
      wireDragAndDrop(container, cfg);
    }
  }

  function calculateEffectiveColumns(container, desiredColumns, minFrameSize, itemGap) {
    var columns = clamp(parseInt(desiredColumns, 10) || 1, 1, 8);
    var width = container && container.clientWidth ? container.clientWidth : 300;
    var shellWidth = Math.min(width, 300);
    var usableWidth = Math.max(120, shellWidth - 24);
    var perItem = Math.max(40, minFrameSize);
    var fit = Math.floor((usableWidth + itemGap) / (perItem + itemGap));
    return clamp(fit || 1, 1, columns);
  }

  function calculateLayoutMetrics(container, cfg) {
    var width = container && container.clientWidth ? container.clientWidth : 300;
    var shellWidth = Math.min(width, 300);
    var usableWidth = Math.max(120, shellWidth - 24);
    var minFrameSize = Math.max(48, cfg.itemPadding * 2 + 34);
    var effectiveColumns = calculateEffectiveColumns(container, cfg.columns, minFrameSize, cfg.itemGap);
    var frameSize = Math.floor((usableWidth - cfg.itemGap * (effectiveColumns - 1)) / effectiveColumns);
    frameSize = Math.max(minFrameSize, frameSize);
    var inner = Math.max(20, frameSize - cfg.itemPadding * 2 - 2);
    var imageSize = Math.max(18, Math.floor(inner * (cfg.emoteSize / 100)));
    return {
      effectiveColumns: effectiveColumns,
      frameSize: frameSize,
      imageSize: imageSize
    };
  }

  function wireDragAndDrop(container, cfg) {
    var dragState = {
      id: "",
      kind: "",
      tier: ""
    };

    Array.prototype.forEach.call(container.querySelectorAll(".ed-item[data-ed-id]"), function (item) {
      item.setAttribute("draggable", "true");

      item.addEventListener("dragstart", function (event) {
        dragState.id = item.getAttribute("data-ed-id") || "";
        dragState.kind = item.getAttribute("data-ed-kind") || "";
        dragState.tier = item.getAttribute("data-ed-tier") || "";
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", dragState.id);
        }
        item.classList.add("is-dragging");
      });

      item.addEventListener("dragend", function () {
        item.classList.remove("is-dragging");
      });

      item.addEventListener("dragover", function (event) {
        event.preventDefault();
      });

      item.addEventListener("drop", function (event) {
        event.preventDefault();
        var targetId = item.getAttribute("data-ed-id") || "";
        var targetKind = item.getAttribute("data-ed-kind") || "";
        var targetTier = item.getAttribute("data-ed-tier") || "";
        if (!dragState.id || !targetId || dragState.id === targetId) {
          return;
        }
        if (dragState.kind !== targetKind) {
          return;
        }
        if (dragState.kind === "emotes" && dragState.tier !== targetTier) {
          return;
        }

        var selector = '.ed-item[data-ed-kind="' + targetKind + '"]';
        if (targetKind === "emotes") {
          selector += '[data-ed-tier="' + targetTier + '"]';
        }
        var currentOrder = Array.prototype.map.call(
          container.querySelectorAll(selector),
          function (node) { return node.getAttribute("data-ed-id") || ""; }
        ).filter(function (id) { return !!id; });

        cfg.onOrderChange({
          kind: dragState.kind,
          tier: dragState.tier,
          fromId: dragState.id,
          toId: targetId,
          currentOrder: currentOrder
        });
      });
    });

    var sectionDragState = {
      id: "",
      kind: ""
    };

    Array.prototype.forEach.call(container.querySelectorAll(".ed-tier-title[data-ed-section-kind][data-ed-section-id]"), function (title) {
      title.setAttribute("draggable", "true");
      title.classList.add("is-draggable");

      title.addEventListener("dragstart", function (event) {
        sectionDragState.id = title.getAttribute("data-ed-section-id") || "";
        sectionDragState.kind = title.getAttribute("data-ed-section-kind") || "";
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", sectionDragState.id);
        }
      });

      title.addEventListener("dragover", function (event) {
        event.preventDefault();
      });

      title.addEventListener("drop", function (event) {
        event.preventDefault();
        var targetId = title.getAttribute("data-ed-section-id") || "";
        var targetKind = title.getAttribute("data-ed-section-kind") || "";
        if (!sectionDragState.id || !targetId || sectionDragState.id === targetId) {
          return;
        }
        if (sectionDragState.kind !== targetKind) {
          return;
        }

        var selector = '.ed-tier-title[data-ed-section-kind="' + targetKind + '"]';
        var currentOrder = Array.prototype.map.call(
          container.querySelectorAll(selector),
          function (node) { return node.getAttribute("data-ed-section-id") || ""; }
        ).filter(function (id) { return !!id; });

        cfg.onOrderChange({
          kind: "emoteSections",
          fromId: sectionDragState.id,
          toId: targetId,
          currentOrder: currentOrder
        });
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
