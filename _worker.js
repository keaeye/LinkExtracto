export default {
    async fetch(请求, env) {
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

        const plainTextContent = validLinks.join('\n');
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
        return null;
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
    let match;

    while ((match = regex.exec(decodedContent)) !== null) {
        const ip = match[2];
        const port = match[3];
        const countryCode = match[5];

        // 获取格式化链接并识别国家
        const formattedLink = `${ip}:${port}#${getCountryName(countryCode)}`;
        links.push(formattedLink);
    }

    // 过滤无效的链接，确保是有效的 IP 地址格式
    return links.filter(link => /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(link.split('#')[0]));
}

// 添加国家识别功能
function getCountryName(countryCode) {
    const countryMap = {
        'HK': '香港',
        'KR': '韩国',
        'US': '美国',
        'JP': '日本',
        'SG': '新加坡',
        'TW': '台湾',
        'CA': '加拿大',
        'GB': '英国',
        'AU': '澳大利亚',
        'DE': '德国',
        'FR': '法国',
        'IT': '意大利',
        'ES': '西班牙',
        'IN': '印度',
        'BR': '巴西',
        'RU': '俄罗斯',
        'ZA': '南非',
        'MX': '墨西哥',
        'NG': '尼日利亚',
        'AR': '阿根廷',
        'EG': '埃及',
        'SE': '瑞典',
        'NO': '挪威',
        'FI': '芬兰',
        'PL': '波兰',
        'GR': '希腊',
        'NL': '荷兰',
        'BE': '比利时',
        'CH': '瑞士',
        'AT': '奥地利',
        'DK': '丹麦',
        'IE': '爱尔兰',
        'PT': '葡萄牙',
        'HU': '匈牙利',
        'CZ': '捷克',
        'RO': '罗马尼亚',
        'UA': '乌克兰',
        'IL': '以色列',
        'KW': '科威特',
        'SA': '沙特阿拉伯',
        'QA': '卡塔尔',
        'AE': '阿联酋',
        'OM': '阿曼',
        'BD': '孟加拉',
        'LK': '斯里兰卡',
        'PK': '巴基斯坦',
        'KH': '柬埔寨',
        'TH': '泰国',
        'VN': '越南',
        'MY': '马来西亚',
        'PH': '菲律宾',
        'ID': '印度尼西亚',
        'PE': '秘鲁',
        'CL': '智利',
        'CO': '哥伦比亚',
        'VE': '委内瑞拉',
        'PA': '巴拿马',
        'EC': '厄瓜多尔',
        'GT': '危地马拉',
        'BO': '玻利维亚',
        'PY': '巴拉圭',
        'HN': '洪都拉斯',
        'SV': '萨尔瓦多',
        'CR': '哥斯达黎加',
        'UY': '乌拉圭',
        'DO': '多米尼加',
        'BS': '巴哈马',
        'JM': '牙买加',
        'HT': '海地',
        'BB': '巴巴多斯',
        'LC': '圣卢西亚',
    };

    return countryMap[countryCode] || countryCode;  // 若无匹配则返回原始代码
}
