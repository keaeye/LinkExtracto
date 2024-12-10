export default {
    async fetch(request, env) {
        const urls = (env.URL || "").split("\n").map(url => url.trim()).filter(url => url !== "");

        if (urls.length === 0) {
            return new Response(
                "You have not set any URLs. Please provide URLs to fetch data.\n",
                { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            );
        }

        const allLinks = await Promise.all(urls.map(url => fetchLinks(url)));

        const validLinks = allLinks.flat().filter(link => link);

        if (validLinks.length === 0) {
            return new Response("No valid links found.\n", { status: 500 });
        }

        // 按国家分组，随机取一半
        const selectedLinks = selectRandomHalfByCountry(validLinks);

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
        "土耳其": "TR"
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

        // 排除特定国家的代码
        const excludeCountries = ["TR", "RU", "LT", "DK", "SE", "FI", "NO", "DE", "NL", "IT", "FR", "GB", "AU", "CA", "PL"];
        
        // 只保留不在排除列表中的有效国家代码链接
        if (countryCode && !excludeCountries.includes(countryCode)) {
            links.push({ link: formattedLink, countryCode: countryCode });
        }
    }

    // 过滤无效的链接，确保是有效的 IP 地址格式
    return links.filter(link => /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(link.link.split('#')[0]));
}

// 按新的国家顺序排序链接，并随机选择一半
function selectRandomHalfByCountry(links) {
    const countryOrder = [
        "US", "KR", "TW", "JP", "SG", "HK", "CA", "AU", "GB", "FR", "IT", "NL", "DE", "NO",
        "FI", "SE", "DK", "LT", "RU", "IN", "TR"
    ];

    const groupedLinks = {};

    // 分组链接
    links.forEach(({ link, countryCode }) => {
        if (!groupedLinks[countryCode]) {
            groupedLinks[countryCode] = [];
        }
        groupedLinks[countryCode].push(link);
    });

    // 按国家排序并随机选一半
    const result = [];
    countryOrder.forEach(country => {
        if (groupedLinks[country]) {
            const linksForCountry = groupedLinks[country];
            const halfCount = Math.ceil(linksForCountry.length / 2);

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
