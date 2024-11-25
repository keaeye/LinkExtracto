export default {
    async fetch(request, env) {
        // 获取 URL 输入
        const urls = env.URL;

        if (!urls) {
            return new Response(
                "You have not set the URL. 请填写 URL 以便提取数据。",
                { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            );
        }

        // 将多行 URL 转为数组
        const urlList = urls.split('\n').map(url => url.trim()).filter(url => url);

        if (urlList.length === 0) {
            return new Response("No valid URLs provided", { status: 400 });
        }

        let allLinks = [];

        // 使用 Promise.all 并发请求以提升效率
        await Promise.all(
            urlList.map(async (url) => {
                try {
                    const response = await fetch(url);
                    const base64Data = await response.text();

                    const decodedContent = atob(base64Data);
                    const links = extractLinks(decodedContent);

                    allLinks = [...allLinks, ...links];
                } catch (err) {
                    console.error(`Failed to fetch or process URL: ${url}`, err);
                }
            })
        );

        if (allLinks.length === 0) {
            return new Response("No valid links found", { status: 500 });
        }

        const plainTextContent = allLinks.join('\n');

        return new Response(plainTextContent, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
};

function extractLinks(decodedContent) {
    const regex = /vless:\/\/([a-zA-Z0-9\-]+)@([^:]+):(\d+)\?([^#]+)#([^%]+)%F0%9F%90%B2/g;
    const links = [];
    let match;

    const countryMapping = {
    '美国': 'US', '新加坡': 'SG', '日本': 'JP', '韩国': 'KR', '俄罗斯': 'RU',
    '中国': 'CN', '印度': 'IN', '法国': 'FR', '德国': 'DE', '英国': 'GB',
    '澳大利亚': 'AU', '加拿大': 'CA', '巴西': 'BR', '阿根廷': 'AR', '意大利': 'IT',
    '西班牙': 'ES', '墨西哥': 'MX', '印度尼西亚': 'ID', '南非': 'ZA', '荷兰': 'NL',
    '瑞士': 'CH', '瑞典': 'SE', '比利时': 'BE', '挪威': 'NO', '芬兰': 'FI',
    '波兰': 'PL', '葡萄牙': 'PT', '奥地利': 'AT', '丹麦': 'DK', '爱尔兰': 'IE',
    '以色列': 'IL', '新西兰': 'NZ', '泰国': 'TH', '马来西亚': 'MY', '菲律宾': 'PH',
    '越南': 'VN', '沙特阿拉伯': 'SA', '阿联酋': 'AE', '土耳其': 'TR', '巴基斯坦': 'PK',
    '孟加拉国': 'BD', '乌克兰': 'UA', '希腊': 'GR', '罗马尼亚': 'RO', '捷克': 'CZ',
    '匈牙利': 'HU', '斯洛伐克': 'SK', '保加利亚': 'BG', '克罗地亚': 'HR', '斯洛文尼亚': 'SI',
    '立陶宛': 'LT', '拉脱维亚': 'LV', '爱沙尼亚': 'EE', '摩尔多瓦': 'MD', '格鲁吉亚': 'GE',
    '哈萨克斯坦': 'KZ', '乌兹别克斯坦': 'UZ', '白俄罗斯': 'BY', '阿尔巴尼亚': 'AL',
    '塞尔维亚': 'RS', '马其顿': 'MK', '科索沃': 'KS', '马尔代夫': 'MV', '斯里兰卡': 'LK',
    '缅甸': 'MM', '柬埔寨': 'KH', '老挝': 'LA', '尼泊尔': 'NP', '蒙古': 'MN',
    '巴勒斯坦': 'PS', '叙利亚': 'SY', '也门': 'YE', '黎巴嫩': 'LB', '约旦': 'JO',
    '阿曼': 'OM', '科威特': 'KW', '卡塔尔': 'QA', '巴林': 'BH', '圣基茨和尼维斯': 'KN',
    '圣卢西亚': 'LC', '圣文森特和格林纳丁斯': 'VC', '巴巴多斯': 'BB', '特立尼达和多巴哥': 'TT',
    '牙买加': 'JM', '格林纳达': 'GD', '海地': 'HT', '伯利兹': 'BZ', '危地马拉': 'GT',
    '萨尔瓦多': 'SV', '洪都拉斯': 'HN', '尼加拉瓜': 'NI', '哥斯达黎加': 'CR', '巴拿马': 'PA',
    '哥伦比亚': 'CO', '厄瓜多尔': 'EC', '秘鲁': 'PE', '智利': 'CL', '玻利维亚': 'BO',
    '巴拉圭': 'PY', '乌拉圭': 'UY', '萨摩亚': 'WS', '库克群岛': 'CK'
};

    while ((match = regex.exec(decodedContent)) !== null) {
        const ip = match[2];
        const port = match[3];
        let countryName = decodeURIComponent(match[5]);

        const countryCode = countryMapping[countryName] || countryName;
        const formattedLink = `${ip}:${port}#${countryCode}`;
        links.push(formattedLink);
    }

    // 排序、过滤和随机选择逻辑
    links.sort((a, b) => {
        const countryA = a.split('#')[1];
        const countryB = b.split('#')[1];
        return countryA.localeCompare(countryB);
    });

    const filteredLinks = links.filter(link => !link.includes('#PL'));

    const countryMap = {};
    filteredLinks.forEach(link => {
        const country = link.split('#')[1];
        if (!countryMap[country]) {
            countryMap[country] = [];
        }
        countryMap[country].push(link);
    });

    const finalLinks = [];
    Object.keys(countryMap).forEach(country => {
        const countryLinks = countryMap[country];
        const randomSelection = randomSelectHalf(countryLinks);
        finalLinks.push(...randomSelection);
    });

    if (finalLinks.length > 0) {
        const firstLink = finalLinks[0];
        const firstLinkParts = firstLink.split('#');
        const modifiedFirstLink = `${firstLinkParts[0]}#Keaeye提供`;
        finalLinks[0] = modifiedFirstLink;
    }

    return finalLinks;
}

function randomSelectHalf(arr) {
    const shuffled = arr.sort(() => 0.5 - Math.random());
    const half = Math.floor(shuffled.length / 2);
    return shuffled.slice(0, half);
}
