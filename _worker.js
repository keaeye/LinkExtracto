export default {
    async fetch(request, env) {
        const urls = (env.URL || "").split("\n").map(url => url.trim()).filter(url => url !== "");

        if (urls.length === 0) {
            return new Response(
                "You have not set any URLs. Please provide URLs to fetch data.\n",
                { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            );
        }

        // 检查是否包含 /KY 参数
        const url = new URL(request.url);
        const isUnfiltered = url.pathname.endsWith("/KY");

        const allLinks = await Promise.all(urls.map(url => fetchLinks(url)));

        const validLinks = allLinks.flat().filter(link => link);

        if (validLinks.length === 0) {
            return new Response("No valid links found.\n", { status: 500 });
        }

        let selectedLinks;
        if (isUnfiltered) {
            // 不过滤国家，按国家排序并返回所有链接
            selectedLinks = sortLinksByCountry(validLinks);
        } else {
            // 按国家分组，随机取一半，排除指定国家
            selectedLinks = selectRandomHalfByCountry(validLinks);
        }

        // 替换第一行的 #国家代码 为 #Keaeye提供
        if (selectedLinks.length > 0) {
            selectedLinks[0] = selectedLinks[0].replace(/#\w+$/, "#Keaeye提供");
        }

        const plainTextContent = selectedLinks.join('\n');
        return new Response(plainTextContent + "\n", {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
};

async function fetchLinks(url) {
    let base64Data;
    try {
        base64Data = await fetch(url).then(res => res.text());
    } catch (err) {
        console.error(`Failed to fetch from ${url}:`, err);
        return [];
    }

    if (!base64Data) {
        return [];
    }

    let decodedContent;
    try {
        decodedContent = atob(base64Data);
    } catch (e) {
        console.error("Failed to decode the content:", e);
        return [];
    }

    decodedContent = decodeURIComponent(decodedContent);
    return extractLinks(decodedContent);
}

function extractLinks(decodedContent) {
    const regex = /vless:\/\/([a-zA-Z0-9\-]+)@([^:]+):(\d+)\?([^#]+)#([^\n]+)/g;
    const links = [];
    const countryMapping = {
    "香港": "HK",
    "韩国": "KR",
    "台湾": "TW",
    "日本": "JP",
    "新加坡": "SG",
    "美国": "US",
    "加拿大": "CA",
    "澳大利亚": "AU",
    "英国": "GB",
    "法国": "FR",
    "意大利": "IT",
    "荷兰": "NL",
    "德国": "DE",
    "挪威": "NO",
    "芬兰": "FI",
    "瑞典": "SE",
    "丹麦": "DK",
    "立陶宛": "LT",
    "俄罗斯": "RU",
    "印度": "IN",
    "土耳其": "TR",
    "阿根廷": "AR",
    "巴西": "BR",
    "墨西哥": "MX",
    "南非": "ZA",
    "新西兰": "NZ",
    "西班牙": "ES",
    "葡萄牙": "PT",
    "瑞士": "CH",
    "比利时": "BE",
    "奥地利": "AT",
    "爱尔兰": "IE",
    "葡萄牙": "PT",
    "希腊": "GR",
    "卢森堡": "LU",
    "波兰": "PL",
    "捷克": "CZ",
    "匈牙利": "HU",
    "罗马尼亚": "RO",
    "保加利亚": "BG",
    "乌克兰": "UA",
    "哈萨克斯坦": "KZ",
    "白俄罗斯": "BY",
    "爱沙尼亚": "EE",
    "拉脱维亚": "LV",
    "立陶宛": "LT",
    "芬兰": "FI",
    "斯洛文尼亚": "SI",
    "斯洛伐克": "SK",
    "塞尔维亚": "RS",
    "阿尔巴尼亚": "AL",
    "北马其顿": "MK",
    "摩尔多瓦": "MD",
    "波黑": "BA",
    "黑山": "ME",
    "科索沃": "KS",
    "科威特": "KW",
    "阿曼": "OM",
    "卡塔尔": "QA",
    "巴林": "BH",
    "沙特阿拉伯": "SA",
    "阿联酋": "AE",
    "以色列": "IL",
    "黎巴嫩": "LB",
    "约旦": "JO",
    "叙利亚": "SY",
    "伊拉克": "IQ",
    "伊朗": "IR",
    "印度尼西亚": "ID",
    "马来西亚": "MY",
    "菲律宾": "PH",
    "泰国": "TH",
    "越南": "VN",
    "孟加拉国": "BD",
    "巴基斯坦": "PK",
    "尼泊尔": "NP",
    "斯里兰卡": "LK",
    "马尔代夫": "MV",
    "马里": "ML",
    "加纳": "GH",
    "科特迪瓦": "CI",
    "尼日利亚": "NG",
    "肯尼亚": "KE",
    "乌干达": "UG",
    "坦桑尼亚": "TZ",
    "埃及": "EG",
    "利比亚": "LY",
    "阿尔及利亚": "DZ",
    "摩洛哥": "MA",
    "突尼斯": "TN",
    "苏丹": "SD",
    "南苏丹": "SS",
    "沙特阿拉伯": "SA",
    "安哥拉": "AO",
    "纳米比亚": "NA",
    "博茨瓦纳": "BW",
    "莫桑比克": "MZ",
    "津巴布韦": "ZW",
    "赞比亚": "ZM",
    "卢旺达": "RW",
    "贝尔哈": "BW",
    "塞舌尔": "SC",
    "毛里求斯": "MU",
    "瑞士": "CH",
    "列支敦士登": "LI",
    "摩纳哥": "MC",
    "圣马力诺": "SM",
    "梵蒂冈": "VA",
    "澳门": "MO",
    "美属萨摩亚": "AS",
    "关岛": "GU",
    "波多黎各": "PR",
    "北马其顿": "MK",
    "巴哈马": "BS",
    "巴巴多斯": "BB",
    "圣文森特和格林纳丁斯": "VC",
    "特立尼达和多巴哥": "TT",
    "圭亚那": "GY",
    "伯利兹": "BZ",
    "圣基茨和尼维斯": "KN",
    "安提瓜和巴布达": "AG",
    "多米尼克": "DM",
    "圣卢西亚": "LC",
    "格林纳达": "GD",
    "圣多美和普林西比": "ST",
    "佛得角": "CV",
    "赤道几内亚": "GQ",
    "博茨瓦纳": "BW",
    "摩尔多瓦": "MD",
    "美属维尔京群岛": "VI",
    "库克群岛": "CK",
    "瑙鲁": "NR",
    "帕劳": "PW",
    "索马里兰": "SO",
    "东帝汶": "TL",
    "萨尔瓦多": "SV",
    "洪都拉斯": "HN",
    "尼加拉瓜": "NI",
    "哥斯达黎加": "CR",
    "巴拿马": "PA",
    "哥伦比亚": "CO",
    "厄瓜多尔": "EC",
    "秘鲁": "PE",
    "玻利维亚": "BO",
    "智利": "CL",
    "巴拉圭": "PY",
    "阿根廷": "AR",
    "乌拉圭": "UY",
    "委内瑞拉": "VE",
    "古巴": "CU",
    "牙买加": "JM",
    "海地": "HT",
    "多米尼加共和国": "DO",
    "贝尔哈": "BW",
    "圣巴巴拉": "BB"
    };

    let match;
    while ((match = regex.exec(decodedContent)) !== null) {
        const ip = match[2];
        const port = match[3];
        let countryCode = match[5];

        // 映射国家
        for (let country in countryMapping) {
            if (countryCode.includes(country)) {
                countryCode = countryMapping[country];
                break;
            }
        }

        // 去除#后面的特殊字符和文本
        countryCode = countryCode.replace(/[^A-Za-z]/g, ''); // 只保留字母字符

        // 形成格式化的链接
        const formattedLink = `${ip}:${port}#${countryCode}`;

        links.push({ link: formattedLink, countryCode: countryCode });
    }

    // 过滤无效的链接，确保是有效的 IP 地址格式
    return links.filter(link => /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(link.link.split('#')[0]));
}

// 按国家排序链接
function sortLinksByCountry(links) {
    const countryOrder = [
        "US", "KR", "TW", "JP", "SG", "HK", "CA", "AU", "GB", "FR", "IT", "NL", "DE", "NO",
        "FI", "SE", "DK", "LT", "RU", "IN", "TR"
    ];

    // 按国家排序
    return links.sort((a, b) => {
        const countryIndexA = countryOrder.indexOf(a.countryCode);
        const countryIndexB = countryOrder.indexOf(b.countryCode);

        if (countryIndexA === -1) return 1; // 如果没有找到，排在最后
        if (countryIndexB === -1) return -1;

        return countryIndexA - countryIndexB;
    }).map(link => link.link); // 返回链接而不是对象
}

// 按新的国家顺序排序链接，并随机选择一半，排除特定国家
function selectRandomHalfByCountry(links) {
    const countryOrder = [
        "US", "KR", "JP", "SG", "HK", "CA", "AU", "GB", "TW", "FR", "IT", "NL", "DE", "NO", "FI", "SE", "DK", "LT", "RU", "IN", "TR"
    ];

    const excludeCountries = ["TR", "RU", "LT", "DK", "SE", "FI", "NO", "DE", "NL", "IT", "FR", "AU", "CA", "PL"];

    const groupedLinks = {};

    // 分组链接
    links.forEach(({ link, countryCode }) => {
        if (!excludeCountries.includes(countryCode)) {
            if (!groupedLinks[countryCode]) {
                groupedLinks[countryCode] = [];
            }
            groupedLinks[countryCode].push(link);
        }
    });

 // 按国家排序并随机选择每个国家的5个链接
const result = [];
countryOrder.forEach(country => {
    if (groupedLinks[country]) {
        const linksForCountry = groupedLinks[country];
        
        // 随机选择每个国家的前5个链接
        const selectedLinks = shuffleArray(linksForCountry).slice(0, 5);
        result.push(...selectedLinks);
    }
});

return result;

            // 随机选择
            const selectedLinks = shuffleArray(linksForCountry).slice(0, halfCount);
            result.push(...selectedLinks);
        }
    });

    return result;
}

// 洗牌算法随机打乱数组
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
