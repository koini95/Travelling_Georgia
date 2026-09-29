// Trip weather module v2 — itinerary-aware forecast for 2026 Georgia trip
(function () {
  var DAYS = [
    ["2026-10-02","10.2","第比利斯接机","第比利斯",41.7151,44.8271,"🏙","抵达日，按第比利斯市区天气准备。",false],
    ["2026-10-03","10.3","第比利斯 → 西格纳吉 → 第比利斯","西格纳吉",41.6206,45.9210,"🍇","酒庄与古城墙以户外活动为主，降雨会明显影响体感。",false],
    ["2026-10-04","10.4","第比利斯 → 姆兹赫塔 → 巴统","巴统",41.6461,41.6409,"🌊","黑海沿岸湿度和风感通常比气温数字更明显。",false],
    ["2026-10-05","10.5","巴统 → 库塔伊西","库塔伊西",42.2679,42.6946,"🏛","上午仍在巴统，下午转入库塔伊西，建议分层穿衣。",false],
    ["2026-10-06","10.6","库塔伊西 → 哥里 → 卡兹别克山","Stepantsminda / 卡兹别克",42.6578,44.6433,"⛰","当天海拔快速上升，傍晚温度会明显低于库塔伊西和哥里。",false],
    ["2026-10-07","10.7","卡兹别克山 · Juta 徒步","Juta",42.5787,44.7480,"🥾","全程最需要盯天气的一天：低温、降水和大风任一项偏高都要提高保暖/防水等级。",true],
    ["2026-10-08","10.8","卡兹别克山 → 圣剑山 → 第比利斯","Stepantsminda / 卡兹别克",42.6578,44.6433,"🛣","上午山区为主，回到第比利斯后体感会明显回暖。",false],
    ["2026-10-09","10.9","第比利斯市区游览 → 送机","第比利斯",41.7151,44.8271,"✈️","市区步行为主，重点看降雨概率。",false]
  ];

  var WEATHER = {
    0:["晴","☀️"],1:["晴间多云","🌤️"],2:["多云","⛅"],3:["阴","☁️"],45:["雾","🌫️"],48:["雾凇","🌫️"],
    51:["小毛毛雨","🌦️"],53:["毛毛雨","🌦️"],55:["较强毛毛雨","🌧️"],56:["冻毛毛雨","🌧️"],57:["较强冻毛毛雨","🌧️"],
    61:["小雨","🌦️"],63:["中雨","🌧️"],65:["大雨","🌧️"],66:["冻雨","🌧️"],67:["较强冻雨","🌧️"],
    71:["小雪","🌨️"],73:["中雪","🌨️"],75:["大雪","❄️"],77:["雪粒","🌨️"],80:["阵雨","🌦️"],81:["较强阵雨","🌧️"],
    82:["强阵雨","⛈️"],85:["阵雪","🌨️"],86:["强阵雪","❄️"],95:["雷暴","⛈️"],96:["雷暴伴冰雹","⛈️"],99:["强雷暴伴冰雹","⛈️"]
  };

  function advice(d, x) {
    if (d[8] || x.tmax <= 8 || x.tmin <= 2) return "保暖打底＋抓绒/轻羽绒＋防风防水外层；建议带薄手套和帽子。";
    if (x.tmax <= 15 || x.tmin <= 8) return (x.pop || 0) >= 35 ? "长裤＋针织/卫衣＋防水外套。" : "长裤＋针织/卫衣，早晚加防风层。";
    if ((x.pop || 0) >= 35 || (x.wind || 0) >= 30) return "薄长袖/短袖打底＋防风防水外套，鞋子尽量耐湿。";
    return "薄长袖或短袖＋轻外套，早晚加一层即可。";
  }

  function alertText(d, x) {
    if (d[8] && ((x.pop || 0) >= 40 || (x.wind || 0) >= 35 || x.tmin <= 2)) return "⚠️ 山区重点关注";
    if ((x.pop || 0) >= 60) return "☔ 高降雨概率";
    if ((x.wind || 0) >= 35) return "💨 风较大";
    return "";
  }

  async function fetchDay(d) {
    var q = new URLSearchParams({
      latitude:d[4], longitude:d[5],
      daily:"weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max",
      timezone:"auto", start_date:d[0], end_date:d[0]
    });
    var res = await fetch("https://api.open-meteo.com/v1/forecast?" + q.toString(), {cache:"no-store"});
    if (!res.ok) throw new Error("Open-Meteo " + res.status);
    var j = await res.json();
    if (!j.daily || !j.daily.time || !j.daily.time.length) throw new Error("forecast unavailable");
    return {
      code:j.daily.weather_code[0],
      tmax:j.daily.temperature_2m_max[0],
      tmin:j.daily.temperature_2m_min[0],
      pop:j.daily.precipitation_probability_max[0],
      rain:j.daily.precipitation_sum[0],
      wind:j.daily.wind_speed_10m_max[0]
    };
  }

  function styles() {
    if (document.getElementById("trip-weather-v2-style")) return;
    var s = document.createElement("style");
    s.id = "trip-weather-v2-style";
    s.textContent = ".trip-weather-route{font-size:13px;opacity:.68;margin:3px 0 10px}.trip-weather-main{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:8px}.trip-weather-temp{font-size:22px;font-weight:800}.trip-weather-metrics{display:flex;gap:12px;flex-wrap:wrap;font-size:13px;opacity:.78}.trip-weather-advice{margin-top:10px;padding-top:9px;border-top:1px solid rgba(127,127,127,.18);font-size:13px;line-height:1.6}.trip-weather-alert{display:inline-block;margin-bottom:7px;padding:3px 8px;border-radius:999px;background:rgba(194,100,62,.12);font-size:12px;font-weight:700}.weather-card.trip-critical{border:1px solid rgba(194,100,62,.42)}.weather-card.trip-critical .weather-card-head{background:rgba(194,100,62,.08)}";
    document.head.appendChild(s);
  }

  function card(d, x) {
    var w = WEATHER[x.code] || ["天气代码 " + x.code,"🌤️"];
    var a = alertText(d, x);
    return '<div class="weather-card ' + (d[8] ? 'trip-critical' : '') + '">' +
      '<div class="weather-card-head"><span class="name">' + d[6] + ' ' + d[3] + '</span><span class="dates">' + d[1] + '</span></div>' +
      '<div class="weather-body">' +
        '<div style="font-weight:700">' + w[1] + ' ' + w[0] + '</div>' +
        '<div class="trip-weather-route">' + d[2] + '</div>' +
        (a ? '<div class="trip-weather-alert">' + a + '</div>' : '') +
        '<div class="trip-weather-main"><div class="trip-weather-temp">' + Math.round(x.tmin) + '° / ' + Math.round(x.tmax) + '°C</div></div>' +
        '<div class="trip-weather-metrics"><span>☔ 降雨概率 ' + x.pop + '%</span><span>💧 降水 ' + x.rain + ' mm</span><span>💨 最大风速 ' + x.wind + ' km/h</span></div>' +
        '<div class="trip-weather-advice"><b>穿衣：</b>' + advice(d,x) + '<br><span style="opacity:.72">' + d[7] + '</span></div>' +
      '</div></div>';
  }

  function fallback(d, e) {
    return '<div class="weather-card ' + (d[8] ? 'trip-critical' : '') + '">' +
      '<div class="weather-card-head"><span class="name">' + d[6] + ' ' + d[3] + '</span><span class="dates">' + d[1] + '</span></div>' +
      '<div class="weather-body"><div class="trip-weather-route">' + d[2] + '</div><div style="font-size:14px;line-height:1.7">实时预报暂不可用。' + d[7] + '</div><div style="font-size:12px;opacity:.6;margin-top:6px">' + (e || '') + '</div></div></div>';
  }

  async function loadWeather() {
    styles();
    var box = document.getElementById("weatherCards");
    var status = document.getElementById("weatherStatusNote");
    if (!box || !status) return;
    status.textContent = "正在按每天实际行程获取 2026.10.2–10.9 最新预报…";
    box.innerHTML = '<div class="note-box">正在获取第比利斯、西格纳吉、巴统、库塔伊西、卡兹别克和 Juta 的逐日天气…</div>';

    var rs = await Promise.all(DAYS.map(async function(d){
      try { return {d:d, x:await fetchDay(d)}; }
      catch(e) { return {d:d, e:e}; }
    }));

    box.innerHTML = rs.map(function(r){ return r.x ? card(r.d,r.x) : fallback(r.d, r.e && r.e.message); }).join("");
    var ok = rs.filter(function(r){return !!r.x;}).length;
    if (ok === DAYS.length) {
      status.innerHTML = "<b>2026.10.2–10.9 行程天气</b> · 已更新 " + ok + "/8 天 · 数据：Open-Meteo<br><span style='opacity:.72'>10/7 Juta 山区预报变化快，建议前一晚再次刷新，并以向导当天判断为准。</span>";
    } else {
      status.innerHTML = "<b>2026.10.2–10.9 行程天气</b> · 已获取 " + ok + "/8 天；部分日期暂时超出预报范围或网络不可用。";
    }
  }

  window.loadWeather = loadWeather;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadWeather);
  else loadWeather();
})();