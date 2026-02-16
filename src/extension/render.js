(function (global) {
  "use strict";

  var DEFAULT_CONFIG = {
    showEmotes: true,
    showSubBadges: true,
    showBitsBadges: true,
    showStampNames: true,
    headerTitle: "EmoteDeck",
    headerColor: "#e56aa6",
    footerColor: "#e56aa6",
    panelBackgroundColor: "#ffffff",
    stampBackgroundColor: "#fff0f6",
    emoteOrderByTier: {
      "1000": [],
      "2000": [],
      "3000": []
    },
    subBadgeOrder: [],
    bitsBadgeOrder: [],
    tierOrder: "asc",
    columns: 3,
    emoteSize: 52,
    theme: "custom",
    primaryColor: "#e56aa6",
    accentColor: "#ffc8dd",
    backgroundColor: "#fff7fb",
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

  function getContrastingTextColor(hex) {
    var normalized = (hex || "").replace("#", "");
    if (normalized.length === 3) {
      normalized = normalized[0] + normalized[0] + normalized[1] + normalized[1] + normalized[2] + normalized[2];
    }
    if (normalized.length !== 6) {
      return "#1f2330";
    }
    var r = parseInt(normalized.slice(0, 2), 16);
    var g = parseInt(normalized.slice(2, 4), 16);
    var b = parseInt(normalized.slice(4, 6), 16);
    var luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
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
    cfg.showSubBadges = cfg.showSubBadges !== false;
    cfg.showBitsBadges = cfg.showBitsBadges !== false;
    cfg.showStampNames = cfg.showStampNames !== false;
    cfg.headerTitle = String(cfg.headerTitle || DEFAULT_CONFIG.headerTitle).trim().slice(0, 48) || DEFAULT_CONFIG.headerTitle;

    cfg.tierOrder = cfg.tierOrder === "desc" ? "desc" : "asc";
    cfg.columns = clamp(parseInt(cfg.columns, 10) || DEFAULT_CONFIG.columns, 2, 5);
    cfg.emoteSize = clamp(parseInt(cfg.emoteSize, 10) || DEFAULT_CONFIG.emoteSize, 32, 112);
    cfg.borderRadius = clamp(parseInt(cfg.borderRadius, 10) || DEFAULT_CONFIG.borderRadius, 0, 24);
    cfg.glowIntensity = clamp(parseInt(cfg.glowIntensity, 10) || DEFAULT_CONFIG.glowIntensity, 0, 32);

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
    cfg.subBadgeOrder = normalizeIdList(cfg.subBadgeOrder);
    cfg.bitsBadgeOrder = normalizeIdList(cfg.bitsBadgeOrder);
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
    var textColor = getContrastingTextColor(theme.background);
    var headerTextColor = getContrastingTextColor(cfg.headerColor);
    var footerTextColor = getContrastingTextColor(cfg.footerColor);
    var panelTextColor = getContrastingTextColor(cfg.panelBackgroundColor);
    var stampTextColor = getContrastingTextColor(cfg.stampBackgroundColor);

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

  function buildAnimatedEmoteUrl(emote) {
    if (!emote || !emote.template || !Array.isArray(emote.format)) {
      return "";
    }
    if (emote.format.indexOf("animated") < 0) {
      return "";
    }
    var themeMode = Array.isArray(emote.theme_mode) && emote.theme_mode.indexOf("dark") >= 0 ? "dark" : "light";
    var scale = "3.0";
    if (Array.isArray(emote.scale) && emote.scale.length) {
      scale = emote.scale.indexOf("3.0") >= 0 ? "3.0" : emote.scale[emote.scale.length - 1];
    }
    return String(emote.template)
      .replace("{id}", encodeURIComponent(String(emote.id || "")))
      .replace("{format}", "animated")
      .replace("{theme_mode}", themeMode)
      .replace("{scale}", scale);
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

  function renderEmptyState(message) {
    return '<div class="ed-empty">' + escapeHtml(message) + "</div>";
  }

  function renderEmotes(model, cfg) {
    var tierOrder = cfg.tierOrder === "desc" ? ["3000", "2000", "1000"] : ["1000", "2000", "3000"];
    var tierNames = { "1000": "Tier 1", "2000": "Tier 2", "3000": "Tier 3" };
    var html = "";
    var total = 0;

    tierOrder.forEach(function (tier) {
      var emotes = sortByOrder(model.emotesByTier[tier] || [], cfg.emoteOrderByTier[tier]);
      total += emotes.length;
      html += '<section class="ed-tier">';
      html += '<h3 class="ed-tier-title">' + tierNames[tier] + "</h3>";
      if (!emotes.length) {
        html += renderEmptyState("No emotes in this tier.");
      } else {
        html += '<div class="ed-grid">';
        emotes.forEach(function (emote) {
          var imageUrl = buildAnimatedEmoteUrl(emote) || pickImage(emote.images, emote.imageUrl);
          var emoteName = escapeHtml(emote.name || emote.id || "emote");
          html += '<article class="ed-item ed-item--emote" data-ed-kind="emotes" data-ed-tier="' + tier + '" data-ed-id="' + escapeHtml(getItemId(emote)) + '">';
          html += '<img class="ed-image" src="' + escapeHtml(imageUrl) + '" alt="' + emoteName + '" loading="lazy">';
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
      return renderEmptyState("No subscriber emotes found.");
    }
    return html;
  }

  function renderBadges(list, emptyMessage, cfg, badgeKind) {
    var order = badgeKind === "subBadges" ? cfg.subBadgeOrder : cfg.bitsBadgeOrder;
    var ordered = sortByOrder(list, order);

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

  function render(container, rawData, rawConfig) {
    if (!container) {
      return;
    }

    var cfg = normalizeConfig(rawConfig);
    var model = normalizeData(rawData);
    applyThemeVariables(cfg);

    container.style.setProperty("--columns", String(cfg.columns));
    container.style.setProperty("--emote-size", cfg.emoteSize + "px");
    container.style.setProperty("--item-padding", clamp(Math.round(cfg.emoteSize * 0.18), 6, 18) + "px");
    container.style.setProperty("--item-frame-size", cfg.emoteSize + clamp(Math.round(cfg.emoteSize * 0.18), 6, 18) * 2 + "px");
    container.style.setProperty("--label-space", cfg.showStampNames ? "30px" : "6px");

    var tabs = getEnabledTabs(cfg);
    if (!tabs.length) {
      container.innerHTML = '<section class="ed-shell">' +
        '<header class="ed-header">' +
        '<h2 class="ed-title">' + escapeHtml(cfg.headerTitle) + "</h2>" +
        '<p class="ed-subtitle">Twitch channel rewards</p>' +
        "</header>" +
        '<section class="section" data-ed-panel="active">' + renderEmptyState("All categories are OFF. Enable at least one in Config.") + "</section>" +
        '<footer class="ed-footer"><p class="ed-footer-text">EmoteDeck Panel</p></footer>' +
        "</section>";
      return;
    }

    var activeTab = tabs.some(function (tab) { return tab.id === cfg.activeTab; }) ? cfg.activeTab : tabs[0].id;
    var panelHtml = "";

    if (activeTab === "emotes") {
      panelHtml = renderEmotes(model, cfg);
    } else if (activeTab === "subBadges") {
      panelHtml = renderBadges(model.subBadges, "No subscriber badges found.", cfg, "subBadges");
    } else {
      panelHtml = renderBadges(model.bitsBadges, "No bits badges found.", cfg, "bitsBadges");
    }

    container.innerHTML = '<section class="ed-shell">' +
      '<header class="ed-header">' +
      '<h2 class="ed-title">' + escapeHtml(cfg.headerTitle) + "</h2>" +
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
      '<footer class="ed-footer"><p class="ed-footer-text">EmoteDeck Panel</p></footer>' +
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

    if (cfg.enableDragSort && typeof cfg.onOrderChange === "function") {
      wireDragAndDrop(container, cfg);
    }
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
  }

  global.EmoteDeckRender = {
    render: render,
    defaults: clone(DEFAULT_CONFIG),
    themePresets: clone(THEME_PRESETS),
    normalizeConfig: normalizeConfig
  };
})(window);
