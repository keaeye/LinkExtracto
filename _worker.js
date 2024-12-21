export default {
    async fetch(request, env) {
        const urls = (env.URL || "").split("\n").map(url => url.trim()).filter(url => url !== "");

        if (urls.length === 0) {
            return new Response(
                "You have not set any URLs. Please provide URLs to fetch data.\n",
                { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            );
        }

        // 获取 Cloudflare Pages 环境变量 LINK 的值
        const linkEnv = (env.LINK || "").split("\n").map(link => link.trim()).filter(link => link !== "");

        // 检查是否包含 /KY 参数
        const url = new URL(request.url);
        const isUnfiltered = url.pathname.endsWith("/KY");

        let allLinks;
        try {
            // 获取 vless 链接
            allLinks = await Promise.all(urls.map(url => fetchLinks(url)));
        } catch (err) {
            console.error("Error fetching links:", err);
            return new Response("Failed to fetch links from provided URLs.", { status: 500 });
        }

        const validLinks = allLinks.flat().filter(link => link);

        if (validLinks.length === 0) {
            return new Response("No valid links found.\n", { status: 500 });
        }

        // 将 LINK 环境变量中的链接添加到结果中
        let allFinalLinks = [...validLinks, ...linkEnv];

        // 去重链接
        const uniqueLinks = Array.from(new Set(allFinalLinks));

        let selectedLinks;
        if (isUnfiltered) {
            // 不过滤国家，按国家排序并返回所有链接
            selectedLinks = sortLinksByCountry(uniqueLinks);
        } else {
            // 按国家分组，随机取一半，排除指定国家
            selectedLinks = selectRandomFiveByCountry(uniqueLinks);
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

// 从 URL 中提取 IP 和端口
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
        "香港": "HK", "韩国": "KR", "台湾": "TW", "日本": "JP", "新加坡": "SG", "美国": "US",
        "加拿大": "CA", "澳大利亚": "AU", "英国": "GB", "法国": "FR", "意大利": "IT", "荷兰": "NL",
        "德国": "DE", "挪威": "NO", "芬兰": "FI", "瑞典": "SE", "丹麦": "DK", "立陶宛": "LT", "俄罗斯": "RU",
        "印度": "IN", "土耳其": "TR", "阿根廷": "AR", "巴西": "BR", "墨西哥": "MX", "南非": "ZA", "新西兰": "NZ",
        "西班牙": "ES", "瑞士": "CH", "比利时": "BE", "奥地利": "AT", "爱尔兰": "IE", "葡萄牙": "PT"
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

        links.push(formattedLink);  // 返回链接而非对象
    }

    // 过滤无效的链接，确保是有效的 IP 地址格式
    return links.filter(link => /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(link.split('#')[0]));
}

// 返回只包含字符串的链接
function sortLinksByCountry(links) {
    const countryOrder = [
        "US", "KR", "TW", "JP", "SG", "HK", "CA", "AU", "GB", "FR", "IT", "NL", "DE", "NO", "FI", "SE", "DK", "LT", "RU", "IN", "TR"
    ];

    // 按国家排序
    return links.sort((a, b) => {
        const countryIndexA = countryOrder.indexOf(a.split("#")[1]);
        const countryIndexB = countryOrder.indexOf(b.split("#")[1]);

        if (countryIndexA === -1) return 1; // 如果没有找到，排在最后
        if (countryIndexB === -1) return -1;

        return countryIndexA - countryIndexB;
    });
}

// 过滤和返回纯链接
function selectRandomFiveByCountry(links) {
    const countryOrder = [
        "US", "HK", "JP", "KR", "SG", "CA", "AU", "GB", "TW", "FR", "IT", "NL", "DE", "NO", "FI", "SE", "DK", "LT", "RU", "IN", "TR"
    ];

    const excludeCountries = ["TR", "RU", "LT", "DK", "SE", "FI", "NO", "DE", "NL", "IT", "TW", "AU", "CA", "PL"];

    const groupedLinks = {};

    // 分组链接
    links.forEach(link => {
        const countryCode = link.split("#")[1];
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

            // 先去重，然后随机选择每个国家的前5个链接
            const uniqueLinks = Array.from(new Set(linksForCountry));
            const selectedLinks = shuffleArray(uniqueLinks).slice(0, 5);
            selectedLinks.forEach(link => {
                if (!result.includes(link)) {
                    result.push(link);
                }
            });
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
