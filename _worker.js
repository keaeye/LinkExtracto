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

    // 如果解码后的内容看起来像是一个 JavaScript 函数（即包含 `function link() { [native code] }`），则说明解析失败
    if (decodedContent.includes("function link() { [native code] }")) {
        console.error("Decoded content appears to be invalid JavaScript code.");
        return [];
    }

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
        "西班牙": "ES", "葡萄牙": "PT", "瑞士": "CH", "比利时": "BE", "奥地利": "AT", "爱尔兰": "IE", "葡萄牙": "PT"
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
